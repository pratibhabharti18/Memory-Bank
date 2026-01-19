
import React, { useState } from 'react';
import { Note } from '../types';

interface MemoryBankProps {
  notes: Note[];
  onSoftDelete: (id: string) => void;
}

const MemoryBank: React.FC<MemoryBankProps> = ({ notes, onSoftDelete }) => {
  const [search, setSearch] = useState('');

  const filteredNotes = notes
    .filter(n => !n.isDeleted)
    .filter(n => 
      n.title.toLowerCase().includes(search.toLowerCase()) || 
      n.extracted_text.toLowerCase().includes(search.toLowerCase()) ||
      n.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );

  const renderHeroPreview = (note: Note) => {
    const { url, name } = note.original_file;
    
    switch (note.type) {
      case 'image':
        return (
          <div className="relative w-full aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 mb-4 group-hover:border-indigo-300 transition-colors">
            <img src={url} alt={name} className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold text-slate-700 shadow-sm border border-slate-200">
              ORIGINAL IMAGE
            </div>
          </div>
        );
      case 'voice':
        return (
          <div className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest mb-2">Original Audio Recording</p>
                <audio controls src={url} className="w-full h-8 accent-indigo-600" />
              </div>
            </div>
          </div>
        );
      case 'pdf':
        return (
          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-4 flex items-center justify-between group/file">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{name}</p>
                <p className="text-[10px] text-slate-500 font-mono uppercase">Original Document Source</p>
              </div>
            </div>
            <a href={url} download={name} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
              Download File
            </a>
          </div>
        );
      case 'url':
        return (
          <div className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-4 group/url transition-all hover:bg-emerald-100/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-0.5">Original Web Source</p>
                <a href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-900 hover:underline truncate block">
                  {url}
                </a>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Memory Bank</h2>
          <p className="text-slate-500">Dual-layer knowledge storage: Original Source + AI Intelligence.</p>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search through memory..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full md:w-80 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
          />
          <svg className="absolute left-3 top-3 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-8 pr-2">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <div key={note.id} className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-50/50 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      note.type === 'voice' ? 'bg-amber-100 text-amber-700' :
                      note.type === 'image' ? 'bg-emerald-100 text-emerald-700' :
                      note.type === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {note.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      {new Date(note.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 leading-tight">{note.title}</h3>
                </div>
                <button 
                  onClick={() => onSoftDelete(note.id)}
                  className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  title="Move to Recycle Bin"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>

              {/* SECTION 1: VISUAL HERO PREVIEW */}
              {renderHeroPreview(note)}

              {/* SECTION 2: AI SUMMARY (THE INDEX) */}
              <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 bg-indigo-100 rounded-md flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                  </div>
                  <span className="text-[11px] font-black text-indigo-800 uppercase tracking-[0.15em]">AI Extraction Summary</span>
                </div>
                
                <p className="text-slate-800 text-base leading-relaxed font-medium mb-6 italic">
                  "{note.summary}"
                </p>

                <div className="flex flex-wrap gap-2">
                  {note.tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-lg font-bold shadow-sm">
                      #{tag}
                    </span>
                  ))}
                  {note.entities.slice(0, 3).map(ent => (
                    <span key={ent} className="text-[10px] bg-indigo-600 text-white px-3 py-1 rounded-lg font-bold shadow-sm shadow-indigo-100">
                      {ent}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white border-2 border-dashed border-slate-200 rounded-[2rem]">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-20"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
            <p className="font-bold text-slate-500">No active knowledge found.</p>
            <p className="text-sm">Your semantic brain is ready for input.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryBank;
