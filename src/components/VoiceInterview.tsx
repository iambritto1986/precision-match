import React, { useState, useEffect, useRef } from 'react';
import { Loader2, PhoneOff } from 'lucide-react';
import { ResumeData } from '../types';

export default function VoiceInterview({ resumeData, deductCredits }: { resumeData: ResumeData, deductCredits: (amount: number) => boolean }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const aiSpeakingTimeoutRef = useRef<any>(null);

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

      // Track AI speaking state
      setAiSpeaking(true);
      if (aiSpeakingTimeoutRef.current) clearTimeout(aiSpeakingTimeoutRef.current);
      aiSpeakingTimeoutRef.current = setTimeout(() => setAiSpeaking(false), 600);
    } catch(e) {
      console.error(e);
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
          if (ws.readyState === WebSocket.OPEN && !isMuted) {
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

  const connectAndStart = async () => {
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
           // Auto-start recording so user can respond naturally
           setTimeout(() => startRecording(), 500);
        }
        if (msg.audio) {
           playAudioChunk(outputAudioCtx, msg.audio);
        }
        if (msg.interrupted) {
          nextStartTimeRef.current = outputAudioCtx.currentTime;
          setAiSpeaking(false);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsRecording(false);
        setIsConnecting(false);
        setAiSpeaking(false);
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

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  useEffect(() => {
     return () => { disconnectVoice(); };
  }, []);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine orb visual state
  const orbState = !isConnected ? 'idle' : aiSpeaking ? 'ai-speaking' : (isRecording && !isMuted) ? 'user-speaking' : 'listening';

  return (
    <div className="flex flex-col items-center justify-center w-full h-full font-inter relative overflow-hidden select-none">
      
      {/* Ambient background glow */}
      <div className={`absolute w-[500px] h-[500px] rounded-full blur-[150px] transition-all duration-1000 pointer-events-none ${
        orbState === 'ai-speaking' ? 'bg-cyan-500/15 scale-125' :
        orbState === 'user-speaking' ? 'bg-fuchsia-500/15 scale-110' :
        isConnected ? 'bg-indigo-500/10 scale-100' :
        'bg-slate-500/5 scale-90'
      }`} />

      {/* Top status bar */}
      {isConnected && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-300">Live</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-xs font-mono text-slate-400">{formatDuration(callDuration)}</span>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8">
        
        {/* Candidate info */}
        {isConnected && (
          <div className="text-center animate-fade-in">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-1">AI Interview Coach</p>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {resumeData.personalDetails.name || 'Professional Candidate'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {resumeData.personalDetails.title || 'Product Role'}
            </p>
          </div>
        )}

        {/* The Dynamic Orb */}
        <div 
          className="relative cursor-pointer group"
          onClick={isConnected ? toggleMute : undefined}
          title={isConnected ? (isMuted ? 'Tap to unmute' : 'Tap to mute') : ''}
        >
          {/* Outer breathing rings */}
          <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
            orbState === 'ai-speaking' 
              ? 'animate-orb-ring-ai scale-[1.6] bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 blur-xl' 
              : orbState === 'user-speaking'
              ? 'animate-orb-ring-user scale-[1.5] bg-gradient-to-tr from-fuchsia-500/20 to-rose-500/20 blur-xl'
              : isConnected
              ? 'animate-orb-ring-idle scale-[1.3] bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 blur-lg'
              : 'scale-100 opacity-0'
          }`} />
          
          {/* Secondary ring */}
          <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
            orbState === 'ai-speaking'
              ? 'animate-orb-ring-ai-2 scale-[1.3] bg-gradient-to-bl from-cyan-400/15 to-blue-500/15 blur-lg'
              : orbState === 'user-speaking'
              ? 'animate-orb-ring-user-2 scale-[1.25] bg-gradient-to-bl from-rose-400/15 to-orange-500/15 blur-lg'
              : 'scale-100 opacity-0'
          }`} />

          {/* Core orb */}
          <div className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 ${
            orbState === 'ai-speaking'
              ? 'bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-[0_0_60px_rgba(6,182,212,0.4)] scale-110'
              : orbState === 'user-speaking'
              ? 'bg-gradient-to-tr from-fuchsia-500 to-rose-500 shadow-[0_0_60px_rgba(217,70,239,0.4)] scale-105'
              : isConnected
              ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-[0_0_30px_rgba(99,102,241,0.25)]'
              : 'bg-gradient-to-tr from-slate-700 to-slate-800 shadow-[0_0_20px_rgba(100,116,139,0.1)] group-hover:from-indigo-700 group-hover:to-purple-700 group-hover:shadow-[0_0_40px_rgba(99,102,241,0.2)]'
          }`}>
            
            {/* Inner shimmer layer */}
            <div className={`absolute inset-1 rounded-full bg-gradient-to-b from-white/10 to-transparent transition-opacity duration-500 ${
              isConnected ? 'opacity-100' : 'opacity-50'
            }`} />

            {/* Center icon / indicator */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              {isConnecting ? (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              ) : isMuted && isConnected ? (
                <>
                  <div className="w-10 h-10 flex items-center justify-center">
                    <div className="w-8 h-0.5 bg-white/70 rounded-full rotate-45 absolute" />
                    <svg className="w-10 h-10 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/60 mt-1">Muted</span>
                </>
              ) : orbState === 'ai-speaking' ? (
                <>
                  {/* Animated bars for AI speaking */}
                  <div className="flex items-end gap-[3px] h-10">
                    {[0, 0.1, 0.2, 0.3, 0.2, 0.1, 0].map((delay, i) => (
                      <div 
                        key={i}
                        className="w-[3px] bg-white/90 rounded-full animate-ai-bar"
                        style={{ animationDelay: `${delay}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 mt-1">Speaking</span>
                </>
              ) : orbState === 'user-speaking' ? (
                <>
                  <div className="flex items-end gap-[3px] h-10">
                    {[0, 0.15, 0.05, 0.2, 0.1, 0.25, 0.08].map((delay, i) => (
                      <div 
                        key={i}
                        className="w-[3px] bg-white/90 rounded-full animate-user-bar"
                        style={{ animationDelay: `${delay}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 mt-1">Listening</span>
                </>
              ) : (
                <>
                  <svg className="w-10 h-10 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                  {!isConnected && <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 mt-1">Ready</span>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status text */}
        <div className="text-center min-h-[48px] max-w-xs">
          {error ? (
            <p className="text-red-400 text-sm font-medium">{error}</p>
          ) : !isConnected && !isConnecting ? (
            <p className="text-slate-400 text-sm leading-relaxed">
              One tap to start a live practice interview with your AI career coach.
            </p>
          ) : isConnecting ? (
            <p className="text-indigo-300 text-sm font-medium animate-pulse">Connecting to your AI coach...</p>
          ) : isMuted ? (
            <p className="text-slate-400 text-sm">Microphone muted. <span className="text-indigo-400">Tap the orb</span> to unmute.</p>
          ) : aiSpeaking ? (
            <p className="text-cyan-300 text-sm font-medium">Your coach is speaking...</p>
          ) : (
            <p className="text-slate-400 text-sm">Your coach can hear you. Speak naturally.</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="relative z-10 w-full max-w-xs mt-8">
        {!isConnected ? (
          <button
            onClick={connectAndStart}
            disabled={isConnecting}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            {isConnecting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
            ) : (
              'Start Interview Session'
            )}
          </button>
        ) : (
          <button
            onClick={disconnectVoice}
            className="w-full py-3 bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 font-semibold text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <PhoneOff className="w-4 h-4" /> End Session
          </button>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes orb-ring-ai {
          0%, 100% { transform: scale(1.5); opacity: 0.6; }
          50% { transform: scale(1.7); opacity: 0.3; }
        }
        @keyframes orb-ring-ai-2 {
          0%, 100% { transform: scale(1.25); opacity: 0.5; }
          50% { transform: scale(1.4); opacity: 0.2; }
        }
        @keyframes orb-ring-user {
          0%, 100% { transform: scale(1.4); opacity: 0.5; }
          50% { transform: scale(1.6); opacity: 0.2; }
        }
        @keyframes orb-ring-user-2 {
          0%, 100% { transform: scale(1.2); opacity: 0.4; }
          50% { transform: scale(1.35); opacity: 0.15; }
        }
        @keyframes orb-ring-idle {
          0%, 100% { transform: scale(1.2); opacity: 0.3; }
          50% { transform: scale(1.35); opacity: 0.15; }
        }
        @keyframes ai-bar {
          0%, 100% { height: 8px; }
          50% { height: 32px; }
        }
        @keyframes user-bar {
          0%, 100% { height: 6px; }
          50% { height: 28px; }
        }
        .animate-orb-ring-ai { animation: orb-ring-ai 2s ease-in-out infinite; }
        .animate-orb-ring-ai-2 { animation: orb-ring-ai-2 2.5s ease-in-out infinite; }
        .animate-orb-ring-user { animation: orb-ring-user 1.5s ease-in-out infinite; }
        .animate-orb-ring-user-2 { animation: orb-ring-user-2 1.8s ease-in-out infinite; }
        .animate-orb-ring-idle { animation: orb-ring-idle 3s ease-in-out infinite; }
        .animate-ai-bar { animation: ai-bar 0.8s ease-in-out infinite; }
        .animate-user-bar { animation: user-bar 0.6s ease-in-out infinite; }
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
