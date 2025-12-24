import { useCallback } from 'react';

export const useTTS = () => {
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Try to find a Chinese voice
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang === 'zh-CN');
    if (zhVoice) {
        utterance.voice = zhVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
      if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
      }
  }, []);

  return { speak, stopSpeaking };
};