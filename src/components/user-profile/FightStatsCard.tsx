import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Shield, Clock, CheckCircle, Swords, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useFightStats } from '@/hooks/useFightStats';
import { FightTimelineChart } from '@/components/video-analysis/FightTimelineChart';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import boxIcon from '@/assets/box-icon.png';
import kickIcon from '@/assets/kick-icon.png';
import kneeIcon from '@/assets/knee-icon.png';
import elbowIcon from '@/assets/elbow-icon.png';
import clinchIcon from '@/assets/clinch-icon.png';

interface FightStatsCardProps {
  userId: string;
}

interface Fight {
  id: string;
  opponent_name: string | null;
  fight_date: string;
  result: string | null;
  fight_type: string | null;
}

export const FightStatsCard: React.FC<FightStatsCardProps> = ({ userId }) => {
  const [latestFight, setLatestFight] = useState<Fight | null>(null);
  const [previousFight, setPreviousFight] = useState<Fight | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { stats, loading: statsLoading } = useFightStats(latestFight?.id || null);
  const { stats: prevStats } = useFightStats(previousFight?.id || null);

  useEffect(() => {
    const fetchFights = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('muaythai_fights')
          .select('id, opponent_name, fight_date, result, fight_type')
          .eq('user_id', userId)
          .order('fight_date', { ascending: false })
          .limit(2);

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching fights:', error);
        }
        
        if (data && data.length > 0) {
          setLatestFight(data[0]);
          if (data.length > 1) {
            setPreviousFight(data[1]);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFights();
  }, [userId]);

  // Calculate percentage change
  const getPercentChange = (current: number, previous: number): { value: number; icon: React.ReactNode } | null => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    if (change > 0) return { value: change, icon: <TrendingUp className="w-2 h-2 text-green-500" /> };
    if (change < 0) return { value: change, icon: <TrendingDown className="w-2 h-2 text-red-500" /> };
    return { value: 0, icon: <Minus className="w-2 h-2 text-muted-foreground" /> };
  };

  // Fight style calculation
  const getFightStyleInfo = () => {
    if (!stats) return { label: '-', color: 'text-muted-foreground' };
    const ratio = stats.attackDefenseRatio || 0;
    if (ratio >= 1.5) return { label: 'Επιθετικός', color: 'text-destructive' };
    if (ratio <= 0.7) return { label: 'Αμυντικός', color: 'text-blue-500' };
    return { label: 'Ισορροπημένος', color: 'text-green-500' };
  };

  const fightStyleInfo = getFightStyleInfo();

  const getResultBadge = (result: string | null) => {
    switch (result) {
      case 'win':
        return <Badge className="bg-green-500 hover:bg-green-600 rounded-none text-[7px] px-1 py-0">Ν</Badge>;
      case 'loss':
        return <Badge className="bg-destructive hover:bg-destructive/90 rounded-none text-[7px] px-1 py-0">Η</Badge>;
      case 'draw':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 rounded-none text-[7px] px-1 py-0">Ι</Badge>;
      default:
        return <Badge variant="outline" className="rounded-none text-[7px] px-1 py-0">-</Badge>;
    }
  };

  if (loading) {
    return null;
  }

  if (!latestFight) {
    return null;
  }

  // Progression calculations
  const strikesChange = prevStats ? getPercentChange(stats?.totalStrikes || 0, prevStats.totalStrikes || 0) : null;
  const hitsReceivedChange = prevStats ? getPercentChange(stats?.totalHitsReceived || 0, prevStats.totalHitsReceived || 0) : null;
  const boxChange = prevStats ? getPercentChange(stats?.punchesTotal || 0, prevStats.punchesTotal || 0) : null;
  const kicksChange = prevStats ? getPercentChange(stats?.kicksTotal || 0, prevStats.kicksTotal || 0) : null;
  const kneesChange = prevStats ? getPercentChange(stats?.kneesTotal || 0, prevStats.kneesTotal || 0) : null;
  const elbowsChange = prevStats ? getPercentChange(stats?.elbowsTotal || 0, prevStats.elbowsTotal || 0) : null;

  const statCards = [
    {
      title: 'Χτ.',
      value: stats?.totalStrikes || 0,
      icon: Target,
      change: strikesChange,
    },
    {
      title: 'Ορθ.',
      value: `${stats?.correctnessRate || 0}%`,
      icon: CheckCircle,
    },
    {
      title: 'Άμ.',
      value: `${stats?.successfulDefenses || 0}/${stats?.totalHitsReceived || 0}`,
      icon: Shield,
      change: hitsReceivedChange,
    },
    {
      title: 'Χρ.',
      value: stats?.actionTimeFormatted || '0:00',
      icon: Clock,
      customSubtitle: true,
      attackTime: stats?.attackTimeFormatted || '0:00',
      defenseTime: stats?.defenseTimeFormatted || '0:00',
    },
  ];

  const statCards2 = [
    { title: 'Box', value: stats?.punchesTotal || 0, imageIcon: boxIcon, change: boxChange },
    { title: 'Kick', value: stats?.kicksTotal || 0, imageIcon: kickIcon, change: kicksChange },
    { title: 'Knee', value: stats?.kneesTotal || 0, imageIcon: kneeIcon, change: kneesChange },
    { title: 'Elb.', value: stats?.elbowsTotal || 0, imageIcon: elbowIcon, change: elbowsChange },
    { title: 'Cli.', value: stats?.clinchTimeFormatted || '0:00', imageIcon: clinchIcon },
  ];

  const ChangeIndicator = ({ change, showAsTitle = false }: { change: { value: number; icon: React.ReactNode } | null | undefined; showAsTitle?: boolean }) => {
    if (!change) return null;
    return (
      <span className={`flex items-center gap-0.5 ${showAsTitle ? 'text-[6px]' : 'text-[6px]'}`}>
        {change.icon}
        <span className={change.value > 0 ? 'text-green-500' : change.value < 0 ? 'text-destructive' : 'text-muted-foreground'}>
          {change.value > 0 ? '+' : ''}{change.value.toFixed(0)}%
        </span>
      </span>
    );
  };

  return (
    <Card className="rounded-none w-full max-w-2xl">
      <CardContent className="p-1.5 space-y-0.5">
        {/* Fight Header */}
        <div className="flex items-center gap-1 pb-0.5 border-b border-border">
          <Swords className="w-3 h-3 text-muted-foreground" />
          <span className="text-[8px] font-medium">Αγώνας</span>
          {getResultBadge(latestFight.result)}
          <span className="text-[8px] text-muted-foreground truncate">
            vs {latestFight.opponent_name || '-'}
          </span>
          <span className="text-[7px] text-muted-foreground ml-auto">
            {format(new Date(latestFight.fight_date), 'dd/MM/yy', { locale: el })}
          </span>
        </div>

        {/* Stats Row 1 */}
        <div className="grid grid-cols-4 gap-0.5">
          {statCards.map((card, index) => (
            <div key={index} className="bg-muted p-0.5">
              <div className="flex items-center gap-0.5">
                <card.icon className="w-2.5 h-2.5 text-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-center gap-0.5">
                    <p className="text-[10px] font-bold text-foreground leading-tight truncate">
                      {statsLoading ? '...' : card.value}
                    </p>
                  </div>
                  {(card as any).customSubtitle ? (
                    <p className="text-[6px] truncate">
                      <span className="text-blue-500">Επ:{(card as any).attackTime}</span>
                      <span className="text-muted-foreground mx-0.5">|</span>
                      <span className="text-destructive">Άμ:{(card as any).defenseTime}</span>
                    </p>
                  ) : (card as any).change ? (
                    <ChangeIndicator change={(card as any).change} showAsTitle />
                  ) : (
                    <p className="text-[6px] text-muted-foreground truncate">{card.title}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Row 2 */}
        <div className="grid grid-cols-5 gap-0.5">
          {statCards2.map((card, index) => (
            <div key={index} className="bg-muted p-0.5">
              <div className="flex items-center gap-0.5">
                <img src={card.imageIcon} alt={card.title} className="w-2.5 h-2.5 object-contain flex-shrink-0" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-center gap-0.5">
                    <p className="text-[10px] font-bold text-foreground leading-tight truncate">
                      {statsLoading ? '...' : card.value}
                    </p>
                  </div>
                  {(card as any).change ? (
                    <ChangeIndicator change={(card as any).change} showAsTitle />
                  ) : (
                    <p className="text-[6px] text-muted-foreground truncate">{card.title}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Style Row */}
        <div className="bg-muted p-0.5 flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            <Swords className={`w-2.5 h-2.5 ${fightStyleInfo.color} flex-shrink-0`} />
            <p className={`text-[9px] font-bold ${fightStyleInfo.color} leading-tight`}>
              {statsLoading ? '...' : fightStyleInfo.label}
            </p>
            <p className="text-[6px] text-muted-foreground">Στυλ</p>
          </div>
          <p className="text-[8px] font-semibold text-foreground">
            Επ/Άμ: {stats?.attackDefenseRatio?.toFixed(2) || '0.00'}
          </p>
        </div>

        {/* Timeline Chart */}
        {stats && stats.roundsTimelineData && stats.roundsTimelineData.length > 0 && (
          <div className="pt-0.5">
            <FightTimelineChart 
              roundsData={stats.roundsTimelineData}
              loading={statsLoading}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};