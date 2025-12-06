import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import { CreationPanel } from './components/CreationPanel';
import { SongList } from './components/SongList';
import { SongDetail } from './components/SongDetail';
import { ChatInterface } from './components/ChatInterface';
import { LiveInterface } from './components/LiveInterface';
import { Song, GenerationRequest, AppView } from './types';
import { generateSongMetadata, generateAlbumArt, generateAudioPreview, generateVideo } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CREATE);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle Play/Pause
  const handlePlayPause = () => {
    if (currentSong) {
      setIsPlaying(!isPlaying);
    }
  };

  const handlePlaySong = (song: Song) => {
    // If it's a video, we might want to open a modal or just play it
    // For now, let's treat it as a song in the player if it has audioUrl, or handle video specifically
    if (song.type === 'video' && song.videoUrl) {
         window.open(song.videoUrl, '_blank'); // Simple fallback for video playing
         return;
    }

    if (currentSong?.id === song.id) {
        handlePlayPause();
    } else {
        setCurrentSong(song);
        setIsPlaying(true);
    }
  };

  // Main Generation Logic
  const handleCreate = async (request: GenerationRequest) => {
    setIsGenerating(true);

    const tempId = Date.now().toString();
    const tempSong: Song = {
        id: tempId,
        title: "Generating...",
        artist: "Suno AI Clone",
        imageUrl: "", 
        audioUrl: null,
        videoUrl: null,
        lyrics: "",
        tags: [],
        duration: "--:--",
        createdAt: Date.now(),
        status: 'generating',
        isInstrumental: request.isInstrumental,
        prompt: request.prompt || request.title || "Custom Creation",
        type: request.type
    };

    setSongs(prev => [tempSong, ...prev]);

    try {
        if (request.type === 'video') {
            const videoUrl = await generateVideo(request.prompt, request.aspectRatio);
            
            setSongs(prev => prev.map(s => {
                if (s.id === tempId) {
                    return {
                        ...s,
                        title: "AI Video",
                        imageUrl: "https://via.placeholder.com/150/000000/FFFFFF/?text=Video", // Placeholder until we get a thumb
                        videoUrl: videoUrl,
                        status: videoUrl ? 'ready' : 'error',
                        duration: "0:05",
                        tags: ['video', request.aspectRatio || '16:9']
                    };
                }
                return s;
            }));

        } else {
            // Audio Generation
            const [metadata, imageUrl] = await Promise.all([
                generateSongMetadata(request.prompt, request.lyrics, request.style, request.title),
                generateAlbumArt(request.prompt || request.title || "Abstract Music")
            ]);

            let audioUrl: string | null = null;
            if (!request.isInstrumental && metadata.lyrics) {
                audioUrl = await generateAudioPreview(metadata.lyrics);
            }

            setSongs(prev => prev.map(s => {
                if (s.id === tempId) {
                    return {
                        ...s,
                        title: metadata.title,
                        lyrics: metadata.lyrics,
                        tags: metadata.tags,
                        imageUrl: imageUrl,
                        audioUrl: audioUrl,
                        status: 'ready',
                        duration: "0:30"
                    };
                }
                return s;
            }));
        }

    } catch (error) {
        console.error("Generation failed", error);
        setSongs(prev => prev.map(s => s.id === tempId ? { ...s, status: 'error', title: "Generation Failed" } : s));
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-sans">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        
        {/* Main Content Area */}
        <div className="flex flex-1 min-w-0 relative">
            
            {/* View: Create (Default) */}
            {currentView === AppView.CREATE && (
                <>
                    <CreationPanel onCreate={handleCreate} isGenerating={isGenerating} />
                    <SongList 
                        songs={songs} 
                        currentSong={currentSong} 
                        isPlaying={isPlaying} 
                        onPlay={handlePlaySong} 
                    />
                    <SongDetail song={currentSong} />
                </>
            )}

            {/* View: Chat (Copilot) */}
            {currentView === AppView.CHAT && (
                <ChatInterface />
            )}

            {/* View: Live (Overlay) */}
            {currentView === AppView.LIVE && (
                <LiveInterface onClose={() => setCurrentView(AppView.CREATE)} />
            )}

        </div>
      </div>
      
      <Player 
        currentSong={currentSong} 
        isPlaying={isPlaying} 
        onPlayPause={handlePlayPause} 
      />
    </div>
  );
};

export default App;