import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Wind } from "lucide-react";

interface VO2MaxProgressCardProps {
  userId: string;
}

export const VO2MaxProgressCard: React.FC<VO2MaxProgressCardProps> = ({ userId }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchVO2MaxHistory();
    }
  }, [userId]);

  const fetchVO2MaxHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('endurance_test_sessions')
        .select(`
          id,
          test_date,
          endurance_test_data!endurance_test_data_test_session_id_fkey (
            vo2_max
          )
        `)
        .eq('user_id', userId)
        .not('endurance_test_data.vo2_max', 'is', null)
        .order('test_date', { ascending: false })
        .limit(10);

      if (error) throw error;

      const filteredData = (data || []).filter(session => 
        session.endurance_test_data && session.endurance_test_data.length > 0
      );

      setSessions(filteredData);
    } catch (error) {
      console.error('Error fetching VO2 Max history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLatestValue = () => {
    if (sessions.length === 0) return null;
    return sessions[0]?.endurance_test_data?.[0]?.vo2_max;
  };

  const calculatePercentageChange = () => {
    if (sessions.length < 2) return null;
    const current = sessions[0]?.endurance_test_data?.[0]?.vo2_max;
    const previous = sessions[1]?.endurance_test_data?.[0]?.vo2_max;
    if (!current || !previous) return null;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return null;
  }

  if (sessions.length === 0) {
    return null;
  }

  const latestVO2Max = getLatestValue();

  return (
    <Card className="rounded-none w-full">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-xs flex items-center gap-1">
          <Wind className="w-3 h-3" />
          VO2 Max
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {/* Latest Value */}
        <div>
          <div className="text-[10px] text-gray-500">Τρέχον</div>
          <div className="flex items-center gap-1">
            <div className="text-sm font-semibold text-[#cb8954]">{latestVO2Max} ml/kg/min</div>
            {calculatePercentageChange() !== null && (
              <span className={`text-[10px] font-semibold ${
                calculatePercentageChange()! > 0 ? 'text-[#00ffba]' : 'text-red-500'
              }`}>
                {calculatePercentageChange()! > 0 ? '+' : ''}
                {calculatePercentageChange()!.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        <div className="pt-1 border-t border-gray-200">
          <div className="text-[10px] text-gray-400 text-center">
            Τελευταία μέτρηση: {format(new Date(sessions[0].test_date), 'dd/MM/yy')}
          </div>
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
                  <span className="font-medium text-[#cb8954]">{data?.vo2_max} ml/kg/min</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
