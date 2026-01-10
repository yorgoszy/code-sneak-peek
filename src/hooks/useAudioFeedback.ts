import { useCallback, useRef, useState } from 'react';

interface UseAudioFeedbackOptions {
  enabled?: boolean;
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export const useAudioFeedback = (options: UseAudioFeedbackOptions = {}) => {
  const {
    enabled = true,
    language = 'el-GR', // Greek
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastSpokenRef = useRef<string>('');
  const lastSpokenTimeRef = useRef<number>(0);
  const cooldownMs = 3000; // Minimum 3 seconds between same messages

  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  // Speak a message
  const speak = useCallback((text: string, force: boolean = false) => {
    if (!enabled || !synth || !text) return;

    // Avoid repeating the same message too quickly
    const now = Date.now();
    if (!force && text === lastSpokenRef.current && now - lastSpokenTimeRef.current < cooldownMs) {
      return;
    }

    // Cancel any ongoing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Try to find a Greek voice
    const voices = synth.getVoices();
    const greekVoice = voices.find(v => v.lang.startsWith('el'));
    if (greekVoice) {
      utterance.voice = greekVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.speak(utterance);
    lastSpokenRef.current = text;
    lastSpokenTimeRef.current = now;
  }, [enabled, synth, language, rate, pitch, volume]);

  // Stop speaking
  const stop = useCallback(() => {
    if (synth) {
      synth.cancel();
      setIsSpeaking(false);
    }
  }, [synth]);

  // Play a beep sound (using Web Audio API)
  const playBeep = useCallback((frequency: number = 440, duration: number = 200) => {
    if (!enabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }, [enabled, volume]);

  // Cue sounds for different events
  const playSuccessSound = useCallback(() => {
    playBeep(880, 150); // High beep for success
    setTimeout(() => playBeep(1100, 150), 150);
  }, [playBeep]);

  const playWarningSound = useCallback(() => {
    playBeep(440, 200); // Lower beep for warning
  }, [playBeep]);

  const playRepCompleteSound = useCallback(() => {
    playBeep(660, 100); // Quick beep for rep complete
  }, [playBeep]);

  const playStartSound = useCallback(() => {
    playBeep(330, 100);
    setTimeout(() => playBeep(440, 100), 120);
    setTimeout(() => playBeep(550, 150), 240);
  }, [playBeep]);

  const playStopSound = useCallback(() => {
    playBeep(550, 100);
    setTimeout(() => playBeep(440, 100), 120);
    setTimeout(() => playBeep(330, 150), 240);
  }, [playBeep]);

  // Speak exercise feedback based on score
  const speakFeedback = useCallback((feedback: string[], score: number) => {
    if (!enabled || feedback.length === 0) return;

    // Only speak the most important feedback
    const message = feedback[0]
      .replace('✓', '')
      .replace('⚠️', '')
      .replace('❌', '')
      .replace('💪', '')
      .trim();

    if (score < 70) {
      playWarningSound();
    }

    // Small delay after sound
    setTimeout(() => speak(message), 300);
  }, [enabled, speak, playWarningSound]);

  // Announce FMS score
  const announceFMSScore = useCallback((score: 0 | 1 | 2 | 3) => {
    if (!enabled) return;

    const messages = {
      0: 'Σκορ μηδέν. Υπάρχει πόνος.',
      1: 'Σκορ ένα. Ανεπαρκής εκτέλεση.',
      2: 'Σκορ δύο. Καλή εκτέλεση με αντισταθμίσεις.',
      3: 'Σκορ τρία! Τέλεια εκτέλεση!',
    };

    if (score === 3) {
      playSuccessSound();
    } else if (score <= 1) {
      playWarningSound();
    }

    setTimeout(() => speak(messages[score], true), 400);
  }, [enabled, speak, playSuccessSound, playWarningSound]);

  return {
    isSpeaking,
    speak,
    stop,
    playBeep,
    playSuccessSound,
    playWarningSound,
    playRepCompleteSound,
    playStartSound,
    playStopSound,
    speakFeedback,
    announceFMSScore,
  };
};
