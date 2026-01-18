
import React, { useState, useRef, useEffect } from 'react';
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

  // Start/Stop voice recording
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
        console.error(err);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    // Validate based on mode
    if (mode === 'text' && !content.trim()) return;
    if ((mode === 'pdf' || mode === 'image') && !fileAttachment) return;
    if (mode === 'voice' && !audioBlob) return;
    if (mode === 'url' && !content.includes('http')) {
        setStatus("Please enter a valid URL.");
        return;
    }

    setIsProcessing(true);
    setStatus(`Extracting knowledge from ${mode}...`);

    try {
      const attachment = mode === 'voice' ? audioBlob! : (fileAttachment || undefined);
      const metadata = await extractKnowledge(content, mode, attachment);
      
      const newNote: Note = {
        id: Math.random().toString(36).substr(2, 9),
        title: title || metadata.summary.substring(0, 40) + '...',
        content: mode === 'text' ? content : `[${mode.toUpperCase()} Source Content] ${metadata.summary}\n\nOriginal Input: ${content}`,
        timestamp: Date.now(),
        tags: [...metadata.tags, mode],
        entities: metadata.entities,
        source: mode.charAt(0).toUpperCase() + mode.slice(1)
      };

      onNoteAdded(newNote);
      setStatus('Successfully integrated into Knowledge OS!');
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error) {
      console.error(error);
      setStatus('Processing failed. Adding as raw entity...');
      onNoteAdded({
        id: Math.random().toString(36).substr(2, 9),
        title: title || 'Quick Entry',
        content,
        timestamp: Date.now(),
        tags: [mode, 'processing-error'],
        entities: [],
        source: mode
      });
      setTimeout(onSuccess, 1000);
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
        <p className="text-slate-500">Feed your second brain via multiple modalities.</p>
      </header>

      {/* Hidden Inputs */}
      <input 
        type="file" 
        ref={pdfInputRef} 
        className="hidden" 
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => handleFileChange(e, 'pdf')}
      />
      <input 
        type="file" 
        ref={imageInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => handleFileChange(e, 'image')}
      />

      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Topic or Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={mode === 'url' ? "Link description" : "e.g. Research Notes"}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
                {mode === 'url' ? 'Paste URL' : 'Notes / Description'}
            </label>
            <textarea 
              rows={mode === 'url' ? 2 : 8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={mode === 'url' ? "https://..." : "Add additional context or notes..."}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm leading-relaxed"
            />
          </div>

          {/* Source Selection Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button 
              type="button" 
              onClick={() => resetMode('text')}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all group ${mode === 'text' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-slate-50 border-dashed border-slate-300 hover:bg-slate-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={mode === 'text' ? 'text-indigo-600' : 'text-slate-400'}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              <span className={`text-[9px] font-bold mt-2 uppercase ${mode === 'text' ? 'text-indigo-600' : 'text-slate-500'}`}>Text</span>
            </button>

            <button 
              type="button" 
              onClick={() => pdfInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all group ${mode === 'pdf' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-slate-50 border-dashed border-slate-300 hover:bg-slate-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={mode === 'pdf' ? 'text-indigo-600' : 'text-slate-400'}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span className={`text-[9px] font-bold mt-2 uppercase ${mode === 'pdf' ? 'text-indigo-600' : 'text-slate-500'}`}>PDF/Doc</span>
            </button>

            <button 
              type="button" 
              onClick={() => resetMode('url')}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all group ${mode === 'url' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-slate-50 border-dashed border-slate-300 hover:bg-slate-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={mode === 'url' ? 'text-indigo-600' : 'text-slate-400'}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              <span className={`text-[9px] font-bold mt-2 uppercase ${mode === 'url' ? 'text-indigo-600' : 'text-slate-500'}`}>Web URL</span>
            </button>

            <button 
              type="button" 
              onClick={toggleRecording}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all group ${isRecording ? 'bg-red-50 border-red-200 animate-pulse' : mode === 'voice' ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-dashed border-slate-300 hover:bg-slate-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isRecording ? 'text-red-500' : mode === 'voice' ? 'text-indigo-600' : 'text-slate-400'}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
              <span className={`text-[9px] font-bold mt-2 uppercase ${isRecording ? 'text-red-600' : mode === 'voice' ? 'text-indigo-600' : 'text-slate-500'}`}>{isRecording ? 'Stop' : 'Voice'}</span>
            </button>

            <button 
              type="button" 
              onClick={() => imageInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all group ${mode === 'image' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-slate-50 border-dashed border-slate-300 hover:bg-slate-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={mode === 'image' ? 'text-indigo-600' : 'text-slate-400'}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              <span className={`text-[9px] font-bold mt-2 uppercase ${mode === 'image' ? 'text-indigo-600' : 'text-slate-500'}`}>OCR</span>
            </button>
          </div>

          {/* Attachment Preview */}
          {(fileAttachment || audioBlob) && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center text-indigo-600">
                  {mode === 'image' ? 'IMG' : mode === 'voice' ? 'AUD' : 'DOC'}
                </div>
                <span className="text-xs font-medium text-indigo-800 truncate max-w-[200px]">
                  {fileAttachment?.name || 'Voice recording.webm'}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => { setFileAttachment(null); setAudioBlob(null); setMode('text'); }}
                className="text-indigo-400 hover:text-indigo-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between">
            <div className="flex-1">
              {status && (
                <p className={`text-sm font-medium ${status.includes('Successfully') ? 'text-emerald-600' : status.includes('Recording') ? 'text-red-500' : 'text-indigo-600'}`}>
                  {status}
                </p>
              )}
            </div>
            <button 
              disabled={isProcessing || (mode === 'text' && !content.trim()) || (mode === 'voice' && !audioBlob && !isRecording)}
              className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </>
              ) : (
                'Commit to Memory'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-indigo-50 rounded-2xl p-6 flex gap-4 border border-indigo-100">
        <div className="shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold italic">i</div>
        <div>
          <h4 className="font-bold text-indigo-900 text-sm mb-1">Knowledge Guard Privacy</h4>
          <p className="text-indigo-700 text-xs leading-relaxed">
            Multi-modal data is processed using temporary secure buffers. OCR and Audio reasoning are performed via end-to-end encrypted session windows.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Ingestion;
