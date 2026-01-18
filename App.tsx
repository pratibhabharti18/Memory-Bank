
import React, { useState, useEffect, useCallback } from 'react';
import { Note, KnowledgeGraphData, Insight } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import BrainView from './components/BrainView';
import MemoryBank from './components/MemoryBank';
import Assistant from './components/Assistant';
import Ingestion from './components/Ingestion';
import { discoverRelationships, generateInsights } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'brain' | 'memory' | 'assistant' | 'ingest'>('dashboard');
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('knowledge_notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [graphData, setGraphData] = useState<KnowledgeGraphData>({ nodes: [], links: [] });
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    localStorage.setItem('knowledge_notes', JSON.stringify(notes));
    if (notes.length > 0) {
      updateKnowledgeSystem();
    }
  }, [notes]);

  const updateKnowledgeSystem = async () => {
    setIsProcessing(true);
    try {
      const [newGraph, newInsights] = await Promise.all([
        discoverRelationships(notes),
        generateInsights(notes)
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

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} noteCount={notes.length} />
      
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
              notes={notes} 
              insights={insights} 
              graphStats={{ nodes: graphData.nodes.length, links: graphData.links.length }}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'brain' && (
            <BrainView data={graphData} />
          )}
          {activeTab === 'memory' && (
            <MemoryBank notes={notes} onDelete={handleDeleteNote} />
          )}
          {activeTab === 'assistant' && (
            <Assistant notes={notes} />
          )}
          {activeTab === 'ingest' && (
            <Ingestion onNoteAdded={handleAddNote} onSuccess={() => setActiveTab('memory')} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
