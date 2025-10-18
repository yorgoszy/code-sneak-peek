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
            pull_ups,
            t2b
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
            .filter(ed => ed.push_ups !== null || ed.pull_ups !== null || ed.t2b !== null)
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
          : null,
        t2bChange: recentSessions[0].t2b && recentSessions[1].t2b
          ? ((recentSessions[0].t2b - recentSessions[1].t2b) / recentSessions[1].t2b) * 100
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
    return null;
  }

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Push Ups, Pull Ups & T2B</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.map((data) => (
          <div key={data.id} className="space-y-1">
            {/* Push Ups */}
            {data.push_ups !== null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Push Ups:</span>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-[#cb8954]">{data.push_ups}</span>
                  {data.pushUpsChange !== null && data.pushUpsChange !== undefined && (
                    <span className={`text-[10px] font-semibold ${
                      data.pushUpsChange > 0 ? 'text-[#00ffba]' : 'text-red-500'
                    }`}>
                      {data.pushUpsChange > 0 ? '+' : ''}
                      {data.pushUpsChange.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Pull Ups */}
            {data.pull_ups !== null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Pull Ups:</span>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-[#cb8954]">{data.pull_ups}</span>
                  {data.pullUpsChange !== null && data.pullUpsChange !== undefined && (
                    <span className={`text-[10px] font-semibold ${
                      data.pullUpsChange > 0 ? 'text-[#00ffba]' : 'text-red-500'
                    }`}>
                      {data.pullUpsChange > 0 ? '+' : ''}
                      {data.pullUpsChange.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* T2B */}
            {data.t2b !== null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">T2B:</span>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-[#cb8954]">{data.t2b}</span>
                  {data.t2bChange !== null && data.t2bChange !== undefined && (
                    <span className={`text-[10px] font-semibold ${
                      data.t2bChange > 0 ? 'text-[#00ffba]' : 'text-red-500'
                    }`}>
                      {data.t2bChange > 0 ? '+' : ''}
                      {data.t2bChange.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="pt-1 border-t border-gray-200">
          <div className="text-[10px] text-gray-400 text-center">
            Τελευταία μέτρηση: {format(new Date(sessions[0].test_date), 'dd/MM/yy')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
