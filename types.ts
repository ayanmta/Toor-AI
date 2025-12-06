export interface Song {
  id: string;
  title: string;
  artist: string;
  imageUrl: string;
  audioUrl: string | null;
  videoUrl?: string | null;
  lyrics: string;
  tags: string[];
  duration: string;
  createdAt: number;
  status: 'generating' | 'ready' | 'error';
  isInstrumental: boolean;
  prompt: string;
  type: 'audio' | 'video';
}

export interface UserState {
  credits: number;
  isPro: boolean;
}

export enum ViewMode {
  SIMPLE = 'SIMPLE',
  CUSTOM = 'CUSTOM'
}

export enum AppView {
  CREATE = 'CREATE',
  CHAT = 'CHAT',
  LIVE = 'LIVE'
}

export interface GenerationRequest {
  prompt: string;
  isInstrumental: boolean;
  lyrics?: string; // Optional for Custom mode
  style?: string; // Optional for Custom mode
  title?: string; // Optional for Custom mode
  type: 'audio' | 'video';
  aspectRatio?: '16:9' | '9:16';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}