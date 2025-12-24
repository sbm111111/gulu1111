
import React, { useEffect } from 'react';
import { DiaryEntry, Theme } from '../types';
import { HolographicCard } from './HolographicCard';

interface MemoryCorridorProps {
  entries: DiaryEntry[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onSelect: (entry: DiaryEntry) => void;
  onCreateNew: () => void;
  theme: Theme;
}

export const MemoryCorridor: React.FC<MemoryCorridorProps> = ({ 
    entries, 
    currentIndex, 
    onIndexChange, 
    onSelect, 
    onCreateNew,
    theme
}) => {
  const isDark = theme === 'dark';

  // --- Interaction Logic ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (entries.length === 0) return;
      if (e.key === 'ArrowLeft') {
        onIndexChange((currentIndex - 1 + entries.length) % entries.length);
      } else if (e.key === 'ArrowRight') {
        onIndexChange((currentIndex + 1) % entries.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        onSelect(entries[currentIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [entries, currentIndex, onIndexChange, onSelect]);

  if (entries.length === 0) {
    return (
        <div className={`absolute inset-0 flex flex-col items-center justify-center animate-fade-in z-40 transition-colors duration-700
            ${isDark ? 'bg-void' : 'bg-cloud'}`}>
            <h3 className={`text-xl font-serif mb-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Void is Empty</h3>
            <button 
                onClick={onCreateNew}
                className={`mt-4 px-8 py-2 border rounded text-xs tracking-[0.2em] uppercase transition-colors
                    ${isDark 
                        ? 'border-zinc-800 text-zinc-500 hover:text-white hover:border-gemini' 
                        : 'border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:border-gemini'}`}
            >
                Create First Memory
            </button>
        </div>
    );
  }

  const currentEntry = entries[currentIndex];

  return (
    <div className={`absolute inset-0 z-40 overflow-hidden flex flex-col perspective-[1200px] transition-colors duration-700
        ${isDark ? 'bg-void' : 'bg-cloud'}`}>
      
      {/* 1. HUD Layer (Overlay Info) - Minimalist */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 z-50 pointer-events-none text-center w-full max-w-2xl px-4 transition-all duration-500">
          <div key={currentEntry.id} className="animate-fade-in">
             <div className="flex items-center justify-center gap-2 mb-4">
                 <span className="w-1 h-1 bg-gemini rounded-full"></span>
                 <p className="text-gemini/80 text-[10px] tracking-[0.4em] font-mono uppercase">
                    {currentEntry.date}
                 </p>
             </div>
             <h2 className={`font-serif text-3xl md:text-5xl tracking-wide opacity-90 leading-tight drop-shadow-2xl transition-colors
                ${isDark ? 'text-white' : 'text-zinc-800'}`}>
                {currentEntry.title}
             </h2>
             <div className="mt-8 flex justify-center gap-2">
                 {entries.map((_, i) => (
                     <div key={i} className={`w-1 h-1 rounded-full transition-all duration-300 
                        ${i === currentIndex 
                            ? (isDark ? 'bg-white scale-125' : 'bg-zinc-800 scale-125') 
                            : (isDark ? 'bg-zinc-800' : 'bg-zinc-300')}`}></div>
                 ))}
             </div>
          </div>
      </div>

      {/* 2. 3D Carousel Container */}
      <div className="flex-1 relative flex items-center justify-center transform-style-3d">
        {entries.map((entry, idx) => {
            // Logic: Circular Buffer Offset
            let offset = idx - currentIndex;
            const len = entries.length;
            if (offset > len / 2) offset -= len;
            if (offset < -len / 2) offset += len;

            if (Math.abs(offset) > 2) return null;

            const isActive = offset === 0;

            // --- Transform Logic ---
            const spacing = 400; 
            const depth = -300;  
            const rotateAngle = -25; 

            const tx = offset * spacing;
            const tz = isActive ? 0 : depth;
            const ry = isActive ? 0 : offset * rotateAngle;
            const scale = isActive ? 1.0 : 0.8; 
            const zIndex = 10 - Math.abs(offset);
            const opacity = isActive ? 1 : 0.4;

            // Container Style
            const style: React.CSSProperties = {
                position: 'absolute',
                width: '400px',
                height: '550px',
                transform: `translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${scale})`,
                zIndex: zIndex,
                transition: 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)', 
                transformStyle: 'preserve-3d', 
                opacity: opacity
            };

            return (
                <div 
                    key={entry.id}
                    style={style}
                    onClick={() => {
                        if (isActive) onSelect(entry);
                        else onIndexChange(idx);
                    }}
                    className="flex items-center justify-center cursor-pointer group"
                >
                    {/* Removed shadow-2xl, rounded corners, overflow-hidden and bg-color overlay to remove "Card" look */}
                    <div className="w-full h-full relative">
                        <HolographicCard imageUrl={entry.imageUrl} settings={{...{particleCount: 2, flowSpeed: 0.2, noiseStrength: 0.5, audioSensitivity: 1, connectionThreshold: 0, dispersion: 0}, particleCount: isActive ? 2 : 1}} />
                    </div>
                </div>
            );
        })}
      </div>

      {/* 3. Navigation Controls */}
      <div className="absolute top-1/2 left-0 w-full transform -translate-y-1/2 flex justify-between px-8 md:px-24 pointer-events-none z-50">
          <button 
             onClick={(e) => { e.stopPropagation(); onIndexChange((currentIndex - 1 + entries.length) % entries.length); }}
             className={`w-16 h-16 rounded-full flex items-center justify-center pointer-events-auto transition-all duration-300 hover:scale-110
                ${isDark ? 'text-zinc-600 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}
          >
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 19l-7-7 7-7"/></svg>
          </button>
          
          <button 
             onClick={(e) => { e.stopPropagation(); onIndexChange((currentIndex + 1) % entries.length); }}
             className={`w-16 h-16 rounded-full flex items-center justify-center pointer-events-auto transition-all duration-300 hover:scale-110
                ${isDark ? 'text-zinc-600 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}
          >
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5l7 7-7 7"/></svg>
          </button>
      </div>

      {/* 4. Bottom Tools */}
      <div className="absolute bottom-12 w-full flex flex-col items-center justify-center z-50 pointer-events-auto">
          <button 
            onClick={onCreateNew}
            className={`group flex items-center space-x-2 transition-colors
                ${isDark ? 'text-zinc-600 hover:text-white' : 'text-zinc-400 hover:text-zinc-800'}`}
          >
              <span className="text-[10px] uppercase tracking-[0.25em]">New Entry</span>
              <span className="text-lg leading-none transform group-hover:rotate-90 transition-transform">+</span>
          </button>
      </div>

    </div>
  );
};
