
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

  // Fix: Completed handleSoftDelete and added deletedAt property
  const handleSoftDelete = (id: string) => {
    setNotes(prev => prev.map(n => 
      n.id === id ? { ...n, isDeleted: true, deletedAt: Date.now() } : n
    ));
  };

  // Fix: Added handleRestore to recover deleted notes
  const handleRestore = (id: string) => {
    setNotes(prev => prev.map(n => 
      n.id === id ? { ...n, isDeleted: false, deletedAt: undefined } : n
    ));
  };

  // Fix: Added handlePermanentDelete for actual deletion
  const handlePermanentDelete = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const renderContent = () => {
    const activeNotes = notes.filter(n => !n.isDeleted);
    
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            notes={activeNotes} 
            insights={insights} 
            graphStats={{ nodes: graphData.nodes.length, links: graphData.links.length }}
            onNavigate={setActiveTab}
          />
        );
      case 'brain':
        return <BrainView data={graphData} />;
      case 'memory':
        return <MemoryBank notes={notes} onSoftDelete={handleSoftDelete} />;
      case 'assistant':
        return <Assistant notes={activeNotes} />;
      case 'ingest':
        return <Ingestion onNoteAdded={handleAddNote} onSuccess={() => setActiveTab('dashboard')} />;
      case 'recycle':
        return (
          <RecycleBin 
            notes={notes} 
            onRestore={handleRestore} 
            onPermanentDelete={handlePermanentDelete} 
          />
        );
      default:
        return null;
    }
  };

  const activeNotesCount = notes.filter(n => !n.isDeleted).length;
  const deletedNotesCount = notes.filter(n => n.isDeleted).length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        noteCount={activeNotesCount} 
        deletedCount={deletedNotesCount}
      />
      
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {isProcessing && (
          <div className="absolute top-0 left-0 right-0 z-50">
             <div className="h-1 bg-indigo-100 overflow-hidden">
                <div className="h-full bg-indigo-600 animate-progress origin-left"></div>
             </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-8 md:p-12">
           {renderContent()}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); }
        }
        .animate-progress {
          animation: progress 2s infinite ease-in-out;
        }
      `}} />
    </div>
  );
};

// Fix: Added missing default export
export default App;
