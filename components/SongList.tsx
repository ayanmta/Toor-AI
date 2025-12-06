import React from 'react';
import { Song } from '../types';
import { Play, MoreHorizontal, ThumbsUp, ThumbsDown, Share2, Video as VideoIcon } from 'lucide-react';

interface SongListProps {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
}

export const SongList: React.FC<SongListProps> = ({ songs, currentSong, isPlaying, onPlay }) => {
  return (
    <div className="flex-1 bg-black overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Library</h2>
        <div className="flex gap-2">
            <select className="bg-zinc-900 border border-zinc-800 text-xs rounded px-2 py-1 text-zinc-400 outline-none">
                <option>All items</option>
                <option>Audio</option>
                <option>Video</option>
            </select>
        </div>
      </div>

      <div className="space-y-2">
        {songs.map((song) => {
            const isCurrent = currentSong?.id === song.id;
            const isGenerating = song.status === 'generating';

            return (
                <div 
                    key={song.id}
                    className={`group flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-900/50 transition-colors ${isCurrent ? 'bg-zinc-900' : ''}`}
                >
                    {/* Image / Play Button */}
                    <div className="relative w-16 h-16 shrink-0 bg-zinc-800 rounded overflow-hidden">
                        {isGenerating ? (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-800 animate-pulse">
                                <span className="text-zinc-600 text-xs">...</span>
                            </div>
                        ) : (
                            <>
                                {song.type === 'video' ? (
                                    <video src={song.videoUrl || ""} className="w-full h-full object-cover" muted />
                                ) : (
                                    <img src={song.imageUrl} alt={song.title} className="w-full h-full object-cover" />
                                )}
                                
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => onPlay(song)}
                                        className="p-2 bg-white rounded-full text-black hover:scale-110 transition-transform"
                                    >
                                        {isCurrent && isPlaying ? (
                                            <div className="w-3 h-3 bg-black flex gap-0.5 items-end justify-center">
                                                <div className="w-1 h-3 bg-black animate-pulse"></div>
                                                <div className="w-1 h-2 bg-black animate-pulse delay-75"></div>
                                            </div>
                                        ) : song.type === 'video' ? (
                                            <Play size={16} fill="black" className="ml-0.5" />
                                        ) : (
                                            <Play size={16} fill="black" className="ml-0.5" />
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                        {song.type === 'video' && (
                             <div className="absolute top-1 right-1 bg-black/50 rounded px-1 text-[8px] text-white">
                                <VideoIcon size={8} />
                             </div>
                        )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className={`font-semibold text-sm truncate ${isGenerating ? 'text-zinc-500 italic' : 'text-white'}`}>
                                {song.title}
                            </h3>
                            {song.tags.slice(0, 1).map((tag, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <p className="text-zinc-500 text-xs truncate mt-1">
                           {isGenerating ? (song.type === 'video' ? "Generating video (this takes a moment)..." : "Generating lyrics and audio...") : song.prompt}
                        </p>
                    </div>

                    {/* Waveform Visualization (Static for UI) */}
                    <div className="hidden md:flex w-1/4 h-8 items-center gap-0.5 opacity-30">
                        {Array.from({ length: 20 }).map((_, i) => (
                             <div 
                                key={i} 
                                className="w-1 bg-white rounded-full" 
                                style={{ height: `${Math.random() * 100}%` }}
                             />
                        ))}
                    </div>

                    {/* Duration */}
                    <div className="text-xs text-zinc-500 w-12 text-right">
                        {isGenerating ? '--:--' : song.duration}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"><ThumbsUp size={16} /></button>
                        <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"><ThumbsDown size={16} /></button>
                        <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"><Share2 size={16} /></button>
                        <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"><MoreHorizontal size={16} /></button>
                    </div>
                </div>
            );
        })}
      </div>
      
      {songs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <p>No songs created yet.</p>
              <p className="text-sm">Use the panel on the left to start creating!</p>
          </div>
      )}
    </div>
  );
};