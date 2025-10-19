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

      // Get all recent entries
      const allSessions = allData.slice(0, 2);
      
      // Store both current and previous
      setSessions(allSessions);
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

  const currentSession = sessions[0];
  const previousSession = sessions[1];

  const calculateChange = (current: number | null, previous: number | null) => {
    if (!current || !previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Push Ups, Pull Ups & T2B</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          {/* Push Ups */}
          {currentSession.push_ups !== null && (
            <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
              <span className="text-gray-500">Push Ups:</span>
              <span className="font-semibold text-[#cb8954] text-right">{currentSession.push_ups}</span>
              <div className="text-right">
                {(() => {
                  const change = calculateChange(currentSession.push_ups, previousSession?.push_ups);
                  return change !== null ? (
                    <span className={`text-[10px] font-semibold ${
                      change > 0 ? 'text-green-700' : 'text-red-500'
                    }`}>
                      {change > 0 ? '+' : ''}
                      {Math.round(change)}%
                    </span>
                  ) : null;
                })()}
              </div>
            </div>
          )}
          
          {/* Pull Ups */}
          {currentSession.pull_ups !== null && (
            <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
              <span className="text-gray-500">Pull Ups:</span>
              <span className="font-semibold text-[#cb8954] text-right">{currentSession.pull_ups}</span>
              <div className="text-right">
                {(() => {
                  const change = calculateChange(currentSession.pull_ups, previousSession?.pull_ups);
                  return change !== null ? (
                    <span className={`text-[10px] font-semibold ${
                      change > 0 ? 'text-green-700' : 'text-red-500'
                    }`}>
                      {change > 0 ? '+' : ''}
                      {Math.round(change)}%
                    </span>
                  ) : null;
                })()}
              </div>
            </div>
          )}
          
          {/* T2B */}
          {currentSession.t2b !== null && (
            <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
              <span className="text-gray-500">T2B:</span>
              <span className="font-semibold text-[#cb8954] text-right">{currentSession.t2b}</span>
              <div className="text-right">
                {(() => {
                  const change = calculateChange(currentSession.t2b, previousSession?.t2b);
                  return change !== null ? (
                    <span className={`text-[10px] font-semibold ${
                      change > 0 ? 'text-green-700' : 'text-red-500'
                    }`}>
                      {change > 0 ? '+' : ''}
                      {Math.round(change)}%
                    </span>
                  ) : null;
                })()}
              </div>
            </div>
          )}
        </div>

        <div className="pt-1 border-t border-gray-200">
          <div className="text-[10px] text-gray-400 text-center">
            Τελευταία μέτρηση: {format(new Date(currentSession.test_date), 'dd/MM/yy')}
          </div>
        </div>

        {previousSession && (
          <div className="pt-1 border-t border-gray-200">
            <div className="text-[9px] text-gray-400">
              Ιστορικό
            </div>
            <div className="text-[9px] text-gray-400">
              {format(new Date(previousSession.test_date), 'dd/MM/yy')}
              {previousSession.push_ups !== null && ` Push:${previousSession.push_ups}`}
              {previousSession.pull_ups !== null && ` Pull:${previousSession.pull_ups}`}
              {previousSession.t2b !== null && ` T2B:${previousSession.t2b}`}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
