import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface BodyweightProgressCardProps {
  userId: string;
}

export const BodyweightProgressCard: React.FC<BodyweightProgressCardProps> = ({ userId }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchBodyweightHistory();
    }
  }, [userId]);

  const fetchBodyweightHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('endurance_test_sessions')
        .select(`
          id,
          test_date,
          endurance_test_data!endurance_test_data_test_session_id_fkey (
            id,
            push_ups,
            pull_ups
          )
        `)
        .eq('user_id', userId)
        .order('test_date', { ascending: false });

      if (error) throw error;
      
      // Filter only sessions with bodyweight data
      const bodyweightSessions = (data || [])
        .map(session => ({
          ...session,
          endurance_test_data: (session.endurance_test_data || [])
            .filter(ed => ed.push_ups !== null || ed.pull_ups !== null)
        }))
        .filter(session => session.endurance_test_data.length > 0);

      // Flatten data with test dates
      const allData = bodyweightSessions.flatMap(session => 
        session.endurance_test_data.map(ed => ({
          ...ed,
          test_date: session.test_date
        }))
      );

      // Get the two most recent entries
      const recentSessions = allData.slice(0, 2);
      
      // Calculate percentage changes if we have at least 2 entries
      const processedSessions = recentSessions.length >= 2 ? [{
        ...recentSessions[0],
        pushUpsChange: recentSessions[0].push_ups && recentSessions[1].push_ups
          ? ((recentSessions[0].push_ups - recentSessions[1].push_ups) / recentSessions[1].push_ups) * 100
          : null,
        pullUpsChange: recentSessions[0].pull_ups && recentSessions[1].pull_ups
          ? ((recentSessions[0].pull_ups - recentSessions[1].pull_ups) / recentSessions[1].pull_ups) * 100
          : null
      }] : recentSessions.slice(0, 1);
      
      setSessions(processedSessions);
    } catch (error) {
      console.error('Error fetching bodyweight data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Push Ups & Pull Ups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500 text-xs">Φόρτωση...</div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Push Ups & Pull Ups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500 text-xs">Δεν υπάρχουν δεδομένα</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none max-w-2xl" style={{ width: 'calc(100% + 10px)' }}>
      <CardHeader className="p-[5px]">
        <CardTitle className="text-sm">Push Ups & Pull Ups</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2 overflow-x-auto pb-2 p-[5px]">
        {sessions.map((data) => (
          <Card key={data.id} className="rounded-none min-w-[130px] shrink-0">
            <CardContent className="p-[3px]">
              <div className="space-y-1">
                {/* Push Ups & Pull Ups δίπλα-δίπλα */}
                <div className="flex gap-3">
                  {/* Push Ups */}
                  {data.push_ups !== null && (
                    <div className="space-y-0.5 flex-1">
                      <div className="text-[10px] font-semibold text-gray-700">Push Ups</div>
                      <div className="flex items-center gap-1">
                        <div className="font-bold text-[#cb8954]">
                          {data.push_ups}
                        </div>
                        {data.pushUpsChange !== null && data.pushUpsChange !== undefined && (
                          <div className={`text-xs font-semibold ${
                            data.pushUpsChange > 0 ? 'text-[#00ffba]' : 'text-red-500'
                          }`}>
                            {data.pushUpsChange > 0 ? '+' : ''}
                            {data.pushUpsChange.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Pull Ups */}
                  {data.pull_ups !== null && (
                    <div className="space-y-0.5 flex-1">
                      <div className="text-[10px] font-semibold text-gray-700">Pull Ups</div>
                      <div className="flex items-center gap-1">
                        <div className="font-bold text-[#cb8954]">
                          {data.pull_ups}
                        </div>
                        {data.pullUpsChange !== null && data.pullUpsChange !== undefined && (
                          <div className={`text-xs font-semibold ${
                            data.pullUpsChange > 0 ? 'text-[#00ffba]' : 'text-red-500'
                          }`}>
                            {data.pullUpsChange > 0 ? '+' : ''}
                            {data.pullUpsChange.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Ημερομηνία */}
                <div className="text-xs text-gray-500 pt-1">
                  {format(new Date(data.test_date), 'dd/MM/yy')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};
