
import React from 'react';
import { Theme } from '../types';

interface TopNavProps {
  currentView: 'LOG' | 'MEMORY' | 'GARDEN' | 'INFO';
  onNavigate: (view: 'LOG' | 'MEMORY' | 'GARDEN' | 'INFO') => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ currentView, onNavigate, theme, onToggleTheme }) => {
  
  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-zinc-500' : 'text-zinc-400';
  const activeColor = isDark ? 'text-white' : 'text-zinc-800';
  const hoverColor = isDark ? 'hover:text-zinc-300' : 'hover:text-zinc-600';
  const borderActive = isDark ? 'border-white' : 'border-zinc-800';
  const borderHover = isDark ? 'hover:border-zinc-800' : 'hover:border-zinc-300';

  const getLinkClass = (view: 'LOG' | 'MEMORY' | 'GARDEN' | 'INFO') => {
    const isActive = currentView === view;
    return `uppercase tracking-widest transition-all duration-300 ${
      isActive 
        ? `${activeColor} border-b ${borderActive} pb-1` 
        : `${textColor} ${hoverColor} hover:border-b ${borderHover} pb-1 border-b border-transparent`
    }`;
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-8 py-6 text-xs font-sans uppercase pointer-events-auto transition-all duration-500
        ${isDark ? 'bg-gradient-to-b from-black/90 to-transparent' : 'bg-gradient-to-b from-cloud/90 to-transparent'}`}>
      
      {/* Logo Area */}
      <div 
        onClick={() => onNavigate('LOG')}
        className={`font-serif text-lg tracking-normal normal-case opacity-90 cursor-pointer hover:text-gemini transition-colors flex items-center gap-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}
      >
        <span className="w-2 h-2 rounded-full bg-gemini inline-block animate-pulse"></span>
        <span>你的玄学日记</span>
      </div>
      
      {/* Center Navigation */}
      <div className="hidden md:flex space-x-12">
        <button 
          onClick={() => onNavigate('LOG')} 
          className={getLinkClass('LOG')}
        >
            Log
        </button>
        <button 
          onClick={() => onNavigate('MEMORY')} 
          className={getLinkClass('MEMORY')}
        >
            Memory
        </button>
        <button 
            onClick={() => onNavigate('GARDEN')}
            className={getLinkClass('GARDEN')}
        >
            The Garden
        </button>
        <button 
            onClick={() => onNavigate('INFO')}
            className={getLinkClass('INFO')}
        >
            Info
        </button>
      </div>

      {/* Right Icons */}
      <div className="flex items-center space-x-6">
        
        {/* Theme Toggle */}
        <div 
            onClick={onToggleTheme}
            className={`cursor-pointer transition-colors ${isDark ? 'text-zinc-600 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}
            title={`Switch to ${isDark ? 'Cloud Mode' : 'Void Mode'}`}
        >
            {isDark ? (
                // Sun Icon (Switch to Light)
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
                // Moon Icon (Switch to Dark)
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
        </div>

        <div 
            onClick={() => onNavigate('LOG')} 
            className={`cursor-pointer transition-colors ${currentView === 'LOG' ? (isDark ? 'text-white' : 'text-zinc-900') : (isDark ? 'text-zinc-600 hover:text-white' : 'text-zinc-400 hover:text-zinc-900')}`}
            title="Create Log"
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        </div>
        
        <div 
            onClick={() => onNavigate('MEMORY')} 
            className={`cursor-pointer transition-colors ${currentView === 'MEMORY' ? (isDark ? 'text-white' : 'text-zinc-900') : (isDark ? 'text-zinc-600 hover:text-white' : 'text-zinc-400 hover:text-zinc-900')}`}
            title="View Memories"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        </div>
      </div>
    </div>
  );
};
