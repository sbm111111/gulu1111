
import React from 'react';
import { VisualSettings, Theme } from '../types';

interface ControlPanelProps {
  settings: VisualSettings;
  onUpdate: (newSettings: VisualSettings) => void;
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  onOpenAdmin?: () => void; // New prop
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ settings, onUpdate, isOpen, onClose, theme, onOpenAdmin }) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const handleChange = (key: keyof VisualSettings, value: number) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <div className={`fixed top-24 right-8 z-50 w-72 backdrop-blur-xl border rounded-xl p-6 shadow-2xl animate-fade-in transition-colors
        ${isDark 
            ? 'bg-black/90 border-zinc-800' 
            : 'bg-white/80 border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.1)]'}`}>
      
      <div className="flex justify-between items-center mb-6">
        <h3 className={`font-serif tracking-wider text-sm flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
            <span className="w-1.5 h-1.5 bg-gemini rounded-full animate-pulse"></span>
            VISUAL PARAMETERS
        </h3>
        <button onClick={onClose} className={`hover:scale-110 transition-transform ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-800'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="space-y-6">
        
        {/* Helper Component for Sliders */}
        {[
            { label: 'DISPERSION', key: 'dispersion', min: 0, max: 1.5, step: 0.01 },
            { label: 'PARTICLE SIZE', key: 'particleCount', min: 1.0, max: 5.0, step: 0.1 },
            { label: 'FLOW SPEED', key: 'flowSpeed', min: 0, max: 2.0, step: 0.01 },
            { label: 'TURBULENCE', key: 'noiseStrength', min: 0, max: 5.0, step: 0.1 }
        ].map((item) => (
            <div key={item.key} className="space-y-2">
                <div className={`flex justify-between text-xs font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    <span>{item.label}</span>
                    <span className="text-gemini">{settings[item.key as keyof VisualSettings].toFixed(2)}</span>
                </div>
                <input 
                    type="range" min={item.min} max={item.max} step={item.step}
                    value={settings[item.key as keyof VisualSettings]}
                    onChange={(e) => handleChange(item.key as keyof VisualSettings, parseFloat(e.target.value))}
                    className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-gemini transition-colors
                        ${isDark ? 'bg-zinc-800 hover:accent-white' : 'bg-zinc-200 hover:accent-zinc-900'}`}
                />
            </div>
        ))}
        
        {/* Secret Admin Button */}
        <div className="pt-4 border-t border-dashed border-zinc-700/50 mt-4">
             <button 
                onClick={onOpenAdmin}
                className={`w-full py-2 text-[10px] uppercase tracking-widest hover:text-gemini transition-colors text-left flex items-center gap-2
                    ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`}
             >
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                 <span>Access Control Deck</span>
             </button>
        </div>

      </div>
    </div>
  );
};
