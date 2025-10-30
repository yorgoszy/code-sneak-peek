import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
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
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // Φόρτωση όλων των competitions από σήμερα και μετά
      const { data: competitions, error } = await supabase
        .from('competitions')
        .select(`
          competition_date,
          name,
          location,
          user_id,
          app_users!competitions_user_id_fkey(name)
        `)
        .gte('competition_date', todayStr)
        .order('competition_date', { ascending: true });

      if (error) {
        console.error('Error fetching competitions:', error);
        return;
      }

      if (competitions) {
        const allCompetitions: UpcomingCompetition[] = competitions.map(comp => ({
          date: comp.competition_date,
          name: comp.name,
          location: comp.location,
          userName: comp.app_users?.name,
          userId: comp.user_id
        }));

        setUpcomingCompetitions(allCompetitions);
      }

    } catch (error) {
      console.error('Error fetching all upcoming competitions:', error);
    }
  };

  if (upcomingCompetitions.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-[#cb8954]" />
          Επερχόμενοι Αγώνες
        </CardTitle>
      </CardHeader>
      <CardContent>
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
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
