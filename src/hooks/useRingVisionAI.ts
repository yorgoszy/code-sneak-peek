import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LiveAnalysis {
  commentary: string;
  red_activity: 'attacking' | 'defending' | 'neutral' | 'clinch';
  blue_activity: 'attacking' | 'defending' | 'neutral' | 'clinch';
  action_level: 'high' | 'medium' | 'low';
  strikes_visible: Array<{ type: string; corner: 'red' | 'blue'; landed: boolean }>;
  ring_control: 'red' | 'blue' | 'even';
  notable_technique: string | null;
  timestamp: number;
}

interface UseRingVisionAIOptions {
  sport?: string;
  roundNumber?: number;
  fighterNames?: { red: string; blue: string };
  cameraPositions?: string[];
  intervalMs?: number; // How often to analyze (default 8000ms)
}

export const useRingVisionAI = (options: UseRingVisionAIOptions = {}) => {
  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState<LiveAnalysis[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<LiveAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastContextRef = useRef<string>('');

  const captureFrames = useCallback((): string[] => {
    const frames: string[] = [];
    // Find all video elements in camera feeds
    const videoElements = document.querySelectorAll<HTMLVideoElement>('[data-camera-feed] video, .ai-vision-video');
    
    videoElements.forEach(vid => {
      if (vid.readyState >= 2 && vid.videoWidth > 0) {
        try {
          const canvas = document.createElement('canvas');
          // Downscale for speed: 480p is sufficient for analysis
          const scale = Math.min(1, 480 / vid.videoHeight);
          canvas.width = Math.round(vid.videoWidth * scale);
          canvas.height = Math.round(vid.videoHeight * scale);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
            if (base64) frames.push(base64);
          }
        } catch (e) {
          console.warn('Frame capture error:', e);
        }
      }
    });

    return frames;
  }, []);

  const analyzeOnce = useCallback(async () => {
    if (isAnalyzing) return;

    const frames = captureFrames();
    if (frames.length === 0) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-ring-live', {
        body: {
          frames,
          sport: options.sport || 'muay_thai',
          roundNumber: options.roundNumber,
          fighterNames: options.fighterNames,
          cameraPositions: options.cameraPositions,
          context: lastContextRef.current || undefined,
        },
      });

      if (fnError) throw fnError;

      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          setError('Rate limit — αναμονή...');
          return;
        }
        throw new Error(data.error);
      }

      const analysis: LiveAnalysis = {
        ...data.analysis,
        timestamp: data.timestamp || Date.now(),
      };

      setLatestAnalysis(analysis);
      setAnalyses(prev => [analysis, ...prev].slice(0, 50)); // Keep last 50
      lastContextRef.current = analysis.commentary;
    } catch (err) {
      console.error('Vision AI error:', err);
      setError(err instanceof Error ? err.message : 'Σφάλμα ανάλυσης');
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, captureFrames, options]);

  const start = useCallback(() => {
    if (isActive) return;
    setIsActive(true);
    setError(null);
    lastContextRef.current = '';

    // Initial analysis
    analyzeOnce();

    // Periodic analysis
    const ms = options.intervalMs || 8000;
    intervalRef.current = window.setInterval(() => {
      analyzeOnce();
    }, ms);
  }, [isActive, analyzeOnce, options.intervalMs]);

  const stop = useCallback(() => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setAnalyses([]);
    setLatestAnalysis(null);
    setError(null);
    lastContextRef.current = '';
  }, [stop]);

  return {
    isActive,
    isAnalyzing,
    latestAnalysis,
    analyses,
    error,
    start,
    stop,
    reset,
    analyzeOnce,
  };
};
