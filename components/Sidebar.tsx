
import React from 'react';
import { User } from '../types';

const Icons = {
  Dashboard: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>,
  Brain: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 0 0-5 5v1a5 5 0 0 0 5 5h0a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5Z"/><path d="M7 13a3 3 0 0 1 3 3v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a3 3 0 0 1 3-3Z"/><path d="M14 13a3 3 0 0 0-3 3v4a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-4a3 3 0 0 0-3-3Z"/></svg>,
  Memory: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>,
  Assistant: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
};

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  noteCount: number;
  deletedCount: number;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, noteCount, deletedCount, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { id: 'brain', label: 'Second Brain', icon: Icons.Brain },
    { id: 'memory', label: 'Memory Bank', icon: Icons.Memory },
    { id: 'assistant', label: 'AI Assistant', icon: Icons.Assistant },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">
            K
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight">KnowledgeOS</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Second Brain v1.0</p>
          </div>
        </div>

        <button 
          onClick={() => setActiveTab('ingest')}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg mb-8 font-medium"
        >
          <Icons.Plus />
          New Knowledge
        </button>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon />
              {item.label}
              {item.id === 'memory' && noteCount > 0 && (
                <span className="ml-auto bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {noteCount}
                </span>
              )}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('recycle')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'recycle' 
                  ? 'bg-red-50 text-red-700' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icons.Trash />
              Recycle Bin
              {deletedCount > 0 && (
                <span className="ml-auto bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {deletedCount}
                </span>
              )}
            </button>
          </div>
        </nav>
      </div>

      <div className="mt-auto p-4 m-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <img 
            src={user.profilePic || `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`} 
            alt={user.name} 
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest">{user.authProvider} account</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
        >
          <Icons.Logout />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
