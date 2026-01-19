
import React from 'react';
import { Note } from '../types';

interface RecycleBinProps {
  notes: Note[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

const RecycleBin: React.FC<RecycleBinProps> = ({ notes, onRestore, onPermanentDelete }) => {
  const deletedNotes = notes.filter(n => n.isDeleted);

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Recycle Bin</h2>
        <p className="text-slate-500">Deleted items are kept here for a short time before permanent erasure.</p>
      </header>

      <div className="flex-1 overflow-y-auto space-y-4">
        {deletedNotes.length > 0 ? (
          deletedNotes.map((note) => (
            <div key={note.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between group shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-800 truncate">{note.title}</h3>
                  <span className="text-[10px] text-slate-400 font-mono italic">
                    Deleted {note.deletedAt ? new Date(note.deletedAt).toLocaleDateString() : 'recently'}
                  </span>
                </div>
                {/* Fix: Note.content does not exist. Use extracted_text instead. */}
                <p className="text-sm text-slate-500 truncate">{note.summary || note.extracted_text}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button 
                  onClick={() => onRestore(note.id)}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
                >
                  Restore
                </button>
                <button 
                  onClick={() => {
                    if (confirm("Permanently delete this knowledge? This cannot be undone.")) {
                      onPermanentDelete(note.id);
                    }
                  }}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-30"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            <p className="font-medium">Recycle bin is empty.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecycleBin;