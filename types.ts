
export enum AppStage {
  LANDING = 'LANDING',
  UPLOAD_MODAL = 'UPLOAD_MODAL',
  PROCESSING_IMAGE = 'PROCESSING_IMAGE',
  CHATTING = 'CHATTING',
  SAVING = 'SAVING',
  MEMORY_CORRIDOR = 'MEMORY_CORRIDOR',
  INFO = 'INFO',
  GARDEN = 'GARDEN'
}

export type Theme = 'dark' | 'light';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  date: string;
  content: string;
  tags?: string[];
  imageUrl: string; // The "Album Cover"
}

export interface OracleReport {
    id: number;
    access_code: string;
    client_name: string;
    title: string;
    content: string;
    image_url: string;
    type: string;
    created_at: string;
}

export interface Coordinates {
  x: number;
  y: number;
  z: number; // Added depth
  originX: number;
  originY: number;
  color: string;
  baseSize: number;
  size: number;
}

export interface VisualSettings {
  particleCount: number; // Used as general density or size scaler
  flowSpeed: number;
  noiseStrength: number;
  audioSensitivity: number;
  connectionThreshold: number;
  dispersion: number; // New: Controls how much the edges dissolve
}
