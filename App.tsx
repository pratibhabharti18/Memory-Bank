
import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { Note, KnowledgeGraphData, Insight, User } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import BrainView from './components/BrainView';
import MemoryBank from './components/MemoryBank';
import Assistant from './components/Assistant';
import Ingestion from './components/Ingestion';
import RecycleBin from './components/RecycleBin';
import AuthView from './components/AuthView';
import { discoverRelationships, generateInsights } from './services/geminiService';

// Firebase init in App.tsx to handle session listening
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase using Modular SDK pattern
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'brain' | 'memory' | 'assistant' | 'ingest' | 'recycle'>('dashboard');
  const [notes, setNotes] = useState<Note[]>([]);
  const [graphData, setGraphData] = useState<KnowledgeGraphData>({ nodes: [], links: [] });
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // AUTH SESSION LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        const userObj: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          authProvider: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'local',
          profilePic: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.displayName}&background=6366f1&color=fff`,
          isVerified: firebaseUser.emailVerified,
          createdAt: Date.now()
        };
        setUser(userObj);
        setToken(idToken);
      } else {
        setUser(null);
        setToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && token) {
      fetchMemories();
    } else {
      setNotes([]);
    }
  }, [user, token]);

  const fetchMemories = async () => {
    if (!token) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/memory', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (e) {
      console.error("Fetch failed", e);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
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

  const handleLoginSuccess = (user: User, token: string) => {
    setUser(user);
    setToken(token);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setToken(null);
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

  const handlePermanentDelete = async (id: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/memory/${id}/permanent`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setNotes(prev => prev.filter(n => n.id !== id));
      }
    } catch (e) {
      console.error("Delete failed", e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  const activeNotesCount = notes.filter(n => !n.isDeleted).length;
  const deletedNotesCount = notes.filter(n => n.isDeleted).length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        noteCount={activeNotesCount} 
        deletedCount={deletedNotesCount}
        user={user}
        onLogout={handleLogout}
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
           {activeTab === 'dashboard' && <Dashboard notes={notes.filter(n => !n.isDeleted)} insights={insights} graphStats={{ nodes: graphData.nodes.length, links: graphData.links.length }} onNavigate={setActiveTab} />}
           {activeTab === 'brain' && <BrainView data={graphData} />}
           {activeTab === 'memory' && <MemoryBank notes={notes} onSoftDelete={handleSoftDelete} />}
           {activeTab === 'assistant' && <Assistant notes={notes.filter(n => !n.isDeleted)} />}
           {activeTab === 'ingest' && <Ingestion token={token!} onNoteAdded={handleAddNote} onSuccess={() => setActiveTab('memory')} />}
           {activeTab === 'recycle' && <RecycleBin notes={notes} onRestore={handleRestore} onPermanentDelete={handlePermanentDelete} />}
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

export default App;
