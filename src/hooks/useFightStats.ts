import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TimelineDataPoint {
  time: string;
  timeSeconds: number;
  strikes: number;
  defenses: number;
  attacks: number;
}

export interface RoundTimelineData {
  roundNumber: number;
  duration: number;
  data: TimelineDataPoint[];
}

export interface FightStats {
  totalStrikes: number;
  landedStrikes: number;
  accuracy: number;
  totalDefenses: number;
  successfulDefenses: number;
  defenseSuccessRate: number;
  actionTimeSeconds: number;
  actionTimeFormatted: string; // Format X:XX
  attackTimeSeconds: number;
  attackTimeFormatted: string;
  defenseTimeSeconds: number;
  defenseTimeFormatted: string;
  fightStyle: 'aggressive' | 'defensive' | 'balanced';
  attackDefenseRatio: number;
  
  // Correctness
  correctStrikes: number;
  correctnessRate: number;
  
  // Hits received
  totalHitsReceived: number;
  avgHitsReceivedPerRound: number;
  
  // Strike breakdown
  punchesTotal: number;
  punchesLanded: number;
  kicksTotal: number;
  kicksLanded: number;
  kneesTotal: number;
  kneesLanded: number;
  elbowsTotal: number;
  elbowsLanded: number;
  
  // Side distribution - punches only (hands)
  leftHandStrikes: number;
  rightHandStrikes: number;
  leftHandPercentage: number;
  rightHandPercentage: number;
  
  // Side distribution - all strikes
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
  
  // Opponent stats
  opponentTotalStrikes: number;
  opponentLandedStrikes: number;
  opponentAccuracy: number;
  
  // Timeline data for chart - per round
  roundsTimelineData: RoundTimelineData[];
}

export const defaultFightStats: FightStats = {
  totalStrikes: 0,
  landedStrikes: 0,
  accuracy: 0,
  totalDefenses: 0,
  successfulDefenses: 0,
  defenseSuccessRate: 0,
  actionTimeSeconds: 0,
  actionTimeFormatted: '0:00',
  attackTimeSeconds: 0,
  attackTimeFormatted: '0:00',
  defenseTimeSeconds: 0,
  defenseTimeFormatted: '0:00',
  fightStyle: 'balanced',
  attackDefenseRatio: 1,
  correctStrikes: 0,
  correctnessRate: 0,
  totalHitsReceived: 0,
  avgHitsReceivedPerRound: 0,
  punchesTotal: 0,
  punchesLanded: 0,
  kicksTotal: 0,
  kicksLanded: 0,
  kneesTotal: 0,
  kneesLanded: 0,
  elbowsTotal: 0,
  elbowsLanded: 0,
  leftHandStrikes: 0,
  rightHandStrikes: 0,
  leftHandPercentage: 0,
  rightHandPercentage: 0,
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
  opponentTotalStrikes: 0,
  opponentLandedStrikes: 0,
  opponentAccuracy: 0,
  roundsTimelineData: [],
};

export const useFightStats = (fightId: string | null) => {
  const [stats, setStats] = useState<FightStats>(defaultFightStats);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fightId) {
      setStats(defaultFightStats);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch rounds for this fight (ordered by round number)
        const { data: rounds } = await supabase
          .from('muaythai_rounds')
          .select('id, round_number, duration_seconds, hits_received')
          .eq('fight_id', fightId)
          .order('round_number', { ascending: true });

        const roundIds = rounds?.map(r => r.id) || [];
        const totalRounds = rounds?.length || 0;

        if (roundIds.length === 0) {
          setStats(defaultFightStats);
          setLoading(false);
          return;
        }

        // Create a map of round_id to its info
        const roundInfoMap: Record<string, { roundNumber: number; duration: number }> = {};
        
        const formatTime = (totalSecs: number) => {
          const mins = Math.floor(totalSecs / 60);
          const secs = totalSecs % 60;
          return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
        
        for (const round of rounds || []) {
          roundInfoMap[round.id] = {
            roundNumber: round.round_number,
            duration: round.duration_seconds || 0,
          };
        }

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

        // Hand strikes (punches) side distribution
        const punchStrikes = athleteStrikes.filter(s => s.strike_type === 'punch');
        const leftHandStrikes = punchStrikes.filter(s => s.side === 'left').length;
        const rightHandStrikes = punchStrikes.filter(s => s.side === 'right').length;
        const totalHandStrikes = punchStrikes.length;
        const leftHandPercentage = totalHandStrikes > 0 ? Math.round((leftHandStrikes / totalHandStrikes) * 100) : 0;
        const rightHandPercentage = totalHandStrikes > 0 ? Math.round((rightHandStrikes / totalHandStrikes) * 100) : 0;

        // Side distribution (all athlete strikes)
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

        // Action time (sum of round durations) - keep in seconds
        const actionTimeSeconds = rounds?.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) || 0;
        const actionTimeFormatted = formatTime(actionTimeSeconds);

        // Attack time and Defense time calculation
        // Estimate based on strikes vs defenses ratio
        // Attack time = proportional to athlete strikes
        // Defense time = proportional to opponent strikes (when athlete is defending)
        const totalActions = totalStrikes + opponentTotalStrikes;
        const attackTimeSeconds = totalActions > 0 
          ? Math.round((totalStrikes / totalActions) * actionTimeSeconds) 
          : 0;
        const defenseTimeSeconds = totalActions > 0 
          ? Math.round((opponentTotalStrikes / totalActions) * actionTimeSeconds) 
          : 0;
        const attackTimeFormatted = formatTime(attackTimeSeconds);
        const defenseTimeFormatted = formatTime(defenseTimeSeconds);

        // Build timeline data per round (every 30 seconds)
        const roundsTimelineData: RoundTimelineData[] = [];
        const interval = 30; // 30 seconds
        
        for (const round of rounds || []) {
          const roundId = round.id;
          const roundDuration = round.duration_seconds || 0;
          const roundNumber = round.round_number;
          
          const roundStrikes = athleteStrikes.filter(s => s.round_id === roundId);
          const roundDefenses = athleteDefenses.filter(d => d.round_id === roundId);
          const roundOpponentStrikes = opponentStrikesData.filter(s => s.round_id === roundId);
          
          const roundData: TimelineDataPoint[] = [];
          
          // Generate intervals from 0 to roundDuration (inclusive of last interval)
          for (let t = 0; t <= roundDuration; t += interval) {
            const endT = t + interval;
            
            // Count strikes in this interval
            const strikesInInterval = roundStrikes.filter(s => {
              const ts = s.timestamp_in_round || 0;
              return ts >= t && ts < endT;
            }).length;
            
            // Count defenses in this interval
            const defensesInInterval = roundDefenses.filter(d => {
              const ts = (d as any).timestamp_in_round || 0;
              return ts >= t && ts < endT;
            }).length;
            
            // Attacks (opponent strikes)
            const attacksInInterval = roundOpponentStrikes.filter(s => {
              const ts = s.timestamp_in_round || 0;
              return ts >= t && ts < endT;
            }).length;
            
            const timeLabel = formatTime(t);
            
            roundData.push({
              time: timeLabel,
              timeSeconds: t,
              strikes: strikesInInterval,
              defenses: defensesInInterval,
              attacks: attacksInInterval,
            });
          }
          
          roundsTimelineData.push({
            roundNumber,
            duration: roundDuration,
            data: roundData,
          });
        }

        setStats({
          totalStrikes,
          landedStrikes,
          accuracy,
          totalDefenses,
          successfulDefenses,
          defenseSuccessRate,
          actionTimeSeconds,
          actionTimeFormatted,
          attackTimeSeconds,
          attackTimeFormatted,
          defenseTimeSeconds,
          defenseTimeFormatted,
          fightStyle,
          attackDefenseRatio,
          correctStrikes,
          correctnessRate,
          totalHitsReceived,
          avgHitsReceivedPerRound,
          punchesTotal,
          punchesLanded,
          kicksTotal,
          kicksLanded,
          kneesTotal,
          kneesLanded,
          elbowsTotal,
          elbowsLanded,
          leftHandStrikes,
          rightHandStrikes,
          leftHandPercentage,
          rightHandPercentage,
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
          opponentTotalStrikes,
          opponentLandedStrikes,
          opponentAccuracy,
          roundsTimelineData,
        });
      } catch (error) {
        console.error('Error fetching fight stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [fightId]);

  return { stats, loading };
};
