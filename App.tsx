
import React, { useState, useEffect } from 'react';
import { Note, KnowledgeGraphData, Insight } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import BrainView from './components/BrainView';
import MemoryBank from './components/MemoryBank';
import Assistant from './components/Assistant';
import Ingestion from './components/Ingestion';
import RecycleBin from './components/RecycleBin';
import { discoverRelationships, generateInsights } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'brain' | 'memory' | 'assistant' | 'ingest' | 'recycle'>('dashboard');
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('knowledge_notes_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [graphData, setGraphData] = useState<KnowledgeGraphData>({ nodes: [], links: [] });
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    localStorage.setItem('knowledge_notes_v2', JSON.stringify(notes));
    const activeNotes = notes.filter(n => !n.isDeleted);
    if (activeNotes.length > 0) {
      updateKnowledgeSystem(activeNotes);
    }
  }, [notes]);

  const updateKnowledgeSystem = async (activeNotes: Note[]) => {
    setIsProcessing(true);
    try {
      const [newGraph, newInsights] = await Promise.all([
        discoverRelationships(activeNotes),
        generateInsights(activeNotes)
      ]);
      setGraphData(newGraph);
      setInsights(newInsights);
    } catch (error) {
      console.error("Knowledge sync failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddNote = (note: Note) => {
    setNotes(prev => [note, ...prev]);
  };

  const handleSoftDelete = (id: string) => {
    setNotes(prev => prev.map(n => 
      n.id === id ? { ...n, isDeleted: true, deletedAt: Date.now() } : n
    ));
  };

  const handleRestore = (id: string) => {
    setNotes(prev => prev.map(n => 
      n.id === id ? { ...n, isDeleted: false, deletedAt: undefined } : n
    ));
  };

  const handlePermanentDelete = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  // Only use non-deleted notes for the primary interfaces
  const activeNotes = notes.filter(n => !n.isDeleted);
  const deletedNotesCount = notes.filter(n => n.isDeleted).length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        noteCount={activeNotes.length} 
        deletedCount={deletedNotesCount}
      />
      
      <main className="flex-1 overflow-y-auto relative p-6 md:p-10">
        {isProcessing && (
          <div className="absolute top-4 right-10 flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-medium animate-pulse border border-indigo-100 z-50">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
            AI is thinking...
          </div>
        )}

        <div className="max-w-7xl mx-auto h-full flex flex-col">
          {activeTab === 'dashboard' && (
            <Dashboard 
              notes={activeNotes} 
              insights={insights} 
              graphStats={{ nodes: graphData.nodes.length, links: graphData.links.length }}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'brain' && (
            <BrainView data={graphData} />
          )}
          {activeTab === 'memory' && (
            <MemoryBank 
              notes={notes} 
              onSoftDelete={handleSoftDelete} 
            />
          )}
          {activeTab === 'assistant' && (
            <Assistant notes={activeNotes} />
          )}
          {activeTab === 'ingest' && (
            <Ingestion onNoteAdded={handleAddNote} onSuccess={() => setActiveTab('memory')} />
          )}
          {activeTab === 'recycle' && (
            <RecycleBin 
              notes={notes} 
              onRestore={handleRestore} 
              onPermanentDelete={handlePermanentDelete} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
