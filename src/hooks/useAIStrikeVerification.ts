/**
 * AI Strike Verification Hook
 * Χρησιμοποιεί Gemini AI για επαλήθευση και classification χτυπημάτων
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DetectedStrike, DetectedStrikeType } from './useStrikeDetection';

export interface AIVerificationResult {
  strikeId: string;
  isValid: boolean;
  suggestedType: DetectedStrikeType | null;
  confidence: number;
  technicalNotes: string;
  isCorrectTechnique: boolean;
}

export interface FrameData {
  imageData: string; // Base64 encoded image
  timestamp: number;
  detectedStrike: DetectedStrike;
}

interface UseAIStrikeVerificationOptions {
  autoVerify: boolean;
  minConfidenceForAutoApprove: number; // 0-1
}

export function useAIStrikeVerification(options: UseAIStrikeVerificationOptions = {
  autoVerify: true,
  minConfidenceForAutoApprove: 0.85
}) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResults, setVerificationResults] = useState<AIVerificationResult[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<FrameData[]>([]);

  // Add frame to verification queue
  const queueForVerification = useCallback((frame: FrameData) => {
    setVerificationQueue(prev => [...prev, frame]);
  }, []);

  // Process verification queue
  const processQueue = useCallback(async () => {
    if (verificationQueue.length === 0 || isVerifying) return;

    setIsVerifying(true);
    const batch = verificationQueue.slice(0, 5); // Process 5 at a time
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-combat-frame', {
        body: {
          frames: batch.map(f => ({
            imageData: f.imageData,
            timestamp: f.timestamp,
            detectedStrike: {
              type: f.detectedStrike.type,
              category: f.detectedStrike.category,
              side: f.detectedStrike.side,
              confidence: f.detectedStrike.confidence,
              trajectory: f.detectedStrike.trajectory,
            }
          }))
        }
      });

      if (error) throw error;

      const results: AIVerificationResult[] = data.verifications || [];
      
      setVerificationResults(prev => [...prev, ...results]);
      setVerificationQueue(prev => prev.slice(batch.length));
      
    } catch (error) {
      console.error('AI verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  }, [verificationQueue, isVerifying]);

  // Verify single strike with frame capture
  const verifySingleStrike = useCallback(async (
    frame: FrameData
  ): Promise<AIVerificationResult | null> => {
    try {
      setIsVerifying(true);

      const { data, error } = await supabase.functions.invoke('analyze-combat-frame', {
        body: {
          frames: [{
            imageData: frame.imageData,
            timestamp: frame.timestamp,
            detectedStrike: {
              type: frame.detectedStrike.type,
              category: frame.detectedStrike.category,
              side: frame.detectedStrike.side,
              confidence: frame.detectedStrike.confidence,
              trajectory: frame.detectedStrike.trajectory,
            }
          }]
        }
      });

      if (error) throw error;

      const result = data.verifications?.[0] || null;
      if (result) {
        setVerificationResults(prev => [...prev, result]);
      }
      
      return result;
    } catch (error) {
      console.error('Single strike verification error:', error);
      return null;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Batch analyze entire video
  const analyzeVideoFrames = useCallback(async (
    frames: FrameData[]
  ): Promise<AIVerificationResult[]> => {
    const results: AIVerificationResult[] = [];
    const batchSize = 10;

    setIsVerifying(true);

    try {
      for (let i = 0; i < frames.length; i += batchSize) {
        const batch = frames.slice(i, i + batchSize);
        
        const { data, error } = await supabase.functions.invoke('analyze-combat-frame', {
          body: {
            frames: batch.map(f => ({
              imageData: f.imageData,
              timestamp: f.timestamp,
              detectedStrike: f.detectedStrike ? {
                type: f.detectedStrike.type,
                category: f.detectedStrike.category,
                side: f.detectedStrike.side,
                confidence: f.detectedStrike.confidence,
                trajectory: f.detectedStrike.trajectory,
              } : null
            }))
          }
        });

        if (error) throw error;

        if (data.verifications) {
          results.push(...data.verifications);
        }
      }

      setVerificationResults(results);
      return results;
    } catch (error) {
      console.error('Batch analysis error:', error);
      return results;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Get verification result for a specific strike
  const getVerificationForStrike = useCallback((strikeId: string): AIVerificationResult | undefined => {
    return verificationResults.find(r => r.strikeId === strikeId);
  }, [verificationResults]);

  // Clear results
  const clearResults = useCallback(() => {
    setVerificationResults([]);
    setVerificationQueue([]);
  }, []);

  return {
    isVerifying,
    verificationResults,
    verificationQueue,
    queueForVerification,
    processQueue,
    verifySingleStrike,
    analyzeVideoFrames,
    getVerificationForStrike,
    clearResults,
  };
}
