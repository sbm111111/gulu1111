
import React from 'react';
import { AppStage, Theme } from '../types';

interface ControlsProps {
  stage: AppStage;
  isListening: boolean;
  onMicClick: () => void;
  onSave: () => void;
  onUploadClick: () => void;
  onBack: () => void;
  theme: Theme;
}

// --- Helper for conditional classes ---
const getGlassClass = (theme: Theme, active: boolean = false) => {
    const isDark = theme === 'dark';
    if (active) return 'bg-gemini text-black shadow-[0_0_20px_rgba(0,214,104,0.4)] border-transparent';
    
    return isDark 
        ? 'bg-black/40 border-white/10 text-zinc-300 hover:bg-white/5 hover:border-white/30' 
        : 'bg-white/40 border-white/60 text-zinc-600 hover:bg-white/80 hover:border-zinc-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)]';
};

export const GeminiStatus: React.FC<{ loading?: boolean; text?: string; theme: Theme }> = ({ loading, text = "Gemini", theme }) => {
  const isDark = theme === 'dark';
  return (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none transition-all duration-500">
        <div className={`backdrop-blur-md rounded-full px-8 py-3 flex items-center space-x-3 transition-colors duration-500 border
            ${isDark 
                ? 'bg-black/40 border-white/10 shadow-2xl' 
                : 'bg-white/60 border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]'}`}>
        <div className={`w-3 h-3 rounded-full ${loading ? 'bg-gemini animate-pulse' : 'bg-gemini'} shadow-[0_0_10px_#00D668]`}></div>
        <span className={`font-serif tracking-widest text-lg opacity-90 transition-colors ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`}>
            {text}
        </span>
        </div>
    </div>
  );
};

export const FloatingMic: React.FC<{ isListening: boolean; onClick: () => void; theme: Theme }> = ({ isListening, onClick, theme }) => {
  const isDark = theme === 'dark';
  return (
      <button 
        onClick={onClick}
        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-700 relative group border
        ${isListening 
            ? 'bg-gemini text-black shadow-[0_0_50px_rgba(0,214,104,0.4)] scale-110 border-transparent' 
            : (isDark 
                ? 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-400 hover:text-white hover:bg-white/5' 
                : 'bg-white/30 border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800 hover:bg-white/60 shadow-lg')}`}
      >
        {/* Ripple Effect */}
        {isListening && (
            <>
                <div className="absolute inset-0 rounded-full border border-gemini animate-ping opacity-30 delay-75"></div>
                <div className="absolute inset-0 rounded-full border border-gemini animate-ping opacity-20 delay-150"></div>
            </>
        )}
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${isListening ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isListening ? 2.5 : 1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
  );
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const TimerDisplay: React.FC<{ seconds: number; theme: Theme }> = ({ seconds, theme }) => {
    const isDark = theme === 'dark';
    return (
        <div className={`font-mono text-base tracking-widest px-4 py-1 rounded border backdrop-blur mb-6 transition-colors duration-500
            ${isDark 
                ? 'bg-black/40 border-gemini/20 text-gemini shadow-[0_0_15px_rgba(0,214,104,0.1)]' 
                : 'bg-white/40 border-gemini/30 text-gemini shadow-sm'}`}>
            {formatTime(seconds)}
        </div>
    );
};

export const ActionButton: React.FC<{ icon?: React.ReactNode, label: string, onClick: () => void, danger?: boolean, theme: Theme }> = ({ icon, label, onClick, danger, theme }) => {
    const isDark = theme === 'dark';
    // Base styles
    const baseStyle = "flex items-center space-x-2 px-6 py-2 rounded-full border backdrop-blur-md transition-all duration-300 text-sm tracking-wide";
    
    let colorStyle = "";
    if (danger) {
        colorStyle = "border-red-900/50 text-red-400 bg-red-900/10 hover:bg-red-900/30";
    } else {
        colorStyle = isDark 
            ? "border-zinc-700 text-zinc-300 bg-black/40 hover:bg-zinc-800 hover:border-gemini hover:text-gemini"
            : "border-white/60 text-zinc-600 bg-white/40 hover:bg-white/80 hover:border-gemini hover:text-gemini shadow-sm";
    }

    return (
        <button onClick={onClick} className={`${baseStyle} ${colorStyle}`}>
            {icon}
            <span>{label}</span>
        </button>
    );
};

export const SecondaryButton: React.FC<{ onClick: () => void, icon: React.ReactNode, theme: Theme }> = ({ onClick, icon, theme }) => {
    const isDark = theme === 'dark';
    return (
        <button 
            onClick={onClick}
            className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors backdrop-blur-md
                ${isDark 
                    ? 'border-zinc-800 bg-black/40 text-zinc-500 hover:text-white hover:border-white' 
                    : 'border-white/60 bg-white/40 text-zinc-500 hover:text-zinc-800 hover:border-zinc-300 shadow-sm'}`}
        >
            {icon}
        </button>
    );
};

export const StickyBottom: React.FC<{ onClick: () => void, label?: string, theme: Theme }> = ({ onClick, label = "Upload Another", theme }) => {
    const isDark = theme === 'dark';
    return (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 animate-fade-in pointer-events-none">
            <button 
            onClick={onClick}
            className={`pointer-events-auto group flex items-center space-x-3 px-8 py-3 rounded-lg border transition-all duration-300 backdrop-blur shadow-xl
                ${isDark 
                    ? 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-500' 
                    : 'bg-white/70 border-white/60 hover:bg-white/90 hover:border-zinc-300'}`}
            >
            <span className={`font-sans text-xs uppercase tracking-[0.2em] transition-colors
                ${isDark ? 'text-zinc-400 group-hover:text-white' : 'text-zinc-500 group-hover:text-zinc-800'}`}>
                {label}
            </span>
            <svg className={`w-3 h-3 transition-transform group-hover:translate-x-1 
                ${isDark ? 'text-zinc-500 group-hover:text-white' : 'text-zinc-400 group-hover:text-zinc-800'}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
        </div>
    );
};
