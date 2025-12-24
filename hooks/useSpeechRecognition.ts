import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'zh-CN'; // Updated to Chinese
            
            recognitionRef.current.onresult = (event: any) => {
                let currentTranscript = '';
                // Combine results
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech Error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }
  }, []);

  const startListening = useCallback(() => {
      if (recognitionRef.current) {
          try {
              setTranscript(''); // Clear previous transcript on new session
              recognitionRef.current.start();
              setIsListening(true);
          } catch(e) { console.error("Mic start error", e) }
      }
  }, []);

  const stopListening = useCallback(() => {
      if (recognitionRef.current) {
          recognitionRef.current.stop();
          setIsListening(false);
      }
  }, []);

  return { isListening, transcript, startListening, stopListening };
};