import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Shield, Clock, CheckCircle, Swords, Users, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useFightStats, defaultFightStats } from '@/hooks/useFightStats';
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
  const [loading, setLoading] = useState(true);
  
  const { stats, loading: statsLoading } = useFightStats(latestFight?.id || null);

  useEffect(() => {
    const fetchLatestFight = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('muaythai_fights')
          .select('id, opponent_name, fight_date, result, fight_type')
          .eq('user_id', userId)
          .order('fight_date', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching latest fight:', error);
        }
        
        setLatestFight(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestFight();
  }, [userId]);

  // Fight style calculation
  const getFightStyleInfo = () => {
    if (!stats) return { label: '-', color: 'text-gray-400' };
    const ratio = stats.attackDefenseRatio || 0;
    if (ratio >= 1.5) return { label: 'Επιθετικός', color: 'text-red-500' };
    if (ratio <= 0.7) return { label: 'Αμυντικός', color: 'text-blue-500' };
    return { label: 'Ισορροπημένος', color: 'text-green-500' };
  };

  const fightStyleInfo = getFightStyleInfo();

  const getResultBadge = (result: string | null) => {
    switch (result) {
      case 'win':
        return <Badge className="bg-green-500 hover:bg-green-600 rounded-none text-xs">Νίκη</Badge>;
      case 'loss':
        return <Badge className="bg-red-500 hover:bg-red-600 rounded-none text-xs">Ήττα</Badge>;
      case 'draw':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 rounded-none text-xs">Ισοπαλία</Badge>;
      default:
        return <Badge variant="outline" className="rounded-none text-xs">-</Badge>;
    }
  };

  if (loading) {
    return null;
  }

  if (!latestFight) {
    return null;
  }

  const statCards = [
    {
      title: 'Χτυπήματα',
      value: stats?.totalStrikes || 0,
      icon: Target,
    },
    {
      title: 'Ορθότητα',
      value: `${stats?.correctnessRate || 0}%`,
      icon: CheckCircle,
    },
    {
      title: 'Άμυνες',
      value: `${stats?.successfulDefenses || 0}/${stats?.totalHitsReceived || 0}`,
      icon: Shield,
    },
    {
      title: 'Χρόνος',
      value: stats?.actionTimeFormatted || '0:00',
      icon: Clock,
      customSubtitle: true,
      attackTime: stats?.attackTimeFormatted || '0:00',
      defenseTime: stats?.defenseTimeFormatted || '0:00',
    },
  ];

  const statCards2 = [
    { title: 'Box', value: stats?.punchesTotal || 0, imageIcon: boxIcon },
    { title: 'Kicks', value: stats?.kicksTotal || 0, imageIcon: kickIcon },
    { title: 'Knees', value: stats?.kneesTotal || 0, imageIcon: kneeIcon },
    { title: 'Elbows', value: stats?.elbowsTotal || 0, imageIcon: elbowIcon },
    { title: 'Clinch', value: stats?.clinchTimeFormatted || '0:00', imageIcon: clinchIcon },
  ];

  return (
    <Card className="rounded-none w-full max-w-2xl">
      <CardContent className="p-2 space-y-1">
        {/* Fight Header */}
        <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
          <Swords className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium">Τελευταίος Αγώνας</span>
          {getResultBadge(latestFight.result)}
          <span className="text-xs text-gray-500">
            vs {latestFight.opponent_name || 'Άγνωστος'}
          </span>
          <span className="text-[10px] text-gray-400 ml-auto">
            {format(new Date(latestFight.fight_date), 'dd/MM/yy', { locale: el })}
          </span>
        </div>

        {/* Stats Row 1 */}
        <div className="grid grid-cols-4 gap-0.5">
          {statCards.map((card, index) => (
            <div key={index} className="bg-gray-50 p-1">
              <div className="flex items-center gap-1">
                <card.icon className="w-3 h-3 text-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-foreground leading-tight truncate">
                    {statsLoading ? '...' : card.value}
                  </p>
                  {(card as any).customSubtitle ? (
                    <p className="text-[8px] truncate">
                      <span className="text-blue-500 font-medium">Επ: {(card as any).attackTime}</span>
                      <span className="text-gray-400 mx-0.5">|</span>
                      <span className="text-red-500 font-medium">Άμ: {(card as any).defenseTime}</span>
                    </p>
                  ) : (
                    <p className="text-[8px] text-gray-500 truncate">{card.title}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Row 2 */}
        <div className="grid grid-cols-5 gap-0.5">
          {statCards2.map((card, index) => (
            <div key={index} className="bg-gray-50 p-1">
              <div className="flex items-center gap-1">
                <img src={card.imageIcon} alt={card.title} className="w-3 h-3 object-contain flex-shrink-0" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-foreground leading-tight truncate">
                    {statsLoading ? '...' : card.value}
                  </p>
                  <p className="text-[8px] text-gray-500 truncate">{card.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Style Row */}
        <div className="bg-gray-50 p-1 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Swords className={`w-3 h-3 ${fightStyleInfo.color} flex-shrink-0`} />
            <p className={`text-sm font-bold ${fightStyleInfo.color} leading-tight`}>
              {statsLoading ? '...' : fightStyleInfo.label}
            </p>
            <p className="text-[8px] text-gray-500">Στυλ Μάχης</p>
          </div>
          <p className="text-xs font-semibold text-foreground">
            Επ/Άμ: {stats?.attackDefenseRatio?.toFixed(2) || '0.00'}
          </p>
        </div>

        {/* Timeline Chart */}
        {stats && stats.roundsTimelineData && stats.roundsTimelineData.length > 0 && (
          <div className="pt-1">
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
