
import React, { useState } from 'react';
import { Note } from '../types';

interface MemoryBankProps {
  notes: Note[];
  onDelete: (id: string) => void;
}

const MemoryBank: React.FC<MemoryBankProps> = ({ notes, onDelete }) => {
  const [search, setSearch] = useState('');

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Memory Bank</h2>
          <p className="text-slate-500">Your curated collection of raw thoughts.</p>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search memory..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full md:w-80 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm"
          />
          <svg className="absolute left-3 top-3 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <div key={note.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-slate-800">{note.title}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(note.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2 mb-3">
                    {note.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">#{tag}</span>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => onDelete(note.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
              
              {note.entities.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Entities Detected</span>
                  <div className="flex flex-wrap gap-2">
                    {note.entities.map(entity => (
                      <span key={entity} className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">{entity}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-20"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
            <p className="font-medium">No memory matching your search.</p>
            <p className="text-sm">Try using different keywords or tags.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryBank;
