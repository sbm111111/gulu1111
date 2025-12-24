import { useState, useEffect, useRef } from 'react';

export const useAudio = (isActive: boolean) => {
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (isActive) {
      initAudio();
    } else {
      cleanupAudio();
    }
    return () => cleanupAudio();
  }, [isActive]);

  const initAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      // 1. Setup Analyser
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // 2. Setup Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const micSource = ctx.createMediaStreamSource(stream);
      sourceRef.current = micSource;
      micSource.connect(analyser);

      // 3. Setup Ambient BGM (Simulated "AI Generated Music")
      // Using a reliable ambient noise placeholder or synthesized drone
      if (!bgmRef.current) {
          bgmRef.current = new Audio('https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3'); // Ethereal ambient track
          bgmRef.current.loop = true;
          bgmRef.current.volume = 0.3;
          
          // Connect BGM to analyser too so particles react to music + voice
          const bgmSource = ctx.createMediaElementSource(bgmRef.current);
          bgmSource.connect(analyser);
          bgmSource.connect(ctx.destination); // Play to speakers
      }
      bgmRef.current.play().catch(e => console.log("Auto-play blocked", e));

      // 4. Analysis Loop
      const update = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        setAudioData(dataArray);
        animationFrameRef.current = requestAnimationFrame(update);
      };
      update();

    } catch (err) {
      console.error("Audio init failed", err);
    }
  };

  const cleanupAudio = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current.mediaStream.getTracks().forEach(t => t.stop());
    }
    if (bgmRef.current) {
        bgmRef.current.pause();
    }
    // We keep context alive to resume easily, or close it if strict cleanup needed
  };

  return { audioData };
};