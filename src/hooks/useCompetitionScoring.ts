/**
 * useCompetitionScoring
 * Phase 3: Round-based scoring engine with activity tracking and post-fight report generation.
 * Tracks per-round strike stats, calculates scoring suggestions, and generates AI reports.
 */
import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { CompetitionStrike, CornerStats } from './useCompetitionStrikeDetection';

export interface RoundScore {
  roundNumber: number;
  redScore: number;
  blueScore: number;
  redStrikes: number;
  blueStrikes: number;
  redActivity: number; // percentage 0-100
  blueActivity: number;
  dominant: 'red' | 'blue' | 'even';
  aiNotes: string;
}

export interface FightReport {
  id: string;
  generatedAt: number;
  rounds: RoundScore[];
  totalRedStrikes: number;
  totalBlueStrikes: number;
  suggestedWinner: 'red' | 'blue' | 'draw';
  winMethod: string;
  redHighlights: string[];
  blueHighlights: string[];
  summary: string;
  technicalAnalysis: string;
}

export interface ActivitySnapshot {
  timestamp: number;
  redStrikes: number;
  blueStrikes: number;
}

export function useCompetitionScoring() {
  const [currentRound, setCurrentRound] = useState(1);
  const [roundScores, setRoundScores] = useState<RoundScore[]>([]);
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [report, setReport] = useState<FightReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activityTimeline, setActivityTimeline] = useState<ActivitySnapshot[]>([]);

  // Track strikes per round
  const roundStrikesRef = useRef<{ red: CompetitionStrike[]; blue: CompetitionStrike[] }>({
    red: [], blue: [],
  });
  const roundStartRef = useRef<number>(0);
  const activityIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Start a new round */
  const startRound = useCallback((roundNumber?: number) => {
    const rn = roundNumber ?? currentRound;
    setCurrentRound(rn);
    roundStrikesRef.current = { red: [], blue: [] };
    roundStartRef.current = Date.now();
    setIsRoundActive(true);

    // Activity sampling every 2s
    activityIntervalRef.current = setInterval(() => {
      setActivityTimeline(prev => [
        ...prev,
        {
          timestamp: Date.now(),
          redStrikes: roundStrikesRef.current.red.length,
          blueStrikes: roundStrikesRef.current.blue.length,
        },
      ]);
    }, 2000);
  }, [currentRound]);

  /** Record a strike during the current round */
  const recordStrike = useCallback((strike: CompetitionStrike) => {
    if (!isRoundActive) return;
    roundStrikesRef.current[strike.corner].push(strike);
  }, [isRoundActive]);

  /** End the current round and calculate scoring */
  const endRound = useCallback(() => {
    if (!isRoundActive) return;
    setIsRoundActive(false);

    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current);
      activityIntervalRef.current = null;
    }

    const redS = roundStrikesRef.current.red;
    const blueS = roundStrikesRef.current.blue;
    const elapsed = (Date.now() - roundStartRef.current) / 1000;

    // 10-point must system scoring suggestion
    const redTotal = redS.length;
    const blueTotal = blueS.length;

    // Activity = strikes per minute (normalized to 100)
    const redSPM = elapsed > 0 ? (redTotal / elapsed) * 60 : 0;
    const blueSPM = elapsed > 0 ? (blueTotal / elapsed) * 60 : 0;
    const maxSPM = Math.max(redSPM, blueSPM, 1);
    const redActivity = Math.round((redSPM / maxSPM) * 100);
    const blueActivity = Math.round((blueSPM / maxSPM) * 100);

    // Weighted scoring: kicks and knees count more
    const weightedScore = (strikes: CompetitionStrike[]) => {
      return strikes.reduce((acc, s) => {
        if (s.category === 'kick') return acc + 1.5;
        if (s.category === 'knee') return acc + 1.3;
        if (s.category === 'elbow') return acc + 1.4;
        return acc + 1;
      }, 0);
    };

    const redWeighted = weightedScore(redS);
    const blueWeighted = weightedScore(blueS);

    let redScore = 10;
    let blueScore = 10;
    let dominant: 'red' | 'blue' | 'even' = 'even';

    if (redWeighted > blueWeighted * 1.3) {
      redScore = 10; blueScore = 9; dominant = 'red';
    } else if (blueWeighted > redWeighted * 1.3) {
      blueScore = 10; redScore = 9; dominant = 'blue';
    } else if (redWeighted > blueWeighted) {
      redScore = 10; blueScore = 9; dominant = 'red';
    } else if (blueWeighted > redWeighted) {
      blueScore = 10; redScore = 9; dominant = 'blue';
    }

    const score: RoundScore = {
      roundNumber: currentRound,
      redScore, blueScore,
      redStrikes: redTotal,
      blueStrikes: blueTotal,
      redActivity, blueActivity,
      dominant,
      aiNotes: '',
    };

    setRoundScores(prev => [...prev, score]);
    setCurrentRound(prev => prev + 1);

    return score;
  }, [isRoundActive, currentRound]);

  /** Generate AI post-fight report */
  const generateReport = useCallback(async (
    allStrikes: CompetitionStrike[],
    sport: string = 'muay_thai',
    matchInfo?: { redName?: string; blueName?: string; totalRounds?: number }
  ) => {
    setIsGeneratingReport(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-fight-report', {
        body: {
          sport,
          rounds: roundScores,
          totalStrikes: {
            red: allStrikes.filter(s => s.corner === 'red').length,
            blue: allStrikes.filter(s => s.corner === 'blue').length,
          },
          strikeBreakdown: {
            red: {
              punches: allStrikes.filter(s => s.corner === 'red' && s.category === 'punch').length,
              kicks: allStrikes.filter(s => s.corner === 'red' && s.category === 'kick').length,
              knees: allStrikes.filter(s => s.corner === 'red' && s.category === 'knee').length,
              elbows: allStrikes.filter(s => s.corner === 'red' && s.category === 'elbow').length,
            },
            blue: {
              punches: allStrikes.filter(s => s.corner === 'blue' && s.category === 'punch').length,
              kicks: allStrikes.filter(s => s.corner === 'blue' && s.category === 'kick').length,
              knees: allStrikes.filter(s => s.corner === 'blue' && s.category === 'knee').length,
              elbows: allStrikes.filter(s => s.corner === 'blue' && s.category === 'elbow').length,
            },
          },
          strikeTypes: {
            red: groupByType(allStrikes.filter(s => s.corner === 'red')),
            blue: groupByType(allStrikes.filter(s => s.corner === 'blue')),
          },
          matchInfo: {
            redName: matchInfo?.redName || 'Red Corner',
            blueName: matchInfo?.blueName || 'Blue Corner',
            totalRounds: matchInfo?.totalRounds || roundScores.length,
          },
        },
      });

      if (error) throw error;

      const fightReport: FightReport = {
        id: crypto.randomUUID(),
        generatedAt: Date.now(),
        rounds: roundScores,
        totalRedStrikes: allStrikes.filter(s => s.corner === 'red').length,
        totalBlueStrikes: allStrikes.filter(s => s.corner === 'blue').length,
        suggestedWinner: data.suggestedWinner || 'draw',
        winMethod: data.winMethod || 'Decision',
        redHighlights: data.redHighlights || [],
        blueHighlights: data.blueHighlights || [],
        summary: data.summary || '',
        technicalAnalysis: data.technicalAnalysis || '',
      };

      setReport(fightReport);
      return fightReport;
    } catch (err) {
      console.error('Failed to generate fight report:', err);
      return null;
    } finally {
      setIsGeneratingReport(false);
    }
  }, [roundScores]);

  /** Reset everything */
  const resetScoring = useCallback(() => {
    setCurrentRound(1);
    setRoundScores([]);
    setIsRoundActive(false);
    setReport(null);
    setActivityTimeline([]);
    roundStrikesRef.current = { red: [], blue: [] };
    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current);
      activityIntervalRef.current = null;
    }
  }, []);

  return {
    currentRound,
    roundScores,
    isRoundActive,
    report,
    isGeneratingReport,
    activityTimeline,
    startRound,
    endRound,
    recordStrike,
    generateReport,
    resetScoring,
  };
}

function groupByType(strikes: CompetitionStrike[]): Record<string, number> {
  return strikes.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
