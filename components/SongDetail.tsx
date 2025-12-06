import React from 'react';
import { Song } from '../types';
import { X, Mic2, Download } from 'lucide-react';

interface SongDetailProps {
  song: Song | null;
}

export const SongDetail: React.FC<SongDetailProps> = ({ song }) => {
  if (!song) return (
      <div className="w-80 bg-[#0a0a0a] border-l border-zinc-900 hidden lg:flex items-center justify-center text-zinc-600 text-sm p-8 text-center">
          Select a song to view details and lyrics
      </div>
  );

  return (
    <div className="w-80 bg-[#0a0a0a] border-l border-zinc-900 hidden lg:flex flex-col h-full overflow-y-auto">
       <div className="p-6">
           <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-2xl mb-6 bg-zinc-900">
                <img src={song.imageUrl} alt={song.title} className="w-full h-full object-cover" />
           </div>
           
           <h2 className="text-2xl font-bold text-white mb-1 leading-tight">{song.title}</h2>
           <div className="flex items-center gap-2 mb-4">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-6 h-6 rounded-full" alt="User" />
              <span className="text-sm text-zinc-400">@User123</span>
           </div>

           <div className="flex flex-wrap gap-2 mb-6">
               {song.tags.map(tag => (
                   <span key={tag} className="px-2 py-1 bg-zinc-900 rounded-md text-xs text-zinc-300 border border-zinc-800">
                       {tag}
                   </span>
               ))}
           </div>

           <div className="flex gap-2 mb-8">
               <button className="flex-1 py-2 bg-zinc-100 text-black rounded font-semibold text-sm hover:bg-zinc-200">
                   Remix
               </button>
               <button className="flex-1 py-2 bg-zinc-900 text-white border border-zinc-800 rounded font-semibold text-sm hover:bg-zinc-800">
                   Extend
               </button>
           </div>
           
           <div className="border-t border-zinc-900 pt-6">
               <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                   <Mic2 size={14} /> Lyrics
               </h3>
               <div className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed font-medium">
                   {song.lyrics || "No lyrics available."}
               </div>
           </div>
       </div>
    </div>
  );
};
