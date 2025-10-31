import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInCalendarDays } from "date-fns";
import { el } from "date-fns/locale";

interface UpcomingCompetition {
  date: string;
  name?: string;
  location?: string;
  userName?: string;
  userId?: string;
}

export const AllUpcomingCompetitionsCard = () => {
  const [upcomingCompetitions, setUpcomingCompetitions] = useState<UpcomingCompetition[]>([]);

  useEffect(() => {
    fetchAllUpcomingCompetitions();
  }, []);

  const fetchAllUpcomingCompetitions = async () => {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      const { data: competitions, error } = await supabase
        .from('competitions' as any)
        .select('competition_date, name, location, user_id')
        .gte('competition_date', todayStr)
        .order('competition_date', { ascending: true });

      if (error) {
        console.error('Error fetching competitions:', error);
        return;
      }

      const comps = (competitions as any[]) || [];

      // Fetch user names in a separate query to avoid type/join issues
      const userIds = Array.from(new Set(comps.map((c: any) => c.user_id).filter(Boolean)));
      let usersById: Record<string, { name?: string }> = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('app_users' as any)
          .select('id, name')
          .in('id', userIds);
        usersById = (users || []).reduce((acc: any, u: any) => {
          acc[u.id] = { name: u.name };
          return acc;
        }, {});
      }

      const allCompetitions: UpcomingCompetition[] = comps.map((comp: any) => ({
        date: comp.competition_date,
        name: comp.name,
        location: comp.location,
        userName: usersById[comp.user_id]?.name,
        userId: comp.user_id
      }));

      setUpcomingCompetitions(allCompetitions);
    } catch (error) {
      console.error('Error fetching all upcoming competitions:', error);
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-[#cb8954]" />
          Επερχόμενοι Αγώνες
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingCompetitions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Δεν υπάρχουν επερχόμενοι αγώνες</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {upcomingCompetitions.map((comp, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-none border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-[#cb8954]" />
                <div>
                  <p className="font-medium text-sm">
                    {format(new Date(comp.date), 'EEEE, d MMMM', { locale: el })}
                  </p>
                  {comp.userName && (
                    <p className="text-xs text-gray-600">{comp.userName}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {comp.name && (
                  <p className="text-xs font-medium text-gray-900">{comp.name}</p>
                )}
                {comp.location && (
                  <p className="text-xs text-gray-600">{comp.location}</p>
                )}
                <p className="text-xs text-gray-600">
                  {(() => {
                    const daysLeft = differenceInCalendarDays(new Date(comp.date), new Date());
                    return daysLeft === 0 ? 'σήμερα' : daysLeft === 1 ? 'αύριο' : `σε ${daysLeft} μέρες`;
                  })()}
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
