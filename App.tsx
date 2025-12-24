
import React, { useState, useEffect, useRef } from 'react';
import { TopNav } from './components/TopNav';
import { GeminiStatus, FloatingMic, TimerDisplay, ActionButton, SecondaryButton, StickyBottom } from './components/Controls';
import { UploadModal, DiaryCard, LoadingOverlay } from './components/Modals';
import { ControlPanel } from './components/ControlPanel';
import { AdminDashboard } from './components/AdminDashboard'; 
import { MemoryCorridor } from './components/MemoryCorridor';
import { HolographicCard } from './components/HolographicCard'; 
import ParticleCanvas from './components/ParticleCanvas';
import { InfoSection } from './components/InfoSection';
import { AppStage, ChatMessage, DiaryEntry, VisualSettings, Theme } from './types';
import { analyzeImageAndStartChat, continueChat, generateDiaryEntry } from './services/geminiService';
import { saveMemoryToDB, getAllMemoriesFromDB, deleteMemoryFromDB } from './services/storageService';
import { getReportByCode } from './services/oracleService';
import { useAudio } from './hooks/useAudio';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTTS } from './hooks/useTTS';

// Default Settings
const DEFAULT_SETTINGS: VisualSettings = {
  particleCount: 2.0, 
  flowSpeed: 0.2,
  noiseStrength: 0.5, 
  audioSensitivity: 1.0,
  connectionThreshold: 0,
  dispersion: 0.0 
};

// Kept only for migration purposes
const LEGACY_STORAGE_KEY = 'gemini_diary_memories';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [stage, setStage] = useState<AppStage>(AppStage.UPLOAD_MODAL);
  
  // Creation Flow State
  const [image, setImage] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // Memory Corridor State
  const [savedMemories, setSavedMemories] = useState<DiaryEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<DiaryEntry | null>(null); 
  const [memoryIndex, setMemoryIndex] = useState(0); 

  // Loading State for Oracle
  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const [oracleError, setOracleError] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false); // Admin State

  // Ref to keep track of history
  const chatHistoryRef = useRef<ChatMessage[]>([]);
  useEffect(() => { chatHistoryRef.current = chatHistory; }, [chatHistory]);
  
  // Visuals & Audio
  const [visualSettings, setVisualSettings] = useState<VisualSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  
  const { audioData } = useAudio(stage === AppStage.CHATTING || stage === AppStage.MEMORY_CORRIDOR);
  const [geminiStatusText, setGeminiStatusText] = useState('Gemini');
  
  // Speech & TTS
  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();
  const { speak, stopSpeaking } = useTTS();
  
  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Load memories on mount
  useEffect(() => {
      const initStorage = async () => {
          try {
              const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
              if (legacyData) {
                  try {
                      const parsed = JSON.parse(legacyData);
                      if (Array.isArray(parsed)) {
                          for (const item of parsed) await saveMemoryToDB(item);
                      }
                      localStorage.removeItem(LEGACY_STORAGE_KEY);
                  } catch (e) { console.error("Migration failed", e); }
              }

              const memories = await getAllMemoriesFromDB();
              setSavedMemories(memories);
              if (memories.length > 0) setMemoryIndex(0);

          } catch(e) { 
              console.error("Failed to load memories database", e); 
          }
      };
      initStorage();
  }, []);
  
  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (stage === AppStage.CHATTING) {
        interval = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
    }
    return () => { if(interval) clearInterval(interval); };
  }, [stage]);

  // Speech Input Logic
  useEffect(() => {
    if (isListening) {
        setGeminiStatusText("Listening...");
    } else if (!isListening && transcript) {
        handleSendMessage(transcript);
    }
  }, [isListening]); 

  // --- Handlers ---

  const handleToggleTheme = () => {
      setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleNavigation = (view: 'LOG' | 'MEMORY' | 'GARDEN' | 'INFO') => {
      stopSpeaking();
      if (view === 'LOG') {
          if (image && chatHistory.length > 0) {
              setStage(AppStage.CHATTING);
          } else {
              setStage(AppStage.UPLOAD_MODAL);
          }
      } else if (view === 'MEMORY') {
          stopListening();
          setStage(AppStage.MEMORY_CORRIDOR);
          if (savedMemories.length > 0 && memoryIndex >= savedMemories.length) {
              setMemoryIndex(0);
          }
      } else if (view === 'GARDEN') {
          stopListening();
          setStage(AppStage.GARDEN);
      } else if (view === 'INFO') {
          stopListening();
          setStage(AppStage.INFO);
          setOracleError(null); // Clear errors on enter
      }
  };

  const handleCreateNew = () => {
      resetToHome();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const result = ev.target?.result as string;
        setImage(result);
        setStage(AppStage.PROCESSING_IMAGE);
        setElapsedSeconds(0); 
        
        const initialResponse = await analyzeImageAndStartChat(result.split(',')[1]);
        setChatHistory([{ role: 'model', text: initialResponse }]);
        setStage(AppStage.CHATTING);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else { stopSpeaking(); startListening(); }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    const newHistory: ChatMessage[] = [...chatHistoryRef.current, { role: 'user', text }];
    setChatHistory(newHistory);
    setGeminiStatusText("Thinking...");
    const response = await continueChat(newHistory, text);
    setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    setGeminiStatusText("Gemini");
  };

  const handleSaveMemory = async () => {
    if(!image) return;
    setStage(AppStage.SAVING);
    stopSpeaking();
    try {
        const entry = await generateDiaryEntry(chatHistoryRef.current, image.split(',')[1]);
        const completeEntry: DiaryEntry = {
            ...entry,
            id: Date.now().toString(),
            imageUrl: image
        };
        await saveMemoryToDB(completeEntry);
        
        const newMemories = [completeEntry, ...savedMemories];
        setSavedMemories(newMemories);
        setMemoryIndex(0); 
        
        setImage(null);
        setChatHistory([]);
        
        setStage(AppStage.MEMORY_CORRIDOR);
    } catch (e) {
        console.error("Failed to save memory", e);
        setGeminiStatusText("Error Saving");
    }
  };

  const handleDeleteMemory = async (id: string) => {
      try {
        await deleteMemoryFromDB(id);
        const newMemories = savedMemories.filter(m => m.id !== id);
        setSavedMemories(newMemories);
        if (memoryIndex >= newMemories.length) setMemoryIndex(Math.max(0, newMemories.length - 1));
        setCurrentEntry(null);
        stopSpeaking();
      } catch (e) { console.error("Failed to delete memory", e); }
  };

  const handleSearchCode = async (code: string) => {
    setOracleError(null);
    setIsOracleLoading(true);
    try {
        const report = await getReportByCode(code);
        
        if (report) {
            setCurrentEntry(report); 
        } else {
            // Replaced alert with state
            setOracleError("Soul Key invalid or expired.");
        }
    } catch (e) {
        setOracleError("Connection severed. Try again.");
    } finally {
        setIsOracleLoading(false);
    }
  };

  const resetToHome = () => {
    setStage(AppStage.UPLOAD_MODAL);
    setImage(null);
    setChatHistory([]);
    setCurrentEntry(null);
    if(isListening) stopListening();
    stopSpeaking();
  };
  
  const latestAIMessage = chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'model' 
      ? chatHistory[chatHistory.length - 1].text 
      : null;

  // Determine current view for Nav
  let currentView: 'LOG' | 'MEMORY' | 'GARDEN' | 'INFO' = 'LOG';
  if (stage === AppStage.MEMORY_CORRIDOR) currentView = 'MEMORY';
  if (stage === AppStage.GARDEN) currentView = 'GARDEN';
  if (stage === AppStage.INFO) currentView = 'INFO';

  const isDark = theme === 'dark';

  return (
    <div className={`relative w-full h-screen overflow-hidden selection:bg-gemini/30 transition-colors duration-1000 ${isDark ? 'bg-void' : 'bg-cloud'}`}>
      
      {/* 1. Global Navigation */}
      <TopNav 
        currentView={currentView} 
        onNavigate={handleNavigation} 
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Settings Toggle (Hidden for simplicity in light mode mostly) */}
      <div className="fixed top-24 right-8 z-[60] flex items-start space-x-4 pointer-events-auto">
          <button 
             onClick={() => setShowSettings(!showSettings)}
             className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors backdrop-blur 
                ${showSettings 
                    ? 'bg-gemini text-black border-gemini' 
                    : (isDark ? 'bg-zinc-900/50 text-zinc-400 border-zinc-700 hover:text-white' : 'bg-white/50 text-zinc-600 border-zinc-300 hover:text-black')}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
          </button>
      </div>
      
      {/* Settings Panel with Admin Link */}
      <ControlPanel 
         isOpen={showSettings} 
         onClose={() => setShowSettings(false)}
         settings={visualSettings}
         onUpdate={setVisualSettings}
         theme={theme}
         onOpenAdmin={() => { setShowSettings(false); setShowAdmin(true); }}
      />

      {/* ADMIN DASHBOARD */}
      {showAdmin && (
          <AdminDashboard theme={theme} onClose={() => setShowAdmin(false)} />
      )}

      {/* 2. INFO VIEW */}
      {currentView === 'INFO' && (
        <>
            <InfoSection theme={theme} onSearchCode={handleSearchCode} error={oracleError} />
            {isOracleLoading && <LoadingOverlay text="Connecting to Oracle..." theme={theme} />}
        </>
      )}

      {/* 3. LOG VIEW (Formerly HOME - Chat & Interaction) */}
      {currentView === 'LOG' && (
        <div className="animate-fade-in w-full h-full relative">
            
            {/* 3.1 The Main Visual: Dissolving Image (Centered) */}
            {image && (
                <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
                     <div className="w-full max-w-lg h-[60vh]">
                        <HolographicCard imageUrl={image} settings={visualSettings} />
                     </div>
                </div>
            )}
            
            {/* Background Particles for ambience (If no image) */}
            {!image && <ParticleCanvas imageUrl={null} settings={visualSettings} theme={theme} audioData={audioData} />}

            {stage === AppStage.CHATTING && (
                <>
                    {/* Dark gradient overlay at bottom to make text readable */}
                    <div className={`fixed inset-0 bg-gradient-to-t pointer-events-none z-10 
                        ${isDark ? 'from-black via-transparent to-transparent' : 'from-cloud via-transparent to-transparent'}`}></div>
                    
                    <GeminiStatus loading={geminiStatusText === 'Thinking...'} text={geminiStatusText} theme={theme} />

                    {/* Chat Bubble Area */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] w-full max-w-xl px-6 text-center z-30 pointer-events-none">
                        {latestAIMessage ? (
                            <div className={`inline-block backdrop-blur-xl border rounded-2xl p-6 shadow-2xl animate-fade-in transition-all duration-500
                                ${isDark ? 'bg-black/40 border-white/5' : 'bg-white/40 border-white/40 shadow-xl'}`}>
                                <h1 className={`font-serif text-2xl md:text-3xl leading-relaxed tracking-wide drop-shadow-md
                                    ${isDark ? 'text-white/95' : 'text-zinc-800'}`}>
                                    {latestAIMessage}
                                </h1>
                            </div>
                        ) : (
                            <div className={`backdrop-blur-md border rounded-full px-8 py-3 inline-block animate-pulse shadow-2xl transition-colors
                                ${isDark ? 'bg-black/20 border-white/5' : 'bg-white/40 border-white/40 shadow-sm'}`}>
                                <span className={`font-serif text-lg tracking-widest ${isDark ? 'text-white/70' : 'text-zinc-600'}`}>对方正在输入 . . .</span>
                            </div>
                        )}
                    </div>

                    {/* User Transcript */}
                    <div className="absolute top-1/2 left-0 right-0 flex justify-center px-8 pointer-events-none z-30 pt-24">
                        {(isListening || transcript) && (
                            <div className="animate-fade-in">
                                <p className={`font-mono text-sm md:text-base tracking-wide px-6 py-2 rounded-lg backdrop-blur border shadow-[0_0_25px_rgba(0,214,104,0.15)] max-w-2xl text-center
                                    ${isDark 
                                        ? 'bg-black/80 border-gemini/20 text-gemini/90' 
                                        : 'bg-white/80 border-gemini/30 text-zinc-700'}`}>
                                    {transcript || "Listening..."}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Controls */}
                    <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center z-40 pointer-events-auto">
                        <TimerDisplay seconds={elapsedSeconds} theme={theme} />
                        <div className="flex items-center gap-10 mb-8">
                            <SecondaryButton 
                                onClick={() => stopSpeaking()} 
                                theme={theme}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} 
                            />
                            <FloatingMic isListening={isListening} onClick={toggleListening} theme={theme} />
                            <SecondaryButton 
                                onClick={resetToHome} 
                                theme={theme}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>} 
                            />
                        </div>
                        <div className="animate-fade-in">
                            <ActionButton 
                                label="Save Memory" 
                                onClick={handleSaveMemory}
                                theme={theme}
                                icon={<svg className="w-4 h-4 text-gemini" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
                            />
                        </div>
                    </div>
                </>
            )}

            {stage === AppStage.UPLOAD_MODAL && (
                <UploadModal onFileSelect={handleFileSelect} theme={theme} />
            )}

            {stage === AppStage.UPLOAD_MODAL && savedMemories.length > 0 && (
                <StickyBottom 
                    label="Enter Memory Corridor"
                    onClick={() => handleNavigation('MEMORY')} 
                    theme={theme}
                />
            )}

            {(stage === AppStage.SAVING || stage === AppStage.PROCESSING_IMAGE) && (
                <LoadingOverlay text={stage === AppStage.SAVING ? "Saving to Memory Corridor..." : "Dissolving Reality..."} theme={theme} />
            )}
        </div>
      )}

      {/* 4. MEMORY VIEW (IMMERSIVE CAROUSEL) */}
      {currentView === 'MEMORY' && (
        <div className="animate-fade-in w-full h-full relative z-30">
             <MemoryCorridor 
                entries={savedMemories} 
                currentIndex={memoryIndex}
                onIndexChange={setMemoryIndex}
                onSelect={(entry) => setCurrentEntry(entry)} 
                onCreateNew={handleCreateNew} 
                theme={theme}
            />
        </div>
      )}

      {/* 5. GARDEN VIEW (New Placeholder) */}
      {currentView === 'GARDEN' && (
        <div className="animate-fade-in w-full h-full relative z-30 flex items-center justify-center">
             <div className="absolute inset-0 z-0">
                 <ParticleCanvas imageUrl={null} settings={visualSettings} theme={theme} audioData={audioData} />
             </div>
             <div className={`relative z-10 text-center font-serif ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                 <h2 className="text-3xl tracking-widest mb-4">THE GARDEN</h2>
                 <p className="text-xs font-mono tracking-[0.2em] uppercase">Coming Soon</p>
             </div>
        </div>
      )}

      {/* 6. Details Modal (Reused for Oracle Reports) */}
      {currentEntry && (
          <DiaryCard 
            entry={currentEntry} 
            onClose={() => {
                stopSpeaking(); 
                setCurrentEntry(null);
            }} 
            onDelete={handleDeleteMemory}
            onPlay={(text) => speak(text)}
            onStop={() => stopSpeaking()}
            theme={theme}
          />
      )}

    </div>
  );
};

export default App;
