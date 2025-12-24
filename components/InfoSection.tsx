
import React, { useState, useEffect } from 'react';
import { Theme } from '../types';

interface InfoSectionProps {
  theme: Theme;
  onSearchCode?: (code: string) => void;
  error?: string | null;
}

const ServiceCard: React.FC<{ 
    title: string; 
    subtitle: string; 
    desc: string; 
    icon: React.ReactNode; 
    theme: Theme;
    price?: string;
}> = ({ title, subtitle, desc, icon, theme, price }) => {
    const isDark = theme === 'dark';
    
    return (
        <div className={`group relative p-8 border rounded-xl backdrop-blur-md transition-all duration-500 cursor-pointer overflow-hidden flex flex-col h-full
            ${isDark 
                ? 'bg-black/40 border-zinc-800 hover:border-gemini/50 hover:bg-black/60 hover:shadow-[0_0_30px_rgba(0,214,104,0.1)]' 
                : 'bg-white/40 border-white/60 hover:border-zinc-400 hover:bg-white/80 hover:shadow-xl'}`}>
            
            {/* Background Hover Glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none
                ${isDark 
                    ? 'bg-gradient-to-b from-gemini/5 to-transparent' 
                    : 'bg-gradient-to-b from-zinc-200/50 to-transparent'}`}></div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center mb-6 transition-colors duration-300
                    ${isDark 
                        ? 'border-zinc-700 text-zinc-400 group-hover:text-gemini group-hover:border-gemini' 
                        : 'border-zinc-300 text-zinc-500 group-hover:text-zinc-900 group-hover:border-zinc-900'}`}>
                    {icon}
                </div>

                {/* Text Content */}
                <h3 className={`font-serif text-xl mb-1 tracking-wide ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    {title}
                </h3>
                <p className={`font-mono text-[10px] uppercase tracking-[0.2em] mb-4 ${isDark ? 'text-gemini' : 'text-zinc-500'}`}>
                    {subtitle}
                </p>
                <p className={`font-sans text-xs leading-relaxed opacity-70 mb-8 flex-grow ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {desc}
                </p>

                {/* Bottom Action */}
                <div className="flex items-center justify-between pt-4 border-t border-dashed border-opacity-20 border-gray-500">
                    <span className={`font-mono text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {price}
                    </span>
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full transition-all transform group-hover:-rotate-45
                        ${isDark ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-black'}`}>
                        →
                    </span>
                </div>
            </div>
        </div>
    );
};

export const InfoSection: React.FC<InfoSectionProps> = ({ theme, onSearchCode, error }) => {
  const isDark = theme === 'dark';
  const [code, setCode] = useState('');
  const [isFocus, setIsFocus] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Stop searching spinner if error appears
  useEffect(() => {
      if (error) setIsSearching(false);
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(code.trim() && onSearchCode) {
          setIsSearching(true);
          onSearchCode(code.trim());
      }
  };

  const services = [
    {
        title: "体验版命书",
        subtitle: "The Spark",
        desc: "初探命运的纹理。基于你的生辰八字，解析核心性格特质与当下能量状态。约3000字。",
        price: "FREE / LITE",
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    },
    {
        title: "完整版命书",
        subtitle: "The Blueprint",
        desc: "深度解析灵魂蓝图。包含事业、财运、情感全方位解读，揭示潜藏的天赋与挑战。约10000字。",
        price: "PREMIUM",
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    },
    {
        title: "流年逐月运势",
        subtitle: "Time Flow",
        desc: "把握时运的脉搏。预测未来一年的关键时间点与机遇，提供趋吉避凶的决策建议。约5000字。",
        price: "YEARLY",
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    {
        title: "关系合盘",
        subtitle: "The Bond",
        desc: "缘分与羁绊的解码。分析两人能量场的共振与冲突，探索前世今生的连结。约3000字。",
        price: "SYNASTRY",
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
    }
  ];

  return (
    <div className={`absolute inset-0 z-30 overflow-y-auto custom-scrollbar flex flex-col items-center pt-32 pb-20 animate-fade-in transition-colors duration-700
        ${isDark ? 'bg-void' : 'bg-cloud'}`}>
        
        {/* Header Area */}
        <div className="text-center mb-12 animate-fade-in relative z-10 w-full max-w-md px-6">
            <h1 className={`font-serif text-4xl md:text-5xl tracking-wider mb-8 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                The Oracle
            </h1>
            
            {/* Soul Key Input - The "Access Terminal" */}
            <form onSubmit={handleSubmit} className="relative group">
                <div className={`flex items-center border-b px-2 py-3 transition-all duration-500
                    ${isFocus || code 
                        ? 'border-gemini shadow-[0_10px_20px_-10px_rgba(0,214,104,0.3)]' 
                        : (isDark ? 'border-zinc-700' : 'border-zinc-300')}
                    ${error ? 'border-red-500 shadow-[0_10px_20px_-10px_rgba(255,50,50,0.3)]' : ''}
                    `}>
                    
                    <span className={`font-mono text-xs mr-3 tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        ACCESS_CODE ::
                    </span>
                    
                    <input 
                        type="text" 
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onFocus={() => setIsFocus(true)}
                        onBlur={() => setIsFocus(false)}
                        placeholder="ENTER SOUL KEY"
                        disabled={isSearching}
                        className={`bg-transparent flex-grow outline-none font-mono text-sm tracking-[0.2em] text-center uppercase
                            ${isDark ? 'text-white placeholder-zinc-700' : 'text-zinc-800 placeholder-zinc-300'}`}
                    />
                    
                    <button 
                        type="submit"
                        disabled={!code || isSearching}
                        className={`ml-2 transition-all duration-300 ${code ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
                    >
                         {isSearching ? (
                             <div className="w-5 h-5 border-2 border-gemini border-t-transparent rounded-full animate-spin"></div>
                         ) : (
                             <svg className={`w-5 h-5 ${isDark ? 'text-gemini' : 'text-zinc-800'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         )}
                    </button>
                </div>
                
                {/* Status / Error Message Display */}
                <div className={`h-4 mt-2 text-[10px] text-center font-mono transition-opacity duration-300 
                    ${isSearching || error ? 'opacity-100' : 'opacity-0'} 
                    ${error ? 'text-red-500 tracking-widest' : (isDark ? 'text-gemini' : 'text-zinc-600')}`}>
                    {error ? `[ERROR]: ${error}` : 'DECRYPTING TIMELINE...'}
                </div>
            </form>
        </div>

        {/* Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-8 relative z-10">
            {services.map((service, idx) => (
                <div key={idx} className="h-64 md:h-72">
                    <ServiceCard {...service} theme={theme} />
                </div>
            ))}
        </div>

        {/* Decorative Background Elements */}
        {isDark && (
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gemini/5 blur-[150px] rounded-full pointer-events-none z-0"></div>
        )}

    </div>
  );
};
