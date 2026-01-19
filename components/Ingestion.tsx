
import React, { useState, useRef } from 'react';
import { Note } from '../types';
import { extractKnowledge } from '../services/geminiService';

interface IngestionProps {
  onNoteAdded: (note: Note) => void;
  onSuccess: () => void;
}

type IngestMode = 'text' | 'pdf' | 'url' | 'voice' | 'image';

const Ingestion: React.FC<IngestionProps> = ({ onNoteAdded, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<IngestMode>('text');
  const [fileAttachment, setFileAttachment] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          setMode('voice');
          setStatus('Audio captured. Ready to commit.');
        };
        mediaRecorder.start();
        setIsRecording(true);
        setMode('voice');
        setStatus('Recording voice...');
      } catch (err) {
        setStatus('Microphone access denied.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, targetMode: IngestMode) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileAttachment(file);
      setMode(targetMode);
      setTitle(file.name);
      setStatus(`${file.name} selected. Ready to process.`);
    }
  };

  const toDataURL = (fileOrBlob: File | Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(fileOrBlob);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    if (mode === 'text' && !content.trim()) return;
    if (mode === 'url' && !content.includes('http')) {
        setStatus("Please enter a valid URL.");
        return;
    }

    setIsProcessing(true);
    setStatus(`Synthesizing intelligence from ${mode}...`);

    try {
      const attachment = mode === 'voice' ? audioBlob! : (fileAttachment || undefined);
      const metadata = await extractKnowledge(content, mode, attachment);
      
      let attachmentUrl = mode === 'url' ? content : '';
      if (attachment) {
        attachmentUrl = await toDataURL(attachment);
      }

      const newNote: Note = {
        id: Math.random().toString(36).substr(2, 9),
        type: mode,
        title: title || metadata.summary.substring(0, 40) + '...',
        original_file: {
          url: attachmentUrl,
          name: fileAttachment?.name || (mode === 'voice' ? 'recording.webm' : mode === 'url' ? 'website' : 'text-entry'),
          mime_type: fileAttachment?.type || (mode === 'voice' ? 'audio/webm' : 'text/plain')
        },
        extracted_text: content || metadata.summary, // The core knowledge sent to RAG
        summary: metadata.summary,
        timestamp: Date.now(),
        tags: [...metadata.tags, mode],
        entities: metadata.entities,
        isDeleted: false
      };

      onNoteAdded(newNote);
      setStatus('Committed to Memory successfully.');
      setTimeout(onSuccess, 800);
    } catch (error) {
      console.error(error);
      setStatus('Memory synthesis failed. Connection issue?');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetMode = (newMode: IngestMode) => {
    setMode(newMode);
    setFileAttachment(null);
    setAudioBlob(null);
    setStatus(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Ingest Knowledge</h2>
        <p className="text-slate-500">Capture multimodal sources. The AI will extract semantic meaning for long-term memory.</p>
      </header>

      <input type="file" ref={pdfInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleFileChange(e, 'pdf')} />
      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />

      <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Entry Subject</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project 'Phoenix' Initial Research"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {mode === 'url' ? 'Source URL' : 'Notes / Contextual Clues'}
            </label>
            <textarea 
              rows={mode === 'url' ? 2 : 4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={mode === 'url' ? "https://..." : "Provide context to help the AI link this to your existing knowledge..."}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-mono text-sm leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button type="button" onClick={() => resetMode('text')} className={`flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all ${mode === 'text' ? 'bg-indigo-50 border-indigo-500 shadow-md shadow-indigo-100' : 'bg-white border-slate-100 border-dashed hover:border-slate-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={mode === 'text' ? 'text-indigo-600' : 'text-slate-400'}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              <span className={`text-[10px] font-black mt-3 uppercase tracking-wider ${mode === 'text' ? 'text-indigo-700' : 'text-slate-400'}`}>Text</span>
            </button>
            <button type="button" onClick={() => pdfInputRef.current?.click()} className={`flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all ${mode === 'pdf' ? 'bg-indigo-50 border-indigo-500 shadow-md shadow-indigo-100' : 'bg-white border-slate-100 border-dashed hover:border-slate-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={mode === 'pdf' ? 'text-indigo-600' : 'text-slate-400'}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span className={`text-[10px] font-black mt-3 uppercase tracking-wider ${mode === 'pdf' ? 'text-indigo-700' : 'text-slate-400'}`}>PDF</span>
            </button>
            <button type="button" onClick={() => resetMode('url')} className={`flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all ${mode === 'url' ? 'bg-indigo-50 border-indigo-500 shadow-md shadow-indigo-100' : 'bg-white border-slate-100 border-dashed hover:border-slate-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={mode === 'url' ? 'text-indigo-600' : 'text-slate-400'}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              <span className={`text-[10px] font-black mt-3 uppercase tracking-wider ${mode === 'url' ? 'text-indigo-700' : 'text-slate-400'}`}>URL</span>
            </button>
            <button type="button" onClick={toggleRecording} className={`flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all ${isRecording ? 'bg-red-50 border-red-500 animate-pulse shadow-md shadow-red-100' : mode === 'voice' ? 'bg-indigo-50 border-indigo-500 shadow-md shadow-indigo-100' : 'bg-white border-slate-100 border-dashed hover:border-slate-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isRecording ? 'text-red-600' : mode === 'voice' ? 'text-indigo-600' : 'text-slate-400'}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
              <span className={`text-[10px] font-black mt-3 uppercase tracking-wider ${isRecording ? 'text-red-700' : mode === 'voice' ? 'text-indigo-700' : 'text-slate-400'}`}>{isRecording ? 'Stop' : 'Voice'}</span>
            </button>
            <button type="button" onClick={() => imageInputRef.current?.click()} className={`flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all ${mode === 'image' ? 'bg-indigo-50 border-indigo-500 shadow-md shadow-indigo-100' : 'bg-white border-slate-100 border-dashed hover:border-slate-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={mode === 'image' ? 'text-indigo-600' : 'text-slate-400'}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              <span className={`text-[10px] font-black mt-3 uppercase tracking-wider ${mode === 'image' ? 'text-indigo-700' : 'text-slate-400'}`}>Image</span>
            </button>
          </div>

          {(fileAttachment || audioBlob) && (
            <div className="bg-indigo-600/5 border border-indigo-600/10 rounded-2xl p-4 flex items-center justify-between animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-900 truncate max-w-[200px]">{fileAttachment?.name || 'Voice recording.webm'}</p>
                  <p className="text-[10px] font-medium text-indigo-500 uppercase tracking-widest">Attachment Stage Active</p>
                </div>
              </div>
              <button type="button" onClick={() => { setFileAttachment(null); setAudioBlob(null); setMode('text'); }} className="w-8 h-8 flex items-center justify-center text-indigo-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <div className="flex-1">
              {status && (
                <div className="flex items-center gap-2 text-indigo-600">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
                  <p className="text-sm font-bold">{status}</p>
                </div>
              )}
            </div>
            <button 
              disabled={isProcessing || (mode === 'text' && !content.trim())} 
              className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50 active:scale-95"
            >
              Commit to Memory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Ingestion;
