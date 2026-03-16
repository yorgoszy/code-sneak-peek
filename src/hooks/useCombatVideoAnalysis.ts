/**
 * Pure-Cloud Combat Video Analysis Hook
 * Sends video directly to Gemini API via edge function for complete analysis.
 * Replaces the hybrid MediaPipe + AI approach.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type CombatSport = 'muay_thai' | 'boxing' | 'kickboxing' | 'mma' | 'karate' | 'taekwondo' | 'judo';
export type AnalysisMode = 'strike_counting' | 'round_stats' | 'technique_evaluation' | 'fighter_comparison' | 'full';

export interface StrikeStats {
  thrown: number;
  landed: number;
}

export interface CornerStrikeData {
  total_strikes_thrown: number;
  total_strikes_landed: number;
  strikes: Record<string, StrikeStats>;
  accuracy_percentage: number;
}

export interface RoundStats {
  round_number: number;
  duration_seconds: number;
  red_corner: {
    total_strikes: number;
    significant_strikes: number;
    strikes_landed: number;
    accuracy_percentage: number;
    offensive_time_seconds: number;
    defensive_actions: number;
    ring_control_percentage: number;
    aggression_score: number;
    clinch_time_seconds: number;
  };
  blue_corner: typeof RoundStats.prototype.red_corner;
  round_winner_suggestion: 'red' | 'blue' | 'even';
  round_notes: string;
}

export interface TechniqueEvaluation {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  improvement_tips: string[];
  guard_quality?: { score: number; notes: string };
  footwork?: { score: number; notes: string };
  combinations?: { score: number; notes: string };
  defense?: { score: number; notes: string };
  timing?: { score: number; notes: string };
  power?: { score: number; notes: string };
}

export interface FighterComparison {
  striking_volume: { red: number; blue: number; advantage: 'red' | 'blue' | 'even' };
  striking_accuracy: { red: number; blue: number; advantage: 'red' | 'blue' | 'even' };
  power: { red: number; blue: number; advantage: 'red' | 'blue' | 'even' };
  defense: { red: number; blue: number; advantage: 'red' | 'blue' | 'even' };
  ring_control: { red: number; blue: number; advantage: 'red' | 'blue' | 'even' };
  aggression: { red: number; blue: number; advantage: 'red' | 'blue' | 'even' };
  technique: { red: number; blue: number; advantage: 'red' | 'blue' | 'even' };
  overall_advantage: 'red' | 'blue' | 'even';
  summary: string;
}

export interface FullAnalysisResult {
  strike_stats?: {
    red_corner: CornerStrikeData;
    blue_corner: CornerStrikeData;
  };
  technique?: {
    red_corner: TechniqueEvaluation;
    blue_corner: TechniqueEvaluation;
  };
  comparison?: Partial<FighterComparison>;
  round_winner_suggestion?: 'red' | 'blue' | 'even';
  analysis_notes?: string;
  raw_response?: string;
  parse_error?: boolean;
}

export interface AnalysisMetadata {
  sport: CombatSport;
  mode: AnalysisMode;
  roundNumber: number | null;
  fighterNames: { red: string; blue: string } | null;
  model: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  estimatedCost: {
    input: number;
    output: number;
  };
}

export interface VideoAnalysisResponse {
  analysis: FullAnalysisResult;
  metadata: AnalysisMetadata;
}

interface UseCombatVideoAnalysisOptions {
  sport?: CombatSport;
  defaultMode?: AnalysisMode;
}

export function useCombatVideoAnalysis(options: UseCombatVideoAnalysisOptions = {}) {
  const { sport = 'muay_thai', defaultMode = 'full' } = options;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VideoAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Convert a File/Blob to base64 string
   */
  const fileToBase64 = useCallback(async (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  /**
   * Analyze a video file directly (< 20MB recommended for base64)
   */
  const analyzeVideoFile = useCallback(async (
    file: File,
    opts?: {
      mode?: AnalysisMode;
      roundNumber?: number;
      fighterNames?: { red: string; blue: string };
    }
  ): Promise<VideoAnalysisResponse | null> => {
    setIsAnalyzing(true);
    setProgress(10);
    setError(null);

    try {
      // Convert to base64
      setProgress(20);
      const videoBase64 = await fileToBase64(file);
      setProgress(40);

      const { data, error: fnError } = await supabase.functions.invoke('analyze-combat-video', {
        body: {
          videoBase64,
          sport,
          mode: opts?.mode || defaultMode,
          roundNumber: opts?.roundNumber,
          fighterNames: opts?.fighterNames,
          durationSeconds: undefined, // Could extract from video metadata
        }
      });

      setProgress(90);

      if (fnError) throw fnError;

      const response = data as VideoAnalysisResponse;
      setResult(response);
      setProgress(100);
      return response;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      console.error('Video analysis error:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [sport, defaultMode, fileToBase64]);

  /**
   * Analyze a video from Supabase Storage URL
   */
  const analyzeVideoUrl = useCallback(async (
    url: string,
    opts?: {
      mode?: AnalysisMode;
      roundNumber?: number;
      fighterNames?: { red: string; blue: string };
      durationSeconds?: number;
    }
  ): Promise<VideoAnalysisResponse | null> => {
    setIsAnalyzing(true);
    setProgress(10);
    setError(null);

    try {
      setProgress(30);

      const { data, error: fnError } = await supabase.functions.invoke('analyze-combat-video', {
        body: {
          videoUrl: url,
          sport,
          mode: opts?.mode || defaultMode,
          roundNumber: opts?.roundNumber,
          fighterNames: opts?.fighterNames,
          durationSeconds: opts?.durationSeconds,
        }
      });

      setProgress(90);

      if (fnError) throw fnError;

      const response = data as VideoAnalysisResponse;
      setResult(response);
      setProgress(100);
      return response;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      console.error('Video URL analysis error:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [sport, defaultMode]);

  /**
   * Analyze video from Supabase Storage bucket path
   */
  const analyzeStorageVideo = useCallback(async (
    bucket: string,
    path: string,
    opts?: {
      mode?: AnalysisMode;
      roundNumber?: number;
      fighterNames?: { red: string; blue: string };
      durationSeconds?: number;
    }
  ): Promise<VideoAnalysisResponse | null> => {
    setIsAnalyzing(true);
    setProgress(5);
    setError(null);

    try {
      // Get signed URL from Supabase Storage
      const { data: urlData, error: urlError } = await supabase
        .storage
        .from(bucket)
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (urlError || !urlData?.signedUrl) {
        throw new Error('Failed to get video URL from storage');
      }

      setProgress(15);

      // Download the video and convert to base64 (Gemini needs inline data for URLs not from Google)
      const videoResponse = await fetch(urlData.signedUrl);
      const videoBlob = await videoResponse.blob();
      const videoBase64 = await fileToBase64(new File([videoBlob], 'video.mp4', { type: 'video/mp4' }));

      setProgress(40);

      const { data, error: fnError } = await supabase.functions.invoke('analyze-combat-video', {
        body: {
          videoBase64,
          sport,
          mode: opts?.mode || defaultMode,
          roundNumber: opts?.roundNumber,
          fighterNames: opts?.fighterNames,
          durationSeconds: opts?.durationSeconds,
        }
      });

      setProgress(90);

      if (fnError) throw fnError;

      const response = data as VideoAnalysisResponse;
      setResult(response);
      setProgress(100);
      return response;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      console.error('Storage video analysis error:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [sport, defaultMode, fileToBase64]);

  /**
   * Analyze multiple rounds sequentially
   */
  const analyzeMultipleRounds = useCallback(async (
    rounds: Array<{
      file?: File;
      url?: string;
      roundNumber: number;
    }>,
    fighterNames?: { red: string; blue: string }
  ): Promise<VideoAnalysisResponse[]> => {
    const results: VideoAnalysisResponse[] = [];

    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];
      setProgress(Math.round((i / rounds.length) * 100));

      let res: VideoAnalysisResponse | null = null;
      if (round.file) {
        res = await analyzeVideoFile(round.file, {
          mode: 'round_stats',
          roundNumber: round.roundNumber,
          fighterNames,
        });
      } else if (round.url) {
        res = await analyzeVideoUrl(round.url, {
          mode: 'round_stats',
          roundNumber: round.roundNumber,
          fighterNames,
        });
      }

      if (res) results.push(res);
    }

    setProgress(100);
    return results;
  }, [analyzeVideoFile, analyzeVideoUrl]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    // State
    isAnalyzing,
    progress,
    result,
    error,

    // Actions
    analyzeVideoFile,
    analyzeVideoUrl,
    analyzeStorageVideo,
    analyzeMultipleRounds,
    clearResult,
  };
}
