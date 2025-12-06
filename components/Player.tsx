import React, { useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Mic2, Heart, MoreHorizontal, Maximize2 } from 'lucide-react';
import { Song } from '../types';

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const Player: React.FC<PlayerProps> = ({ currentSong, isPlaying, onPlayPause }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (currentSong?.audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(currentSong.audioUrl);
      } else {
        // Only update source if it changed to prevent reloading same song
        if (audioRef.current.src !== currentSong.audioUrl) {
            audioRef.current.src = currentSong.audioUrl;
        }
      }

      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Playback failed (autplay policy?)", e));
      } else {
        audioRef.current.pause();
      }
    } else {
        if(audioRef.current) audioRef.current.pause();
    }
  }, [currentSong, isPlaying]);

  if (!currentSong) {
    return (
        <div className="h-20 bg-black border-t border-zinc-900 flex items-center justify-center text-zinc-600 text-sm">
            Select a song to play
        </div>
    )
  }

  return (
    <div className="h-20 bg-black border-t border-zinc-900 flex items-center justify-between px-4 z-50">
      
      {/* Track Info */}
      <div className="flex items-center gap-4 w-1/3 min-w-0">
        <img 
            src={currentSong.imageUrl} 
            alt="Art" 
            className="w-12 h-12 rounded bg-zinc-800 object-cover"
        />
        <div className="min-w-0 flex-1">
            <h4 className="text-white text-sm font-semibold truncate hover:underline cursor-pointer">{currentSong.title}</h4>
            <p className="text-zinc-400 text-xs truncate hover:underline cursor-pointer">{currentSong.artist}</p>
        </div>
        <button className="text-zinc-400 hover:text-white"><Heart size={18} /></button>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center w-1/3">
        <div className="flex items-center gap-6 mb-1">
            <button className="text-zinc-500 hover:text-white"><Shuffle size={16} /></button>
            <button className="text-white hover:text-zinc-300"><SkipBack size={20} fill="currentColor" /></button>
            
            <button 
                onClick={onPlayPause}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform"
            >
                {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" className="ml-0.5"/>}
            </button>
            
            <button className="text-white hover:text-zinc-300"><SkipForward size={20} fill="currentColor" /></button>
            <button className="text-zinc-500 hover:text-white"><Repeat size={16} /></button>
        </div>
        
        {/* Progress Bar (Visual Only for clone) */}
        <div className="w-full max-w-md flex items-center gap-2 text-xs text-zinc-500">
            <span>0:00</span>
            <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden group cursor-pointer">
                <div className="h-full bg-white w-0 group-hover:bg-green-500 relative"></div>
            </div>
            <span>{currentSong.duration || "2:00"}</span>
        </div>
      </div>

      {/* Volume & Extras */}
      <div className="flex items-center justify-end gap-3 w-1/3">
         <button className="text-zinc-400 hover:text-white"><Mic2 size={18} /></button>
         <div className="flex items-center gap-2 w-24">
            <Volume2 size={18} className="text-zinc-400" />
            <div className="h-1 flex-1 bg-zinc-800 rounded-full">
                <div className="h-full bg-zinc-400 w-2/3"></div>
            </div>
         </div>
         <button className="text-zinc-400 hover:text-white"><Maximize2 size={18} /></button>
      </div>
    </div>
  );
};
