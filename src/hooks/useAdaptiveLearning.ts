/**
 * useAdaptiveLearning — Phase 5
 * Self-improving detection engine that uses labeled training data
 * to adjust velocity thresholds and confidence calibration.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ThresholdProfile {
  punch: number;
  kick: number;
  knee: number;
  elbow: number;
}

export interface AccuracyMetrics {
  totalLabeled: number;
  correctCount: number;
  correctedCount: number;
  accuracyRate: number;
  perType: Record<string, { correct: number; total: number; accuracy: number }>;
  perCategory: Record<string, { correct: number; total: number; accuracy: number }>;
  confusionPairs: Array<{ detected: string; actual: string; count: number }>;
}

export interface LearningState {
  isLoaded: boolean;
  isLearning: boolean;
  baseThresholds: ThresholdProfile;
  adjustedThresholds: ThresholdProfile;
  metrics: AccuracyMetrics;
  improvementPercent: number;
  lastUpdated: string | null;
  totalTrainingSamples: number;
}

const DEFAULT_THRESHOLDS: ThresholdProfile = {
  punch: 0.04,
  kick: 0.03,
  knee: 0.025,
  elbow: 0.03,
};

const EMPTY_METRICS: AccuracyMetrics = {
  totalLabeled: 0,
  correctCount: 0,
  correctedCount: 0,
  accuracyRate: 0,
  perType: {},
  perCategory: {},
  confusionPairs: [],
};

export function useAdaptiveLearning() {
  const [state, setState] = useState<LearningState>({
    isLoaded: false,
    isLearning: false,
    baseThresholds: { ...DEFAULT_THRESHOLDS },
    adjustedThresholds: { ...DEFAULT_THRESHOLDS },
    metrics: EMPTY_METRICS,
    improvementPercent: 0,
    lastUpdated: null,
    totalTrainingSamples: 0,
  });

  const adjustedRef = useRef<ThresholdProfile>({ ...DEFAULT_THRESHOLDS });

  /**
   * Load labeled data from ai_training_labels and compute metrics + threshold adjustments.
   */
  const loadAndLearn = useCallback(async () => {
    setState(prev => ({ ...prev, isLearning: true }));

    try {
      const { data: labels, error } = await supabase
        .from('ai_training_labels')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      if (!labels || labels.length === 0) {
        setState(prev => ({
          ...prev,
          isLoaded: true,
          isLearning: false,
          metrics: EMPTY_METRICS,
          totalTrainingSamples: 0,
        }));
        return;
      }

      // Separate correct vs corrected
      const correct = labels.filter(l => l.notes === 'ai_correct');
      const corrected = labels.filter(l => l.notes === 'ai_corrected');

      // Per-type accuracy
      const typeMap: Record<string, { correct: number; total: number; accuracy: number }> = {};
      for (const l of labels) {
        const key = l.strike_type;
        if (!typeMap[key]) typeMap[key] = { correct: 0, total: 0, accuracy: 0 };
        typeMap[key].total++;
        if (l.notes === 'ai_correct') typeMap[key].correct++;
      }
      Object.values(typeMap).forEach(v => {
        v.accuracy = v.total > 0 ? v.correct / v.total : 0;
      });

      // Per-category accuracy
      const catMap: Record<string, { correct: number; total: number; accuracy: number }> = {};
      for (const l of labels) {
        const key = l.strike_category;
        if (!catMap[key]) catMap[key] = { correct: 0, total: 0, accuracy: 0 };
        catMap[key].total++;
        if (l.notes === 'ai_correct') catMap[key].correct++;
      }
      Object.values(catMap).forEach(v => {
        v.accuracy = v.total > 0 ? v.correct / v.total : 0;
      });

      // Confusion pairs (what was detected vs what it should have been)
      const confusionCount: Record<string, number> = {};
      for (const l of corrected) {
        // The stored strike_type is the corrected one, so we can't directly compare
        // But we know it was corrected, so the AI got it wrong
        const pair = `${l.strike_type}`;
        confusionCount[pair] = (confusionCount[pair] || 0) + 1;
      }

      const confusionPairs = Object.entries(confusionCount)
        .map(([type, count]) => ({ detected: 'unknown', actual: type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const totalLabeled = labels.length;
      const accuracyRate = totalLabeled > 0 ? correct.length / totalLabeled : 0;

      // --- Adaptive threshold adjustment ---
      // If a category has low accuracy, increase its threshold (stricter detection)
      // If accuracy is high, slightly decrease threshold (more sensitive)
      const adjusted = { ...DEFAULT_THRESHOLDS };
      const MIN_SAMPLES = 10;

      for (const [cat, stats] of Object.entries(catMap) as [keyof ThresholdProfile, any][]) {
        if (!(cat in adjusted)) continue;
        if (stats.total < MIN_SAMPLES) continue;

        const acc = stats.accuracy;
        if (acc < 0.5) {
          // Very low accuracy → increase threshold by 30%
          adjusted[cat] = DEFAULT_THRESHOLDS[cat] * 1.3;
        } else if (acc < 0.7) {
          // Low accuracy → increase by 15%
          adjusted[cat] = DEFAULT_THRESHOLDS[cat] * 1.15;
        } else if (acc > 0.9) {
          // High accuracy → decrease by 10% (more sensitive)
          adjusted[cat] = DEFAULT_THRESHOLDS[cat] * 0.9;
        }
        // Round to 4 decimals
        adjusted[cat] = Math.round(adjusted[cat] * 10000) / 10000;
      }

      adjustedRef.current = adjusted;

      // Calculate improvement
      const thresholdChange = Object.keys(adjusted).reduce((sum, k) => {
        const key = k as keyof ThresholdProfile;
        return sum + Math.abs(adjusted[key] - DEFAULT_THRESHOLDS[key]);
      }, 0);
      const improvementPercent = Math.round(accuracyRate * 100);

      const metrics: AccuracyMetrics = {
        totalLabeled,
        correctCount: correct.length,
        correctedCount: corrected.length,
        accuracyRate,
        perType: typeMap,
        perCategory: catMap,
        confusionPairs,
      };

      setState({
        isLoaded: true,
        isLearning: false,
        baseThresholds: { ...DEFAULT_THRESHOLDS },
        adjustedThresholds: adjusted,
        metrics,
        improvementPercent,
        lastUpdated: new Date().toISOString(),
        totalTrainingSamples: totalLabeled,
      });

      toast.success(`Μάθηση ολοκληρώθηκε: ${totalLabeled} δείγματα, ${improvementPercent}% ακρίβεια`);
    } catch (err) {
      console.error('Learning failed:', err);
      toast.error('Σφάλμα κατά τη μάθηση');
      setState(prev => ({ ...prev, isLearning: false }));
    }
  }, []);

  /**
   * Get the current adjusted thresholds for use in strike detection.
   */
  const getThresholds = useCallback((): ThresholdProfile => {
    return adjustedRef.current;
  }, []);

  return {
    state,
    loadAndLearn,
    getThresholds,
  };
}
