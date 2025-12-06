import React from 'react';
import { Home, Music, Library, Search, Radio, Disc, User, Info, Plus, MessageSquare, Mic } from 'lucide-react';
import { AppView } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const navItemClass = (isActive: boolean) => cn(
    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium",
    isActive ? 'text-white bg-zinc-900' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
  );

  return (
    <div className="w-64 bg-black h-screen border-r border-zinc-900 flex flex-col hidden md:flex shrink-0">
      {/* Logo */}
      <div className="p-5 flex items-center gap-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-white">
            <circle cx="12" cy="12" r="10" />
            <path d="M10 8l6 4-6 4V8z" fill="white" stroke="none"/>
        </svg>
        <span className="text-xl font-bold tracking-wider">SUNO</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <div 
            className={navItemClass(currentView === AppView.CREATE)}
            onClick={() => onViewChange(AppView.CREATE)}
        >
            <Plus size={20} className={currentView === AppView.CREATE ? "text-white" : "text-zinc-400"}/> Create
        </div>

        <div 
            className={navItemClass(currentView === AppView.CHAT)}
            onClick={() => onViewChange(AppView.CHAT)}
        >
            <MessageSquare size={20} /> Copilot
        </div>

        <div 
            className={navItemClass(currentView === AppView.LIVE)}
            onClick={() => onViewChange(AppView.LIVE)}
        >
            <Mic size={20} className="text-red-500" /> Live Jam
        </div>

        <div className="my-4 border-b border-zinc-900"></div>

        <div className={navItemClass(false)}><Home size={20} /> Home</div>
        <div className={navItemClass(false)}><Library size={20} /> Library</div>
        <div className={navItemClass(false)}><Search size={20} /> Search</div>
        
        <div className="pt-4 pb-2 px-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
          Discover
        </div>
        <div className={navItemClass(false)}><Radio size={20} /> Radio</div>
        <div className={navItemClass(false)}><Disc size={20} /> Explore</div>

        <div className="pt-4 pb-2 px-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
          Me
        </div>
        <div className={navItemClass(false)}><User size={20} /> Profile</div>
        <div className={navItemClass(false)}><Info size={20} /> About</div>
      </div>

      {/* Credits / Footer */}
      <div className="p-4 border-t border-zinc-900">
        <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-zinc-500 font-medium">50 Credits</span>
            <span className="text-xs text-zinc-500">Free Plan</span>
        </div>
        <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-semibold transition-colors">
            Subscribe
        </button>
      </div>
    </div>
  );
};