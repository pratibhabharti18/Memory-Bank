
import React from 'react';
import { Note, Insight } from '../types';

interface DashboardProps {
  notes: Note[];
  insights: Insight[];
  graphStats: { nodes: number; links: number };
  onNavigate: (tab: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ notes, insights, graphStats, onNavigate }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Personal Insights</h2>
        <p className="text-slate-500">Your knowledge at a glance.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-slate-500 text-sm font-medium mb-1">Knowledge Nodes</div>
          <div className="text-4xl font-bold text-slate-900">{notes.length}</div>
          <div className="text-xs text-indigo-600 mt-2 font-medium">Synced to vector memory</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-slate-500 text-sm font-medium mb-1">Semantic Connections</div>
          <div className="text-4xl font-bold text-slate-900">{graphStats.links}</div>
          <div className="text-xs text-emerald-600 mt-2 font-medium">Graph relationships mapped</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-slate-500 text-sm font-medium mb-1">Entities Identified</div>
          <div className="text-4xl font-bold text-slate-900">{graphStats.nodes - notes.length}</div>
          <div className="text-xs text-amber-600 mt-2 font-medium">Automatic extraction active</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            AI-Driven Discoveries
          </h3>
          
          {insights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight) => (
                <div key={insight.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
                    insight.type === 'pattern' ? 'text-indigo-600' :
                    insight.type === 'suggestion' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {insight.type}
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2 leading-tight">{insight.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{insight.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-300 p-12 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              </div>
              <p className="text-slate-500 text-sm max-w-xs">Not enough data to generate insights. Add more notes to see the magic happen.</p>
              <button 
                onClick={() => onNavigate('ingest')}
                className="mt-4 text-indigo-600 text-sm font-bold hover:underline"
              >
                + Add your first note
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800">Recent Memory</h3>
          <div className="space-y-3">
            {notes.slice(0, 5).map(note => (
              <div key={note.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:border-indigo-200 transition-colors" onClick={() => onNavigate('memory')}>
                <h4 className="font-semibold text-slate-800 text-sm line-clamp-1">{note.title || 'Untitled Note'}</h4>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {note.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">#{tag}</span>
                  ))}
                </div>
              </div>
            ))}
            <button 
              onClick={() => onNavigate('memory')}
              className="w-full text-center py-2 text-sm text-slate-500 font-medium hover:text-slate-800"
            >
              View all memory →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
