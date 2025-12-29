import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, UserPlus, Dumbbell, ClipboardList, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

interface CoachOverviewProps {
  coachId: string;
}

interface Stats {
  totalAthletes: number;
  activeAthletes: number;
  newAthletesThisMonth: number;
  todaysPrograms: number;
  upcomingTests: number;
  upcomingCompetitions: number;
}

export const CoachOverview: React.FC<CoachOverviewProps> = ({ coachId }) => {
  const [stats, setStats] = useState<Stats>({
    totalAthletes: 0,
    activeAthletes: 0,
    newAthletesThisMonth: 0,
    todaysPrograms: 0,
    upcomingTests: 0,
    upcomingCompetitions: 0
  });
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (coachId) {
      fetchStats();
    }
  }, [coachId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      // Total coach_users for this coach
      const { count: totalAthletes } = await supabase
        .from('coach_users')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', coachId);

      // Active coach_users (status = 'active')
      const { count: activeAthletes } = await supabase
        .from('coach_users')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .eq('status', 'active');

      // New coach_users this month
      const { count: newAthletesThisMonth } = await supabase
        .from('coach_users')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);

      // Today's programs - count workout_completions for today
      const { count: todaysPrograms } = await supabase
        .from('workout_completions')
        .select('*', { count: 'exact', head: true })
        .eq('scheduled_date', today);

      // Upcoming tests (anthropometric, strength, etc.) - use test dates >= today
      const { count: upcomingAnthro } = await supabase
        .from('coach_anthropometric_test_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .gte('test_date', today);

      const { count: upcomingStrength } = await supabase
        .from('coach_strength_test_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .gte('test_date', today);

      // Count competitions from coach_users
      const { data: coachUserIds } = await supabase
        .from('coach_users')
        .select('id')
        .eq('coach_id', coachId);

      // For now, set competitions to 0 since we'd need to check a different table
      const upcomingCompetitions = 0;

      setStats({
        totalAthletes: totalAthletes || 0,
        activeAthletes: activeAthletes || 0,
        newAthletesThisMonth: newAthletesThisMonth || 0,
        todaysPrograms: todaysPrograms || 0,
        upcomingTests: (upcomingAnthro || 0) + (upcomingStrength || 0),
        upcomingCompetitions: upcomingCompetitions
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Συνολικοί Αθλητές",
      value: stats.totalAthletes,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Ενεργοί Αθλητές",
      value: stats.activeAthletes,
      icon: Activity,
      color: "text-[#00ffba]"
    },
    {
      title: "Νέοι Αθλητές",
      subtitle: "Αυτόν τον μήνα",
      value: stats.newAthletesThisMonth,
      icon: UserPlus,
      color: "text-green-600"
    },
    {
      title: "Σημερινά Προγράμματα",
      value: stats.todaysPrograms,
      icon: Dumbbell,
      color: "text-purple-600"
    },
    {
      title: "Επερχόμενα Τεστ",
      value: stats.upcomingTests,
      icon: ClipboardList,
      color: "text-orange-600"
    },
    {
      title: "Επερχόμενοι Αγώνες",
      value: stats.upcomingCompetitions,
      icon: Trophy,
      color: "text-[#cb8954]"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-gray-500">Φόρτωση...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Επισκόπηση</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="rounded-none">
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'pb-1 px-2 pt-2' : 'pb-2'}`}>
                <CardTitle className={`${isMobile ? 'text-[10px]' : 'text-sm'} font-medium leading-tight`}>
                  {stat.title}
                </CardTitle>
                <IconComponent className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${stat.color} flex-shrink-0`} />
              </CardHeader>
              <CardContent className={`${isMobile ? 'pt-0 px-2 pb-2' : ''}`}>
                <div className={`${isMobile ? 'text-base' : 'text-2xl'} font-bold`}>{stat.value}</div>
                {stat.subtitle && !isMobile && (
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
