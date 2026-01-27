/**
 * Video Analyzer Hook
 * Ολοκληρωμένη ανάλυση βίντεο με Pose Detection + AI Verification
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePoseDetection, PoseResult } from './usePoseDetection';
import { useStrikeDetection, DetectedStrike } from './useStrikeDetection';
import { useAIStrikeVerification, AIVerificationResult } from './useAIStrikeVerification';

export interface AnalysisProgress {
  phase: 'idle' | 'loading' | 'analyzing' | 'verifying' | 'complete';
  currentTime: number;
  totalDuration: number;
  strikesFound: number;
  strikesVerified: number;
  progress: number; // 0-100
}

export interface AnalysisResult {
  strikes: DetectedStrike[];
  verifications: AIVerificationResult[];
  stats: {
    totalStrikes: number;
    punches: number;
    kicks: number;
    knees: number;
    elbows: number;
    leftSide: number;
    rightSide: number;
    avgConfidence: number;
    correctTechnique: number;
  };
}

export type CombatSport = 'muay_thai' | 'boxing' | 'kickboxing' | 'mma' | 'karate' | 'taekwondo' | 'judo';

export interface UseVideoAnalyzerOptions {
  sport: CombatSport;
  sensitivity: 'low' | 'medium' | 'high';
  enableAIVerification: boolean;
  analysisSpeed: 'fast' | 'normal' | 'thorough';
  detectPunches: boolean;
  detectKicks: boolean;
  detectKnees: boolean;
  detectElbows: boolean;
}

const defaultOptions: UseVideoAnalyzerOptions = {
  sport: 'muay_thai',
  sensitivity: 'medium',
  enableAIVerification: true,
  analysisSpeed: 'normal',
  detectPunches: true,
  detectKicks: true,
  detectKnees: true,
  detectElbows: true,
};

export function useVideoAnalyzer(options: Partial<UseVideoAnalyzerOptions> = {}) {
  const config = { ...defaultOptions, ...options };
  
  const [progress, setProgress] = useState<AnalysisProgress>({
    phase: 'idle',
    currentTime: 0,
    totalDuration: 0,
    strikesFound: 0,
    strikesVerified: 0,
    progress: 0,
  });
  
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isAnalyzingRef = useRef(false);
  const allStrikesRef = useRef<DetectedStrike[]>([]);

  // Initialize pose detection with results callback
  const {
    initialize: initPose,
    isLoading: poseLoading,
    isInitialized: poseInitialized,
    error: poseError,
    detectSingleFrame,
  } = usePoseDetection();

  // Strike detection
  const {
    detectedStrikes,
    analyzePoseFrame,
    startAnalyzing: startStrikeDetection,
    stopAnalyzing: stopStrikeDetection,
    reset: resetStrikes,
  } = useStrikeDetection({
    sensitivity: config.sensitivity,
    detectPunches: config.detectPunches,
    detectKicks: config.detectKicks,
    detectKnees: config.detectKnees,
    detectElbows: config.detectElbows,
    onStrikeDetected: (strike) => {
      allStrikesRef.current.push(strike);
      setProgress(prev => ({
        ...prev,
        strikesFound: allStrikesRef.current.length,
      }));
    },
  });

  // AI verification
  const {
    isVerifying,
    verificationResults,
    analyzeVideoFrames,
    clearResults: clearVerifications,
  } = useAIStrikeVerification({
    sport: config.sport,
    autoVerify: config.enableAIVerification,
    minConfidenceForAutoApprove: 0.85,
  });

  // Frame extraction rate based on speed
  const getFrameInterval = useCallback(() => {
    switch (config.analysisSpeed) {
      case 'fast': return 1 / 10; // 10 FPS
      case 'normal': return 1 / 15; // 15 FPS
      case 'thorough': return 1 / 30; // 30 FPS
      default: return 1 / 15;
    }
  }, [config.analysisSpeed]);

  // Analyze video
  const analyzeVideo = useCallback(async (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement
  ) => {
    if (isAnalyzingRef.current) return;
    
    // Check if video is valid
    if (!video || video.readyState < 2) {
      setError('Το βίντεο δεν είναι έτοιμο');
      return;
    }

    if (video.error) {
      setError('Σφάλμα στο αρχείο βίντεο');
      return;
    }
    
    videoRef.current = video;
    canvasRef.current = canvas;
    isAnalyzingRef.current = true;
    allStrikesRef.current = [];
    
    setError(null);
    setResult(null);
    resetStrikes();
    clearVerifications();

    try {
      // Phase 1: Loading
      setProgress({
        phase: 'loading',
        currentTime: 0,
        totalDuration: video.duration,
        strikesFound: 0,
        strikesVerified: 0,
        progress: 0,
      });

      // Initialize pose detection with timeout
      const initTimeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout φόρτωσης AI - δοκιμάστε ξανά')), 30000)
      );

      try {
        await Promise.race([initPose(), initTimeout]);
      } catch (err) {
        if (err instanceof Error && err.message.includes('Timeout')) {
          throw err;
        }
        // Continue even if pose detection fails - might still work
        console.warn('Pose detection init warning:', err);
      }
      
      if (poseError) {
        throw new Error(poseError);
      }

      // Phase 2: Analyzing
      setProgress(prev => ({ ...prev, phase: 'analyzing' }));
      startStrikeDetection();

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const frameInterval = getFrameInterval();
      const totalFrames = Math.floor(video.duration / frameInterval);
      let frameCount = 0;

      // Process video frame by frame
      video.currentTime = 0;
      
      // Wait for initial seek with timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Video seek timeout')), 5000);
        video.addEventListener('seeked', () => {
          clearTimeout(timeout);
          resolve();
        }, { once: true });
      });

      while (video.currentTime < video.duration && isAnalyzingRef.current) {
        // Check if video is still valid
        if (video.error) {
          throw new Error('Το βίντεο δεν είναι πλέον διαθέσιμο');
        }

        // Draw frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get pose from MediaPipe PoseLandmarker
        const poseResult = detectSingleFrame(video, canvas, video.currentTime);
        
        if (poseResult && poseResult.landmarks && poseResult.landmarks.length > 0) {
          // Analyze pose for strikes
          analyzePoseFrame(poseResult.landmarks, video.currentTime);
        }

        frameCount++;
        const analysisProgress = Math.min((frameCount / totalFrames) * 100, 100);
        
        setProgress(prev => ({
          ...prev,
          currentTime: video.currentTime,
          progress: config.enableAIVerification ? analysisProgress * 0.7 : analysisProgress,
        }));

        // Seek to next frame
        const nextTime = video.currentTime + frameInterval;
        if (nextTime < video.duration) {
          video.currentTime = nextTime;
          // Wait for seek with timeout
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              console.warn('Frame seek timeout, continuing...');
              resolve(); // Continue anyway
            }, 2000);
            video.addEventListener('seeked', () => {
              clearTimeout(timeout);
              resolve();
            }, { once: true });
          });
        } else {
          break;
        }
      }

      stopStrikeDetection();

      // Phase 3: AI Verification (if enabled)
      if (config.enableAIVerification && allStrikesRef.current.length > 0) {
        setProgress(prev => ({ ...prev, phase: 'verifying' }));

        // Create frame data for verification
        const framesToVerify = allStrikesRef.current.map(strike => ({
          imageData: '', // Would capture actual frame
          timestamp: strike.timestamp,
          detectedStrike: strike,
        }));

        await analyzeVideoFrames(framesToVerify, config.sport);

        setProgress(prev => ({
          ...prev,
          strikesVerified: verificationResults.length,
          progress: 100,
        }));
      }

      // Phase 4: Complete
      const strikes = allStrikesRef.current;
      const stats = calculateStats(strikes, verificationResults);

      const finalResult: AnalysisResult = {
        strikes,
        verifications: verificationResults,
        stats,
      };

      setResult(finalResult);
      setProgress(prev => ({ ...prev, phase: 'complete', progress: 100 }));

    } catch (err) {
      console.error('Video analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setProgress(prev => ({ ...prev, phase: 'idle' }));
    } finally {
      isAnalyzingRef.current = false;
    }
  }, [
    config.enableAIVerification, config.sport, getFrameInterval, initPose, poseError,
    analyzePoseFrame, startStrikeDetection, stopStrikeDetection, resetStrikes,
    clearVerifications, analyzeVideoFrames, verificationResults, detectSingleFrame
  ]);

  // Calculate statistics
  const calculateStats = (
    strikes: DetectedStrike[],
    verifications: AIVerificationResult[]
  ) => {
    const punches = strikes.filter(s => s.category === 'punch').length;
    const kicks = strikes.filter(s => s.category === 'kick').length;
    const knees = strikes.filter(s => s.category === 'knee').length;
    const elbows = strikes.filter(s => s.category === 'elbow').length;
    const leftSide = strikes.filter(s => s.side === 'left').length;
    const rightSide = strikes.filter(s => s.side === 'right').length;
    
    const avgConfidence = strikes.length > 0
      ? strikes.reduce((sum, s) => sum + s.confidence, 0) / strikes.length
      : 0;
    
    const correctTechnique = verifications.filter(v => v.isCorrectTechnique).length;

    return {
      totalStrikes: strikes.length,
      punches,
      kicks,
      knees,
      elbows,
      leftSide,
      rightSide,
      avgConfidence,
      correctTechnique,
    };
  };

  // Cancel analysis
  const cancelAnalysis = useCallback(() => {
    isAnalyzingRef.current = false;
    stopStrikeDetection();
    setProgress(prev => ({ ...prev, phase: 'idle' }));
  }, [stopStrikeDetection]);

  // Reset
  const reset = useCallback(() => {
    cancelAnalysis();
    setResult(null);
    setError(null);
    resetStrikes();
    clearVerifications();
    allStrikesRef.current = [];
  }, [cancelAnalysis, resetStrikes, clearVerifications]);

  return {
    analyzeVideo,
    cancelAnalysis,
    reset,
    progress,
    result,
    error,
    isAnalyzing: isAnalyzingRef.current,
    isLoading: poseLoading,
    isVerifying,
    detectedStrikes: allStrikesRef.current,
  };
}
