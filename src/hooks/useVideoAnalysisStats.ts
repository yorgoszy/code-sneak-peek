import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VideoAnalysisStats {
  totalStrikes: number;
  landedStrikes: number;
  accuracy: number;
  totalDefenses: number;
  successfulDefenses: number;
  defenseSuccessRate: number;
  actionTimeMinutes: number;
  fightStyle: 'aggressive' | 'defensive' | 'balanced';
  attackDefenseRatio: number;
  totalFights: number;
  
  // Strike breakdown
  punchesTotal: number;
  punchesLanded: number;
  kicksTotal: number;
  kicksLanded: number;
  kneesTotal: number;
  kneesLanded: number;
  elbowsTotal: number;
  elbowsLanded: number;
  
  // Side distribution
  leftSideStrikes: number;
  rightSideStrikes: number;
  leftSidePercentage: number;
  rightSidePercentage: number;
  
  // Defense breakdown
  blocksTotal: number;
  blocksSuccess: number;
  dodgesTotal: number;
  dodgesSuccess: number;
  parriesTotal: number;
  parriesSuccess: number;
  clinchTotal: number;
  clinchSuccess: number;

  // NEW: Correctness / Technique quality
  correctStrikes: number;
  correctnessRate: number; // Ορθότητα %
  
  // NEW: Opponent stats
  opponentTotalStrikes: number;
  opponentLandedStrikes: number;
  opponentAccuracy: number;
  opponentCorrectStrikes: number;
  opponentCorrectnessRate: number;
  
  // NEW: Hits received
  totalHitsReceived: number;
  avgHitsReceivedPerRound: number;
}

const defaultStats: VideoAnalysisStats = {
  totalStrikes: 0,
  landedStrikes: 0,
  accuracy: 0,
  totalDefenses: 0,
  successfulDefenses: 0,
  defenseSuccessRate: 0,
  actionTimeMinutes: 0,
  fightStyle: 'balanced',
  attackDefenseRatio: 1,
  totalFights: 0,
  punchesTotal: 0,
  punchesLanded: 0,
  kicksTotal: 0,
  kicksLanded: 0,
  kneesTotal: 0,
  kneesLanded: 0,
  elbowsTotal: 0,
  elbowsLanded: 0,
  leftSideStrikes: 0,
  rightSideStrikes: 0,
  leftSidePercentage: 0,
  rightSidePercentage: 0,
  blocksTotal: 0,
  blocksSuccess: 0,
  dodgesTotal: 0,
  dodgesSuccess: 0,
  parriesTotal: 0,
  parriesSuccess: 0,
  clinchTotal: 0,
  clinchSuccess: 0,
  // New defaults
  correctStrikes: 0,
  correctnessRate: 0,
  opponentTotalStrikes: 0,
  opponentLandedStrikes: 0,
  opponentAccuracy: 0,
  opponentCorrectStrikes: 0,
  opponentCorrectnessRate: 0,
  totalHitsReceived: 0,
  avgHitsReceivedPerRound: 0,
};

export const useVideoAnalysisStats = (userId: string | null) => {
  const [stats, setStats] = useState<VideoAnalysisStats>(defaultStats);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setStats(defaultStats);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch fights
        const { data: fights } = await supabase
          .from('muaythai_fights')
          .select('id')
          .eq('user_id', userId);

        const fightIds = fights?.map(f => f.id) || [];
        const totalFights = fightIds.length;

        if (totalFights === 0) {
          setStats({ ...defaultStats, totalFights: 0 });
          setLoading(false);
          return;
        }

        // Fetch rounds for these fights
        const { data: rounds } = await supabase
          .from('muaythai_rounds')
          .select('id, duration_seconds, hits_received')
          .in('fight_id', fightIds);

        const roundIds = rounds?.map(r => r.id) || [];
        const totalRounds = rounds?.length || 0;

        // Fetch strikes
        const { data: strikes } = await supabase
          .from('muaythai_strikes')
          .select('*')
          .in('round_id', roundIds);

        // Fetch defenses
        const { data: defenses } = await supabase
          .from('muaythai_defenses')
          .select('*')
          .in('round_id', roundIds);

        // Separate athlete vs opponent strikes
        const athleteStrikes = strikes?.filter(s => !s.is_opponent) || [];
        const opponentStrikesData = strikes?.filter(s => s.is_opponent) || [];

        // Athlete stats
        const totalStrikes = athleteStrikes.length;
        const landedStrikes = athleteStrikes.filter(s => s.landed).length;
        const accuracy = totalStrikes > 0 ? Math.round((landedStrikes / totalStrikes) * 100) : 0;
        const correctStrikes = athleteStrikes.filter(s => s.is_correct).length;
        const correctnessRate = totalStrikes > 0 ? Math.round((correctStrikes / totalStrikes) * 100) : 0;

        // Opponent stats
        const opponentTotalStrikes = opponentStrikesData.length;
        const opponentLandedStrikes = opponentStrikesData.filter(s => s.landed).length;
        const opponentAccuracy = opponentTotalStrikes > 0 ? Math.round((opponentLandedStrikes / opponentTotalStrikes) * 100) : 0;
        const opponentCorrectStrikes = opponentStrikesData.filter(s => s.is_correct).length;
        const opponentCorrectnessRate = opponentTotalStrikes > 0 ? Math.round((opponentCorrectStrikes / opponentTotalStrikes) * 100) : 0;

        // Hits received
        const totalHitsReceived = rounds?.reduce((sum, r) => sum + (r.hits_received || 0), 0) || 0;
        const avgHitsReceivedPerRound = totalRounds > 0 ? Math.round((totalHitsReceived / totalRounds) * 10) / 10 : 0;

        // Athlete defenses only
        const athleteDefenses = defenses?.filter(d => !d.is_opponent) || [];
        const totalDefenses = athleteDefenses.length;
        const successfulDefenses = athleteDefenses.filter(d => d.successful).length;
        const defenseSuccessRate = totalDefenses > 0 ? Math.round((successfulDefenses / totalDefenses) * 100) : 0;

        // Strike breakdown by type (athlete only)
        const punchesTotal = athleteStrikes.filter(s => s.strike_type === 'punch').length;
        const punchesLanded = athleteStrikes.filter(s => s.strike_type === 'punch' && s.landed).length;
        const kicksTotal = athleteStrikes.filter(s => s.strike_type === 'kick').length;
        const kicksLanded = athleteStrikes.filter(s => s.strike_type === 'kick' && s.landed).length;
        const kneesTotal = athleteStrikes.filter(s => s.strike_type === 'knee').length;
        const kneesLanded = athleteStrikes.filter(s => s.strike_type === 'knee' && s.landed).length;
        const elbowsTotal = athleteStrikes.filter(s => s.strike_type === 'elbow').length;
        const elbowsLanded = athleteStrikes.filter(s => s.strike_type === 'elbow' && s.landed).length;

        // Side distribution (athlete only)
        const leftSideStrikes = athleteStrikes.filter(s => s.side === 'left').length;
        const rightSideStrikes = athleteStrikes.filter(s => s.side === 'right').length;
        const leftSidePercentage = totalStrikes > 0 ? Math.round((leftSideStrikes / totalStrikes) * 100) : 0;
        const rightSidePercentage = totalStrikes > 0 ? Math.round((rightSideStrikes / totalStrikes) * 100) : 0;

        // Defense breakdown (athlete only)
        const blocksTotal = athleteDefenses.filter(d => d.defense_type === 'block').length;
        const blocksSuccess = athleteDefenses.filter(d => d.defense_type === 'block' && d.successful).length;
        const dodgesTotal = athleteDefenses.filter(d => d.defense_type === 'dodge').length;
        const dodgesSuccess = athleteDefenses.filter(d => d.defense_type === 'dodge' && d.successful).length;
        const parriesTotal = athleteDefenses.filter(d => d.defense_type === 'parry').length;
        const parriesSuccess = athleteDefenses.filter(d => d.defense_type === 'parry' && d.successful).length;
        const clinchTotal = athleteDefenses.filter(d => d.defense_type === 'clinch').length;
        const clinchSuccess = athleteDefenses.filter(d => d.defense_type === 'clinch' && d.successful).length;

        // Calculate fight style
        const attackDefenseRatio = totalDefenses > 0 ? totalStrikes / totalDefenses : totalStrikes;
        let fightStyle: 'aggressive' | 'defensive' | 'balanced' = 'balanced';
        if (attackDefenseRatio > 1.5) fightStyle = 'aggressive';
        else if (attackDefenseRatio < 0.67) fightStyle = 'defensive';

        // Action time (sum of round durations)
        const totalSeconds = rounds?.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) || 0;
        const actionTimeMinutes = Math.round(totalSeconds / 60);

        setStats({
          totalStrikes,
          landedStrikes,
          accuracy,
          totalDefenses,
          successfulDefenses,
          defenseSuccessRate,
          actionTimeMinutes,
          fightStyle,
          attackDefenseRatio,
          totalFights,
          punchesTotal,
          punchesLanded,
          kicksTotal,
          kicksLanded,
          kneesTotal,
          kneesLanded,
          elbowsTotal,
          elbowsLanded,
          leftSideStrikes,
          rightSideStrikes,
          leftSidePercentage,
          rightSidePercentage,
          blocksTotal,
          blocksSuccess,
          dodgesTotal,
          dodgesSuccess,
          parriesTotal,
          parriesSuccess,
          clinchTotal,
          clinchSuccess,
          // New stats
          correctStrikes,
          correctnessRate,
          opponentTotalStrikes,
          opponentLandedStrikes,
          opponentAccuracy,
          opponentCorrectStrikes,
          opponentCorrectnessRate,
          totalHitsReceived,
          avgHitsReceivedPerRound,
        });
      } catch (error) {
        console.error('Error fetching video analysis stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return { stats, loading };
};
