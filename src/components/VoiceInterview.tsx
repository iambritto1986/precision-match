import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Play, Square, Video, Volume2, ShieldAlert } from 'lucide-react';
import { ResumeData } from '../types';

export default function VoiceInterview({ resumeData, deductCredits }: { resumeData: ResumeData, deductCredits: (amount: number) => boolean }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);

  const pcmToBase64 = (pcmData: Float32Array) => {
    const buffer = new ArrayBuffer(pcmData.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < pcmData.length; i++) {
        let s = Math.max(-1, Math.min(1, pcmData[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const nextStartTimeRef = useRef<number>(0);

  const playAudioChunk = (audioCtx: AudioContext, base64Audio: string) => {
    try {
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const buffer = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(buffer.length);
      for (let i = 0; i < buffer.length; i++) {
        float32Data[i] = buffer[i] / 32768.0;
      }
      
      const audioBuffer = audioCtx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      const currentTime = audioCtx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime + 0.05;
      }
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
    } catch(e) {
      console.error(e);
    }
  };

  const connectVoice = async () => {
    if (!deductCredits(5)) return;
    try {
      setError(null);
      setIsConnecting(true);
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${wsProtocol}//${window.location.host}/api/live`);
      wsRef.current = ws;

      const inputAudioCtx = new AudioContext({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputAudioCtx;
      
      const outputAudioCtx = new AudioContext({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputAudioCtx;

      ws.onopen = async () => {
        ws.send(JSON.stringify({ type: 'setup', data: JSON.stringify(resumeData) }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ready') {
           setIsConnected(true);
           setIsConnecting(false);
           setCallDuration(0);
           timerRef.current = setInterval(() => {
              setCallDuration(prev => prev + 1);
           }, 1000);
        }
        if (msg.audio) {
           playAudioChunk(outputAudioCtx, msg.audio);
        }
        if (msg.interrupted) {
          nextStartTimeRef.current = outputAudioCtx.currentTime; // reset queue slightly
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsRecording(false);
        setIsConnecting(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

    } catch (e) {
        console.error(e);
        setError("Could not connect to Voice API");
        setIsConnecting(false);
    }
  };

  const startRecording = async () => {
     try {
        const inputAudioCtx = inputAudioCtxRef.current;
        const ws = wsRef.current;
        if (!inputAudioCtx || !ws || ws.readyState !== WebSocket.OPEN) return;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const source = inputAudioCtx.createMediaStreamSource(stream);
        const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(inputAudioCtx.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
             const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
             ws.send(JSON.stringify({ audio: base64 }));
          }
        };

        setIsRecording(true);
     } catch(e) {
        console.error(e);
        setError("Could not access microphone. Check browser permissions.");
     }
  };

  const stopRecording = () => {
     if (processorRef.current && inputAudioCtxRef.current) {
        processorRef.current.disconnect();
     }
     if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
     }
     setIsRecording(false);
  };

  const disconnectVoice = () => {
     stopRecording();
     if (wsRef.current) {
        wsRef.current.close();
     }
     if (timerRef.current) {
       clearInterval(timerRef.current);
       timerRef.current = null;
     }
  };

  useEffect(() => {
     return () => { disconnectVoice(); };
  }, []);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full h-full font-inter">
      <div className="glass-modal text-white p-8 w-full max-w-lg text-center relative overflow-hidden flex flex-col items-center min-h-[480px] justify-between">
        
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 left-0"></div>

        {/* Top bar info */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-slate-500'}`}></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {isConnected ? 'Session Active' : isConnecting ? 'Connecting' : 'Offline'}
            </span>
          </div>
          {isConnected && (
            <div className="text-xs font-mono bg-white/10 border border-white/10 px-2.5 py-1 rounded-full text-slate-300">
              {formatDuration(callDuration)}
            </div>
          )}
        </div>

        {/* Call Info / Candidate Panel */}
        <div className="my-4 z-10">
          <p className="text-sm font-bold text-blue-400 uppercase tracking-widest">AI Interview Prep</p>
          <h3 className="text-xl font-black mt-1 tracking-tight text-white">
            {resumeData.personalDetails.name || 'Professional Candidate'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 italic font-medium">
            Role Focus: {resumeData.personalDetails.title || 'Product Role'}
          </p>
        </div>

        {/* Center Calling Ring & Waveform */}
        <div className="relative my-8 z-10 flex flex-col items-center justify-center">
          {/* Animated Glow behind Microphone */}
          <div className={`absolute w-36 h-36 rounded-full bg-blue-500/10 blur-xl transition-all duration-700 scale-110 ${isRecording ? 'opacity-80 scale-125 bg-red-500/10' : isConnected ? 'opacity-50' : 'opacity-0'}`}></div>
          
          <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-300 relative z-10 ${
            isConnected
              ? isRecording
                ? 'border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                : 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
              : 'border-slate-800 bg-slate-800/40'
          }`}>
            {!isConnected ? (
              <MicOff className="w-12 h-12 text-slate-500" />
            ) : isRecording ? (
              <Mic className="w-12 h-12 text-red-500 animate-pulse" />
            ) : (
              <Mic className="w-12 h-12 text-blue-400" />
            )}
          </div>

          {/* Visual Waveform (Only animate when listening/speaking) */}
          <div className="h-10 mt-6 flex items-center justify-center gap-1">
            {isConnected && isRecording ? (
              [0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.3].map((delay, index) => (
                <div
                  key={index}
                  className="w-1 bg-red-500 rounded-full transition-all"
                  style={{
                    height: '24px',
                    animation: `pulse 1s ease-in-out infinite alternate`,
                    animationDelay: `${delay}s`
                  }}
                />
              ))
            ) : isConnected ? (
              [0.1, 0.2, 0.15, 0.25, 0.1, 0.2, 0.15].map((delay, index) => (
                <div
                  key={index}
                  className="w-1 h-2 bg-blue-500/40 rounded-full"
                />
              ))
            ) : (
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Muted</div>
            )}
          </div>
        </div>

        {/* Dynamic Status / Guidance Text */}
        <div className="px-6 text-center min-h-[48px] z-10">
          {error ? (
            <p className="text-red-400 text-xs flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> {error}
            </p>
          ) : !isConnected ? (
            <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
              Connect to our AI career coach to practice common behavioral and technical interview questions based on your resume.
            </p>
          ) : isRecording ? (
            <p className="text-red-400 text-xs font-bold animate-pulse tracking-wide uppercase">
              AI Coach is listening... Speak clearly.
            </p>
          ) : (
            <p className="text-blue-300 text-xs font-medium max-w-xs mx-auto leading-relaxed">
              Call established! Click "Start Speaking" when you are ready to speak, and click it again to send your reply.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full mt-6 z-10">
          {!isConnected ? (
            <button
              onClick={connectVoice}
              disabled={isConnecting}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Securing Line...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  Connect to AI Coach
                </>
              )}
            </button>
          ) : (
            <div className="flex flex-col gap-3 w-full">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-green-500/15 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Speaking
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-red-500/15 flex items-center justify-center gap-2 animate-pulse"
                >
                  <Square className="w-4 h-4" />
                  Stop Speaking (Send Reply)
                </button>
              )}
              
              <button
                onClick={disconnectVoice}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-lg transition"
              >
                End Practice Session
              </button>
            </div>
          )}
        </div>

      </div>

      {/* CSS Pulse Animation keyframe fallback */}
      <style>{`
        @keyframes pulse {
          0% { height: 8px; }
          100% { height: 36px; }
        }
      `}</style>
    </div>
  );
}
