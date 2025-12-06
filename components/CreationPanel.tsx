import React, { useState, useRef } from 'react';
import { ViewMode, GenerationRequest } from '../types';
import { Mic, MicOff, Video, Music, Sparkles, Sliders, Plus, X } from 'lucide-react';
import { transcribeAudio } from '../services/geminiService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import { Switch } from './ui/Switch';
import { cn } from '../lib/utils';

interface CreationPanelProps {
  onCreate: (request: GenerationRequest) => void;
  isGenerating: boolean;
}

export const CreationPanel: React.FC<CreationPanelProps> = ({ onCreate, isGenerating }) => {
  const [creationType, setCreationType] = useState<'audio' | 'video'>('audio');
  const [mode, setMode] = useState<ViewMode>(ViewMode.SIMPLE);
  const [description, setDescription] = useState('');
  const [instrumental, setInstrumental] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  
  // Custom mode states
  const [customLyrics, setCustomLyrics] = useState('');
  const [customStyle, setCustomStyle] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  // Pro Mode States
  const [proMode, setProMode] = useState(false);
  const [instruments, setInstruments] = useState<string[]>([]);
  const [currentInstrument, setCurrentInstrument] = useState('');
  const [reverbLevel, setReverbLevel] = useState(50);
  const [tempo, setTempo] = useState<'Slow' | 'Medium' | 'Fast'>('Medium');

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const handleAddInstrument = () => {
    if (currentInstrument.trim()) {
        setInstruments([...instruments, currentInstrument.trim()]);
        setCurrentInstrument('');
    }
  };

  const handleRemoveInstrument = (idx: number) => {
    setInstruments(instruments.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    // For Video, we need to check API Key Selection explicitly if not already handled by env
    if (creationType === 'video') {
         if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey && (window as any).aistudio.openSelectKey) {
                await (window as any).aistudio.openSelectKey();
                return; 
            }
         }
    }

    if (mode === ViewMode.SIMPLE && !description.trim()) return;
    
    // Construct style from pro options if enabled
    let finalStyle = mode === ViewMode.CUSTOM ? customStyle : '';
    let finalDescription = description;

    if (creationType === 'audio' && proMode) {
        const mixDetails = `Tempo: ${tempo}, Reverb: ${reverbLevel}%, Instruments: ${instruments.join(', ')}`;
        finalStyle = `${finalStyle} ${mixDetails}`.trim();
        // If in simple mode, append to description for lack of a style field
        if (mode === ViewMode.SIMPLE) {
            finalDescription = `${description} [${mixDetails}]`;
        }
    }

    onCreate({
      prompt: finalDescription,
      isInstrumental: instrumental,
      lyrics: mode === ViewMode.CUSTOM ? customLyrics : undefined,
      style: mode === ViewMode.CUSTOM ? finalStyle : undefined,
      title: mode === ViewMode.CUSTOM ? customTitle : undefined,
      type: creationType,
      aspectRatio: aspectRatio
    });
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
        }

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            setIsRecording(true); 
            const text = await transcribeAudio(blob);
            setDescription(prev => prev + (prev ? " " : "") + text);
            setIsRecording(false);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Mic error", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
    }
  };

  const toggleRecording = () => {
      if (isRecording) stopRecording();
      else startRecording();
  };

  return (
    <div className="w-full max-w-md flex flex-col h-full bg-[#18181b] p-5 overflow-y-auto border-r border-zinc-900 shadow-2xl z-10 custom-scrollbar">
      
      {/* Header / Type Switch */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-white tracking-tight">Create</h2>
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            <Button
                variant={creationType === 'audio' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCreationType('audio')}
                className="h-8 w-10 p-0"
                title="Create Music"
            >
                <Music size={16} />
            </Button>
            <Button
                variant={creationType === 'video' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCreationType('video')}
                className="h-8 w-10 p-0"
                title="Create Video"
            >
                <Video size={16} />
            </Button>
        </div>
      </div>

      {/* Mode Switch (Only for Audio) */}
      {creationType === 'audio' && (
        <div className="flex items-center justify-between mb-6">
             <div className="flex items-center bg-black rounded-lg p-1 border border-zinc-800">
                <button 
                    onClick={() => setMode(ViewMode.SIMPLE)}
                    className={cn(
                        "px-3 py-1 text-xs font-medium rounded-md transition-all",
                        mode === ViewMode.SIMPLE ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    )}
                >
                    Simple
                </button>
                <button 
                    onClick={() => setMode(ViewMode.CUSTOM)}
                    className={cn(
                        "px-3 py-1 text-xs font-medium rounded-md transition-all",
                        mode === ViewMode.CUSTOM ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    )}
                >
                    Custom
                </button>
            </div>
            <div className="flex items-center gap-2">
                 <Label>Instrumental</Label>
                 <Switch checked={instrumental} onCheckedChange={setInstrumental} />
            </div>
        </div>
      )}

      {/* Form Content */}
      <div className="flex-1 space-y-6">

        {/* Video Options */}
        {creationType === 'video' && (
            <div className="space-y-3">
                 <Label>Aspect Ratio</Label>
                 <div className="flex gap-2">
                     <Button 
                        variant={aspectRatio === '16:9' ? 'secondary' : 'outline'}
                        onClick={() => setAspectRatio('16:9')}
                        className="flex-1 text-xs"
                     >
                        Landscape (16:9)
                     </Button>
                     <Button 
                        variant={aspectRatio === '9:16' ? 'secondary' : 'outline'}
                        onClick={() => setAspectRatio('9:16')}
                        className="flex-1 text-xs"
                     >
                        Portrait (9:16)
                     </Button>
                 </div>
            </div>
        )}
        
        {/* Simple Mode / Video Prompt */}
        {(mode === ViewMode.SIMPLE || creationType === 'video') ? (
           <div className="space-y-3 relative">
              <div className="flex justify-between items-center">
                <Label>{creationType === 'audio' ? 'Song Description' : 'Video Prompt'}</Label>
                <Button 
                    variant="ghost"
                    size="sm"
                    onClick={toggleRecording}
                    className={cn("h-6 px-2 text-xs gap-1", isRecording ? 'text-red-500 animate-pulse' : 'text-zinc-500')}
                >
                    {isRecording ? <MicOff size={12} /> : <Mic size={12} />}
                    {isRecording ? 'Recording...' : 'Voice Input'}
                </Button>
              </div>
              <Textarea 
                className="h-36 text-base"
                placeholder={creationType === 'audio' ? "A chill lofi beat about coding in the rain..." : "A neon hologram of a cat driving at top speed"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
           </div>
        ) : (
          /* Custom Mode (Audio Only) */
          <>
             <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <Label>Lyrics</Label>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-zinc-400">Randomize</Button>
                </div>
                <Textarea 
                    className="h-48 font-mono text-sm leading-relaxed"
                    placeholder="[Verse]&#10;Enter your own lyrics..."
                    value={customLyrics}
                    onChange={(e) => setCustomLyrics(e.target.value)}
                    disabled={instrumental}
                />
             </div>

             <div className="space-y-3">
                <Label>Style of Music</Label>
                <Textarea 
                    className="h-24"
                    placeholder="acoustic pop, upbeat, female vocals"
                    value={customStyle}
                    onChange={(e) => setCustomStyle(e.target.value)}
                />
             </div>

             <div className="space-y-3">
                <Label>Title</Label>
                <Input 
                    placeholder="Enter a title"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                />
             </div>
          </>
        )}

        {/* Pro Music Options */}
        {creationType === 'audio' && (
            <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                    <Label 
                        className="cursor-pointer text-orange-500 flex items-center gap-1.5 hover:text-orange-400 transition-colors select-none"
                        onClick={() => setProMode(!proMode)}
                    >
                        <Sliders size={12} /> Pro Sonic Palette
                    </Label>
                    <Switch checked={proMode} onCheckedChange={setProMode} />
                </div>

                {proMode && (
                    <div className="space-y-5 pl-3 border-l-2 border-zinc-800 animate-fade-in bg-zinc-900/30 p-3 rounded-r-lg">
                        {/* Instruments */}
                        <div className="space-y-3">
                            <Label>Instruments</Label>
                            <div className="flex gap-2">
                                <Input 
                                    className="h-8 text-xs bg-zinc-900 border-zinc-700" 
                                    placeholder="e.g. 808 Bass, Violin..." 
                                    value={currentInstrument}
                                    onChange={(e) => setCurrentInstrument(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddInstrument()}
                                />
                                <Button size="sm" variant="secondary" onClick={handleAddInstrument} className="h-8 w-8 p-0 shrink-0">
                                    <Plus size={14} />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {instruments.map((inst, i) => (
                                    <span key={i} className="flex items-center gap-1 bg-zinc-800 text-xs px-2 py-1 rounded-md text-zinc-300 border border-zinc-700">
                                        {inst}
                                        <X size={10} className="cursor-pointer hover:text-white" onClick={() => handleRemoveInstrument(i)}/>
                                    </span>
                                ))}
                                {instruments.length === 0 && <span className="text-[10px] text-zinc-600 italic">No instruments added</span>}
                            </div>
                        </div>

                        {/* Mixing Sliders */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-zinc-500 font-medium">
                                    <span>Reverb Level</span>
                                    <span>{reverbLevel}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={reverbLevel}
                                    onChange={(e) => setReverbLevel(Number(e.target.value))}
                                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="normal-case text-zinc-500">Tempo</Label>
                                <div className="flex bg-zinc-900 rounded-md p-1 border border-zinc-800">
                                    {['Slow', 'Medium', 'Fast'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTempo(t as any)}
                                            className={cn(
                                                "flex-1 text-[10px] py-1.5 rounded transition-all",
                                                tempo === t ? 'bg-zinc-700 text-white font-medium shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-6 border-t border-zinc-800 mt-6">
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-4 font-medium">
             <span>Toori AI v3.5</span>
             <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span> 10 Credits</span>
        </div>
        <Button 
            onClick={handleCreate}
            disabled={isGenerating || (mode === ViewMode.SIMPLE && creationType === 'audio' && !description && !customTitle && !customStyle) || (creationType === 'video' && !description)}
            className="w-full h-12 text-base font-bold bg-gradient-to-r from-orange-500 to-purple-600 hover:opacity-90 transition-all shadow-lg shadow-orange-500/20"
        >
            {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {creationType === 'audio' ? 'Producing...' : 'Rendering...'}
                </>
            ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5 fill-white" /> {creationType === 'audio' ? 'Create Music' : 'Generate Video'}
                </>
            )}
        </Button>
      </div>
    </div>
  );
};