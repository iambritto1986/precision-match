import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, MessageCircle } from 'lucide-react';
import Markdown from 'react-markdown';

import { ResumeData } from '../types';

export default function CareerChat({ resumeData }: { resumeData: ResumeData }) {
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([{
      role: 'model',
      text: 'Hello! I am your Career Coach. Ask me anything to prepare for your next big role. You can enable **High Thinking Mode** below for complex inquiries like mock technical rounds or salary negotiation planning. I have your current resume handy.'
  }]);
  const [input, setInput] = useState('');
  const [thinkingMode, setThinkingMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const newMessages = [...messages, { role: 'user' as const, text: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          thinkingMode,
          resumeContext: JSON.stringify(resumeData)
        })
      });
      const data = await res.json();
      if (data.text) {
        setMessages([...newMessages, { role: 'model', text: data.text }]);
      }
    } catch (e) {
      console.error(e);
      setMessages([...newMessages, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full bg-white relative font-inter">
      <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/50 backdrop-blur z-10">
         <h2 className="text-sm font-bold text-slate-800 flex items-center">
            <MessageCircle className="w-4 h-4 mr-2 text-blue-500" />
            AI Career Advisor
         </h2>
         <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-100 transition">
            <input type="checkbox" checked={thinkingMode} onChange={e => setThinkingMode(e.target.checked)} className="sr-only" />
            <div className={`w-8 h-4 rounded-full relative transition-colors ${thinkingMode ? 'bg-indigo-500' : 'bg-slate-300'}`}>
               <div className={`absolute top-0 w-4 h-4 bg-white rounded-full shadow transition-all ${thinkingMode ? 'right-0' : 'left-0'}`}></div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600">High Thinking Mode</span>
         </label>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
           <div key={idx} className={`flex max-w-[80%] ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
              {msg.role === 'model' && (
                 <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 mr-3">
                    <Bot className="w-4 h-4 text-blue-600" />
                 </div>
              )}
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm shadow-md shadow-blue-200/50' : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-sm'}`}>
                 <div className="markdown-body">
                    <Markdown>{msg.text}</Markdown>
                 </div>
              </div>
           </div>
        ))}
        {loading && (
           <div className="flex max-w-[80%] mr-auto">
              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 mr-3">
                 <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 rounded-tl-sm flex items-center justify-center">
                 <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
              </div>
           </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus-within:ring-2 ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm">
           <input 
             value={input}
             onChange={e => setInput(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && sendMessage()}
             placeholder="Ask about interviewing, resume gaps, or salary..."
             className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400 py-2"
           />
           <button onClick={sendMessage} disabled={loading || !input.trim()} className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
              <Send className="w-4 h-4 ml-0.5" />
           </button>
        </div>
      </div>
    </div>
  );
}
