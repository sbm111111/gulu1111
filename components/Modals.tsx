
import React, { ChangeEvent, useState, useEffect } from 'react';
import { DiaryEntry, Theme } from '../types';

interface UploadModalProps {
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  theme: Theme;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onFileSelect, theme }) => {
  const isDark = theme === 'dark';
  return (
    <div className={`fixed inset-0 z-40 flex items-center justify-center backdrop-blur-sm transition-colors duration-500 ${isDark ? 'bg-black/60' : 'bg-white/40'}`}>
      <div className={`w-[400px] h-[300px] border p-8 flex flex-col items-center justify-center text-center relative transition-colors duration-500
         ${isDark ? 'border-zinc-800 bg-black/90' : 'border-zinc-200 bg-white/90 shadow-lg'}`}>
        
        {/* Decorative Corners */}
        <div className={`absolute top-0 left-0 w-4 h-4 border-t border-l ${isDark ? 'border-zinc-600' : 'border-zinc-300'}`}></div>
        <div className={`absolute bottom-0 right-0 w-4 h-4 border-b border-r ${isDark ? 'border-zinc-600' : 'border-zinc-300'}`}></div>

        <div className={`w-16 h-16 rounded-full border flex items-center justify-center mb-6 ${isDark ? 'border-zinc-700' : 'border-zinc-300'}`}>
            <svg className={`w-6 h-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
        </div>
        
        <h2 className={`font-serif text-2xl mb-2 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Share a Memory</h2>
        <p className={`text-sm mb-8 font-light ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Upload an image to see it dissolved into living stardust.</p>
        
        <label className={`cursor-pointer px-6 py-3 border text-sm transition-colors rounded
            ${isDark 
                ? 'border-zinc-700 hover:border-zinc-400 text-zinc-300' 
                : 'border-zinc-300 hover:border-zinc-500 text-zinc-600 hover:text-zinc-900 bg-zinc-50'}`}>
            Select Image
            <input type="file" accept="image/*" className="hidden" onChange={onFileSelect} />
        </label>
      </div>
    </div>
  );
};

interface DiaryCardProps { 
    entry: DiaryEntry; 
    onClose: () => void; 
    onDelete: (id: string) => void;
    onPlay: (text: string) => void;
    onStop: () => void;
    theme: Theme;
}

export const DiaryCard: React.FC<DiaryCardProps> = ({ entry, onClose, onDelete, onPlay, onStop, theme }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const isDark = theme === 'dark';
  
  // Check if this is an Oracle Report (Read-only mode)
  const isOracle = entry.tags?.some(tag => tag.toUpperCase().includes('ORACLE'));

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const togglePlay = () => {
      if (isPlaying) {
          onStop();
          setIsPlaying(false);
      } else {
          onPlay(entry.content);
          setIsPlaying(true);
      }
  };

  // Helper to copy text
  const handleCopy = () => {
      navigator.clipboard.writeText(entry.content);
  };

  // Format Date logic
  const formatDate = (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        if(isNaN(d.getTime())) return "DATE_UNKNOWN";
        
        const yy = d.getFullYear().toString().slice(-2);
        const mm = (d.getMonth() + 1).toString().padStart(2, '0');
        const dd = d.getDate().toString().padStart(2, '0');
        return `${yy}.${mm}.${dd}`;
      } catch { return "DATE_UNKNOWN"; }
  };

  return (
    <div className={`fixed inset-0 z-[80] flex items-center justify-center animate-fade-in backdrop-blur-xl transition-colors duration-500
        ${isDark ? 'bg-black/90' : 'bg-cloud/80'}`}>
        
        {/* Background Ambience */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[700px] bg-gemini/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* --- MAIN CARD CONTAINER --- */}
        <div className={`relative w-[400px] h-[680px] rounded-[32px] overflow-hidden shadow-2xl flex flex-col group border transition-all duration-500
            ${isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-white/40 bg-[#ffffff] shadow-[0_20px_50px_rgba(0,0,0,0.1)]'}`}>
            
            {/* 1. Background Image with Gradient */}
            <div className="absolute inset-0 z-0">
                <img src={entry.imageUrl} alt="Background" className={`w-full h-full object-cover transition-opacity duration-500 ${isDark ? 'opacity-60' : 'opacity-30'}`} />
                
                {/* Gradient Adjustment for Light/Dark */}
                <div className={`absolute inset-0 bg-gradient-to-b transition-colors duration-500
                    ${isDark 
                        ? 'from-black/40 via-black/80 to-black' 
                        : 'from-white/30 via-white/80 to-[#ffffff]'}`}>
                </div>
                
                {/* Top decorative glow */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-gemini/20 to-transparent opacity-30"></div>
            </div>

            {/* 2. Content Layer */}
            <div className="relative z-10 flex flex-col h-full p-8">
                
                {/* Header Section */}
                <div className="flex justify-between items-start mb-8">
                    {/* Title */}
                    <div className="max-w-[70%]">
                        <div className={`text-[10px] font-mono tracking-widest uppercase mb-2 ${isDark ? 'text-gemini' : 'text-zinc-600'}`}>
                            {isOracle ? '/// ORACLE_TRANSMISSION' : '/// MEMORY_FRAGMENT'}
                        </div>
                        <h1 className={`font-serif text-3xl leading-none tracking-wide drop-shadow-lg transition-colors
                            ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                            {entry.title}
                        </h1>
                    </div>

                    {/* Metadata Column */}
                    <div className={`flex flex-col items-end text-[9px] font-mono space-y-1 tracking-widest opacity-80 transition-colors
                        ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        <span>{formatDate(entry.date)}</span>
                        <span>{entry.tags?.[1] || 'UNKNOWN'}</span>
                        <span className="text-gemini opacity-60">ID::{entry.id.slice(0,4)}</span>
                    </div>
                </div>

                {/* Scrollable Text Body */}
                <div 
                    className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative"
                    style={{ 
                        maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)', 
                        WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' 
                    }}
                >
                    <div className={`prose prose-sm font-serif leading-8 tracking-wide text-justify opacity-90 transition-colors
                        ${isDark ? 'prose-invert text-zinc-300' : 'text-zinc-600'}`}>
                        {entry.content.split('\n').map((para, i) => (
                            <p key={i} className={`mb-6 first-letter:text-2xl first-letter:font-normal ${isDark ? 'first-letter:text-gemini' : 'first-letter:text-zinc-800'}`}>
                                {para}
                            </p>
                        ))}
                        {/* Signature for Oracle */}
                        {isOracle && (
                            <div className={`mt-8 text-center font-mono text-[10px] tracking-[0.3em] uppercase opacity-50 ${isDark ? 'text-white' : 'text-black'}`}>
                                * * *<br/>End of Transmission
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Bottom Dock (Floating Action Bar) */}
                <div className="mt-6 flex justify-center">
                    <div className={`flex items-center gap-6 px-8 py-4 backdrop-blur-2xl rounded-full border shadow-2xl relative transition-colors
                        ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-100/50 border-white/60 shadow-lg'}`}>
                        
                        {/* Button 1: Save/Read (Teal Glow) */}
                        <button 
                            onClick={togglePlay}
                            className={`group relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300
                                ${isPlaying 
                                    ? 'bg-gemini text-black' 
                                    : (isDark ? 'bg-transparent text-zinc-400 hover:text-white' : 'bg-transparent text-zinc-400 hover:text-zinc-900')}`}
                        >
                            <div className={`absolute inset-0 rounded-full blur-md bg-gemini/40 opacity-0 group-hover:opacity-100 transition-opacity ${isPlaying ? 'opacity-50' : ''}`}></div>
                            {isPlaying ? (
                                <svg className="w-5 h-5 relative z-10 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                            ) : (
                                <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                        </button>

                        {/* Button 2: Copy/Stack */}
                        <button 
                            onClick={handleCopy}
                            className={`group relative w-10 h-10 flex items-center justify-center rounded-full transition-colors
                                ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}
                        >
                            <div className="absolute inset-0 rounded-full blur-md bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>

                        {/* Button 3: Delete (Only if NOT Oracle) */}
                        {!isOracle && (
                            <button 
                                onClick={() => onDelete(entry.id)}
                                className={`group relative w-10 h-10 flex items-center justify-center rounded-full transition-colors
                                    ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}
                            >
                                <div className="absolute inset-0 rounded-full blur-md bg-pink-500/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        )}

                    </div>
                </div>

            </div>
        </div>

        {/* 4. External Environment */}
        <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-6 animate-fade-in delay-100">
            {/* Close / Return */}
            <button onClick={onClose} className={`flex items-center gap-2 px-6 py-2 rounded-full border text-sm transition-colors tracking-wide
                ${isDark 
                    ? 'border-zinc-800 text-zinc-400 bg-black/60 hover:bg-zinc-900 hover:text-white' 
                    : 'border-zinc-200 text-zinc-500 bg-white/60 hover:bg-zinc-100 hover:text-black'}`}>
                <span>{isOracle ? 'Close Transmission' : 'Close Memory'}</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>

    </div>
  );
};

export const LoadingOverlay: React.FC<{ text: string; theme: Theme }> = ({ text, theme }) => {
  const isDark = theme === 'dark';
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-md transition-colors duration-500
      ${isDark ? 'bg-black/80' : 'bg-white/60'}`}>
      
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 border-t-2 border-gemini rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-r-2 border-gemini/50 rounded-full animate-spin reverse-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-gemini rounded-full animate-pulse"></div>
        </div>
      </div>

      <h2 className={`font-serif text-xl tracking-[0.2em] animate-pulse
        ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
        {text}
      </h2>
    </div>
  );
};
