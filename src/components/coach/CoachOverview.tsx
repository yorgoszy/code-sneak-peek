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

      // Total athletes for this coach (from app_users with coach_id)
      const { count: totalAthletes } = await supabase
        .from('app_users')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', coachId);

      // Active athletes (user_status = 'active')
      const { count: activeAthletes } = await supabase
        .from('app_users')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .eq('user_status', 'active');

      // New athletes this month
      const { count: newAthletesThisMonth } = await supabase
        .from('app_users')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);

      // Get athlete IDs for this coach
      const { data: athleteIds } = await supabase
        .from('app_users')
        .select('id')
        .eq('coach_id', coachId);

      const userIds = athleteIds?.map(a => a.id) || [];

      // Today's programs - count program_assignments with training_dates containing today
      let todaysPrograms = 0;
      if (userIds.length > 0) {
        const { data: assignments } = await supabase
          .from('program_assignments')
          .select('id, training_dates')
          .in('user_id', userIds)
          .eq('status', 'active');

        todaysPrograms = assignments?.filter(a => 
          a.training_dates?.includes(today)
        ).length || 0;
      }

      // Upcoming tests (anthropometric, strength, functional, jump, endurance)
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

      const { count: upcomingFunctional } = await supabase
        .from('coach_functional_test_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .gte('test_date', today);

      const { count: upcomingJump } = await supabase
        .from('coach_jump_test_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .gte('test_date', today);

      const { count: upcomingEndurance } = await supabase
        .from('coach_endurance_test_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .gte('test_date', today);

      // Count upcoming competitions for athletes of this coach
      let upcomingCompetitions = 0;
      if (userIds.length > 0) {
        const { count } = await supabase
          .from('competitions')
          .select('*', { count: 'exact', head: true })
          .in('user_id', userIds)
          .gte('competition_date', today);
        upcomingCompetitions = count || 0;
      }

      setStats({
        totalAthletes: totalAthletes || 0,
        activeAthletes: activeAthletes || 0,
        newAthletesThisMonth: newAthletesThisMonth || 0,
        todaysPrograms: todaysPrograms,
        upcomingTests: (upcomingAnthro || 0) + (upcomingStrength || 0) + (upcomingFunctional || 0) + (upcomingJump || 0) + (upcomingEndurance || 0),
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
