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
          .select('id, duration_seconds')
          .in('fight_id', fightIds);

        const roundIds = rounds?.map(r => r.id) || [];

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

        // Calculate stats
        const totalStrikes = strikes?.length || 0;
        const landedStrikes = strikes?.filter(s => s.landed).length || 0;
        const accuracy = totalStrikes > 0 ? Math.round((landedStrikes / totalStrikes) * 100) : 0;

        const totalDefenses = defenses?.length || 0;
        const successfulDefenses = defenses?.filter(d => d.successful).length || 0;
        const defenseSuccessRate = totalDefenses > 0 ? Math.round((successfulDefenses / totalDefenses) * 100) : 0;

        // Strike breakdown by type
        const punchesTotal = strikes?.filter(s => s.strike_type === 'punch').length || 0;
        const punchesLanded = strikes?.filter(s => s.strike_type === 'punch' && s.landed).length || 0;
        const kicksTotal = strikes?.filter(s => s.strike_type === 'kick').length || 0;
        const kicksLanded = strikes?.filter(s => s.strike_type === 'kick' && s.landed).length || 0;
        const kneesTotal = strikes?.filter(s => s.strike_type === 'knee').length || 0;
        const kneesLanded = strikes?.filter(s => s.strike_type === 'knee' && s.landed).length || 0;
        const elbowsTotal = strikes?.filter(s => s.strike_type === 'elbow').length || 0;
        const elbowsLanded = strikes?.filter(s => s.strike_type === 'elbow' && s.landed).length || 0;

        // Side distribution
        const leftSideStrikes = strikes?.filter(s => s.side === 'left').length || 0;
        const rightSideStrikes = strikes?.filter(s => s.side === 'right').length || 0;
        const leftSidePercentage = totalStrikes > 0 ? Math.round((leftSideStrikes / totalStrikes) * 100) : 0;
        const rightSidePercentage = totalStrikes > 0 ? Math.round((rightSideStrikes / totalStrikes) * 100) : 0;

        // Defense breakdown
        const blocksTotal = defenses?.filter(d => d.defense_type === 'block').length || 0;
        const blocksSuccess = defenses?.filter(d => d.defense_type === 'block' && d.successful).length || 0;
        const dodgesTotal = defenses?.filter(d => d.defense_type === 'dodge').length || 0;
        const dodgesSuccess = defenses?.filter(d => d.defense_type === 'dodge' && d.successful).length || 0;
        const parriesTotal = defenses?.filter(d => d.defense_type === 'parry').length || 0;
        const parriesSuccess = defenses?.filter(d => d.defense_type === 'parry' && d.successful).length || 0;
        const clinchTotal = defenses?.filter(d => d.defense_type === 'clinch').length || 0;
        const clinchSuccess = defenses?.filter(d => d.defense_type === 'clinch' && d.successful).length || 0;

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
        });
      } catch (error) {
        console.error('Error fetching muay thai stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return { stats, loading };
};
