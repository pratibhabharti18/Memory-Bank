
import React, { useState, useRef, useEffect } from 'react';
import { Note, ChatMessage } from '../types';
import { chatWithKnowledge } from '../services/geminiService';

interface AssistantProps {
  notes: Note[];
}

const Assistant: React.FC<AssistantProps> = ({ notes }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: ChatMessage = { 
      role: 'user', 
      content: input, 
      timestamp: Date.now() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithKnowledge(input, notes, messages);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I encountered an error connecting to your second brain.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto animate-in fade-in duration-500">
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900">Brain Assistant</h2>
        <p className="text-slate-500">Interrogate your accumulated knowledge.</p>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-white border border-slate-100 rounded-3xl p-6 mb-6 shadow-inner space-y-6"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Welcome to your Second Brain</h3>
            <p className="text-slate-500 text-sm max-w-sm mb-6">
              Ask me anything about your notes. I have access to your semantic memory and vector embeddings.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-md">
              {[
                "Summarize my thoughts on productivity.",
                "Find connections between AI and philosophy.",
                "What was I thinking about last Tuesday?",
                "Give me a study plan based on my notes."
              ].map(q => (
                <button 
                  key={q}
                  onClick={() => setInput(q)}
                  className="p-3 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-100 transition-colors text-left font-medium"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white shadow-md rounded-tr-none' 
                    : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-4 flex gap-1">
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
      </div>

      <div className="relative group">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your question..."
          className="w-full bg-white border border-slate-200 rounded-2xl pl-6 pr-14 py-4 focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm group-hover:border-indigo-300 resize-none overflow-hidden"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="absolute right-3 top-3 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </button>
      </div>
      <p className="text-[10px] text-center text-slate-400 mt-4 font-mono uppercase tracking-widest">
        Powered by Gemini 3 Reasoning Engine • RAG Enabled
      </p>
    </div>
  );
};

export default Assistant;
