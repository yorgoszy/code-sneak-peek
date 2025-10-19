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
        .order('test_date', { ascending: false })
        .limit(10);

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
          test_date: session.test_date,
          session_id: session.id
        }))
      );

      console.log('Bodyweight - Total sessions:', allData.length);
      console.log('Bodyweight - Sessions:', allData);

      setSessions(allData);
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

  const calculateChange = (field: 'push_ups' | 'pull_ups' | 't2b') => {
    if (sessions.length < 2) return null;
    const current = sessions[0][field];
    const previous = sessions[1][field];
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
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Push Ups:</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-[#cb8954]">{currentSession.push_ups}</span>
                {calculateChange('push_ups') !== null && (
                  <span className={`text-[10px] font-semibold ${
                    calculateChange('push_ups')! > 0 ? 'text-green-700' : 'text-red-500'
                  }`}>
                    {calculateChange('push_ups')! > 0 ? '+' : ''}
                    {Math.round(calculateChange('push_ups')!)}%
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Pull Ups */}
          {currentSession.pull_ups !== null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Pull Ups:</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-[#cb8954]">{currentSession.pull_ups}</span>
                {calculateChange('pull_ups') !== null && (
                  <span className={`text-[10px] font-semibold ${
                    calculateChange('pull_ups')! > 0 ? 'text-green-700' : 'text-red-500'
                  }`}>
                    {calculateChange('pull_ups')! > 0 ? '+' : ''}
                    {Math.round(calculateChange('pull_ups')!)}%
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* T2B */}
          {currentSession.t2b !== null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">T2B:</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-[#cb8954]">{currentSession.t2b}</span>
                {calculateChange('t2b') !== null && (
                  <span className={`text-[10px] font-semibold ${
                    calculateChange('t2b')! > 0 ? 'text-green-700' : 'text-red-500'
                  }`}>
                    {calculateChange('t2b')! > 0 ? '+' : ''}
                    {Math.round(calculateChange('t2b')!)}%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="pt-1 border-t border-gray-200">
          <div className="text-[10px] text-gray-400 text-center">
            Τελευταία μέτρηση: {format(new Date(currentSession.test_date), 'dd/MM/yy')}
          </div>
        </div>

        {sessions.length > 1 && (
          <div className="space-y-1 pt-1 border-t border-gray-200">
            <div className="text-[10px] text-gray-500 font-medium">Ιστορικό ({sessions.length - 1} προηγούμενες)</div>
            {sessions.slice(1, 4).map((session) => (
              <div key={session.id} className="flex flex-col gap-0.5 text-[10px] text-gray-400">
                <div className="flex items-center justify-between">
                  <span>{format(new Date(session.test_date), 'dd/MM/yy')}</span>
                </div>
                <span className="text-right">
                  {session.push_ups !== null && `Push:${session.push_ups} `}
                  {session.pull_ups !== null && `Pull:${session.pull_ups} `}
                  {session.t2b !== null && `T2B:${session.t2b}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
