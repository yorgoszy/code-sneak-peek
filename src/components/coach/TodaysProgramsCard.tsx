import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface TodaysProgramsCardProps {
  coachId: string;
}

interface TodayProgram {
  id: string;
  userName: string;
  userAvatar: string | null;
  programName: string;
  dayName: string;
}

export const TodaysProgramsCard: React.FC<TodaysProgramsCardProps> = ({ coachId }) => {
  const [programs, setPrograms] = useState<TodayProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (coachId) {
      fetchTodaysPrograms();
    }
  }, [coachId]);

  const fetchTodaysPrograms = async () => {
    try {
      setLoading(true);
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      // Fetch active assignments for this coach
      const { data: assignments, error } = await supabase
        .from('program_assignments')
        .select(`
          id,
          training_dates,
          programs:program_id (
            id,
            name,
            program_weeks (
              id,
              week_number,
              program_days (
                id,
                name,
                day_number
              )
            )
          ),
          app_users:user_id (
            id,
            name,
            photo_url,
            avatar_url
          )
        `)
        .eq('coach_id', coachId)
        .eq('status', 'active');

      if (error) throw error;

      const todaysPrograms: TodayProgram[] = [];

      (assignments || []).forEach((assignment: any) => {
        const trainingDates = assignment.training_dates || [];
        const todayIndex = trainingDates.indexOf(todayStr);

        if (todayIndex >= 0) {
          const program = assignment.programs;
          const user = assignment.app_users;
          
          if (program && user) {
            // Find the day for today's training
            const allDays: any[] = [];
            (program.program_weeks || [])
              .sort((a: any, b: any) => a.week_number - b.week_number)
              .forEach((week: any) => {
                (week.program_days || [])
                  .sort((a: any, b: any) => a.day_number - b.day_number)
                  .forEach((day: any) => {
                    allDays.push(day);
                  });
              });

            const dayForToday = allDays[todayIndex % allDays.length];

            todaysPrograms.push({
              id: assignment.id,
              userName: user.name,
              userAvatar: user.photo_url || user.avatar_url,
              programName: program.name,
              dayName: dayForToday?.name || `Ημέρα ${todayIndex + 1}`
            });
          }
        }
      });

      setPrograms(todaysPrograms);
    } catch (error) {
      console.error('Error fetching todays programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-purple-600" />
          Σημερινά Προγράμματα
          <span className="text-xs text-gray-500 font-normal">({programs.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[200px] overflow-y-auto">
        {loading ? (
          <div className="text-gray-400 text-sm">Φόρτωση...</div>
        ) : programs.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-4">
            Δεν υπάρχουν σημερινά προγράμματα
          </div>
        ) : (
          <div className="space-y-2">
            {programs.map((program) => (
              <div
                key={program.id}
                className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={program.userAvatar || ''} alt={program.userName} />
                  <AvatarFallback className="text-xs bg-[#00ffba] text-black">
                    {getInitials(program.userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{program.userName}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {program.programName} • {program.dayName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
