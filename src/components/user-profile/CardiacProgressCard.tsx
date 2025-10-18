import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Activity } from "lucide-react";

interface CardiacProgressCardProps {
  userId: string;
}

export const CardiacProgressCard: React.FC<CardiacProgressCardProps> = ({ userId }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchCardiacHistory();
    }
  }, [userId]);

  const fetchCardiacHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('endurance_test_sessions')
        .select(`
          id,
          test_date,
          endurance_test_data!endurance_test_data_test_session_id_fkey (
            max_hr,
            resting_hr_1min
          )
        `)
        .eq('user_id', userId)
        .or('endurance_test_data.max_hr.not.is.null,endurance_test_data.resting_hr_1min.not.is.null')
        .order('test_date', { ascending: false })
        .limit(10);

      if (error) throw error;

      const filteredData = (data || []).filter(session => 
        session.endurance_test_data && session.endurance_test_data.length > 0
      );

      setSessions(filteredData);
    } catch (error) {
      console.error('Error fetching cardiac history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLatestValue = (field: 'max_hr' | 'resting_hr_1min') => {
    if (sessions.length === 0) return null;
    return sessions[0]?.endurance_test_data?.[0]?.[field];
  };

  if (loading) {
    return (
      <Card className="rounded-none w-fit">
        <CardContent className="p-3">
          <div className="text-xs text-gray-500">Φόρτωση...</div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return null;
  }

  const latestMaxHr = getLatestValue('max_hr');
  const latestRestingHr = getLatestValue('resting_hr_1min');

  return (
    <Card className="rounded-none w-fit">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-xs flex items-center gap-1">
          <Activity className="w-3 h-3" />
          Cardiac Data
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {/* Latest Values */}
        <div className="flex gap-3">
          {latestMaxHr && (
            <div>
              <div className="text-[10px] text-gray-500">Max HR</div>
              <div className="text-sm font-semibold text-gray-900">{latestMaxHr} bpm</div>
            </div>
          )}
          {latestRestingHr && (
            <div>
              <div className="text-[10px] text-gray-500">1min Rest</div>
              <div className="text-sm font-semibold text-gray-900">{latestRestingHr} bpm</div>
            </div>
          )}
        </div>

        {/* History */}
        {sessions.length > 1 && (
          <div className="space-y-1 pt-1 border-t border-gray-200">
            <div className="text-[10px] text-gray-500 font-medium">Ιστορικό ({sessions.length - 1} προηγούμενες)</div>
            {sessions.slice(1, 4).map((session, idx) => {
              const data = session.endurance_test_data?.[0];
              return (
                <div key={session.id} className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>{format(new Date(session.test_date), 'dd/MM/yy')}</span>
                  <div className="flex gap-2">
                    {data?.max_hr && <span>Max: {data.max_hr}</span>}
                    {data?.resting_hr_1min && <span>Rest: {data.resting_hr_1min}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
