import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, X, PhoneOff, Volume2 } from 'lucide-react';

export const LiveInterface: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [isActive, setIsActive] = useState(false);
    const [status, setStatus] = useState("Ready to connect");
    const [volume, setVolume] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Audio Context Refs
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const outputNodeRef = useRef<GainNode | null>(null);
    const sessionRef = useRef<any>(null);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    
    // Playback scheduling
    const nextStartTimeRef = useRef<number>(0);

    const startSession = async () => {
        setStatus("Connecting...");
        const apiKey = process.env.API_KEY;
        if (!apiKey) return;

        const ai = new GoogleGenAI({ apiKey });
        
        // Initialize Audio Contexts
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        inputAudioContextRef.current = inputCtx;
        outputAudioContextRef.current = outputCtx;
        outputNodeRef.current = outputCtx.createGain();
        outputNodeRef.current.connect(outputCtx.destination);

        // Get Microphone Stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Connect Live Session
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    setStatus("Connected. Listening...");
                    setIsActive(true);
                    
                    // Setup Input Processing
                    const source = inputCtx.createMediaStreamSource(stream);
                    const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        
                        // Simple volume visualization
                        let sum = 0;
                        for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                        setVolume(Math.sqrt(sum / inputData.length) * 100);

                        const pcmBlob = createBlob(inputData);
                        sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputCtx.destination);
                },
                onmessage: async (msg: LiveServerMessage) => {
                    const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio) {
                        const audioBuffer = await decodeAudioData(
                            decode(base64Audio),
                            outputCtx,
                            24000,
                            1
                        );
                        
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputNodeRef.current!);
                        
                        source.addEventListener('ended', () => {
                            sourcesRef.current.delete(source);
                        });

                        // Schedule playback
                        const now = outputCtx.currentTime;
                        const startTime = Math.max(nextStartTimeRef.current, now);
                        source.start(startTime);
                        nextStartTimeRef.current = startTime + audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }
                    
                    if (msg.serverContent?.interrupted) {
                        sourcesRef.current.forEach(s => s.stop());
                        sourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                    }
                },
                onclose: () => {
                    setStatus("Disconnected");
                    setIsActive(false);
                },
                onerror: (err) => {
                    console.error(err);
                    setStatus("Error connecting");
                }
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                },
                systemInstruction: "You are a creative music assistant. Help the user brainstorm song ideas, hum melodies, or discuss music theory enthusiastically."
            }
        });

        sessionRef.current = sessionPromise;
    };

    const stopSession = () => {
        // Cleanup audio contexts and session
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        sessionRef.current?.then((s: any) => s.close());
        setIsActive(false);
        setStatus("Ready to connect");
    };

    // Helper functions
    function createBlob(data: Float32Array) {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
        
        let binary = '';
        const bytes = new Uint8Array(int16.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
        const base64 = btoa(binary);
        
        return {
            data: base64,
            mimeType: 'audio/pcm;rate=16000'
        };
    }

    function decode(base64: string) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        return bytes;
    }

    async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        for (let i = 0; i < numChannels; i++) {
            const channel = buffer.getChannelData(i);
            for (let j = 0; j < frameCount; j++) {
                channel[j] = dataInt16[j * numChannels + i] / 32768.0;
            }
        }
        return buffer;
    }

    useEffect(() => {
        return () => stopSession();
    }, []);

    return (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-8 backdrop-blur-xl animate-fade-in">
            <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
                <X size={32} />
            </button>
            
            <div className="text-center space-y-8 max-w-2xl w-full">
                <div className="space-y-2">
                    <h2 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                        Live Jam Session
                    </h2>
                    <p className="text-zinc-400">{status}</p>
                </div>

                {/* Visualizer / Avatar */}
                <div className="relative w-64 h-64 mx-auto">
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-red-500/20 to-orange-500/20 blur-3xl transition-all duration-300 ${isActive ? 'scale-110 opacity-100' : 'scale-75 opacity-0'}`} />
                    <div className="relative w-full h-full rounded-full border border-zinc-800 bg-black flex items-center justify-center overflow-hidden shadow-2xl">
                         {/* Dynamic rings based on volume */}
                         {isActive && (
                            <>
                                <div className="absolute inset-0 rounded-full border border-red-500/30 transition-transform duration-75" style={{ transform: `scale(${1 + volume * 0.1})` }} />
                                <div className="absolute inset-0 rounded-full border border-orange-500/30 transition-transform duration-75" style={{ transform: `scale(${1 + volume * 0.2})` }} />
                            </>
                         )}
                         <Mic size={64} className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-zinc-700'}`} />
                    </div>
                </div>

                <div className="flex justify-center gap-6">
                    {!isActive ? (
                        <button 
                            onClick={startSession}
                            className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform"
                        >
                            <Mic size={24} /> Start Session
                        </button>
                    ) : (
                        <button 
                            onClick={stopSession}
                            className="flex items-center gap-3 px-8 py-4 bg-red-500 text-white rounded-full font-bold text-lg hover:bg-red-600 transition-colors"
                        >
                            <PhoneOff size={24} /> End Session
                        </button>
                    )}
                </div>
                
                <div className="text-sm text-zinc-600">
                    Use headphones for the best experience.
                </div>
            </div>
        </div>
    );
};