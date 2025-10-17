import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface MasProgressCardProps {
  userId: string;
}

export const MasProgressCard: React.FC<MasProgressCardProps> = ({ userId }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchMasHistory();
    }
  }, [userId]);

  const fetchMasHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('endurance_test_sessions')
        .select(`
          id,
          test_date,
          endurance_test_data!endurance_test_data_test_session_id_fkey (
            id,
            mas_meters,
            mas_minutes,
            mas_ms,
            mas_kmh,
            exercises (
              id,
              name
            )
          )
        `)
        .eq('user_id', userId)
        .order('test_date', { ascending: false });

      if (error) throw error;
      
      // Filter sessions that have endurance data
      const filteredData = (data || []).filter(session => 
        session.endurance_test_data && session.endurance_test_data.length > 0
      );
      
      setSessions(filteredData);
    } catch (error) {
      console.error('Error fetching MAS data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">MAS Tests</CardTitle>
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
          <CardTitle className="text-sm">MAS Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500 text-xs">Δεν υπάρχουν δεδομένα</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">MAS Tests</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2 overflow-x-auto">
        {sessions.map((session) => {
          const enduranceData = session.endurance_test_data[0];
          
          return (
            <div key={session.id} className="border border-gray-200 rounded-none p-2 space-y-1.5 min-w-[200px]">
              {/* Header με ημερομηνία και άσκηση */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-xs text-gray-500">
                    {format(new Date(session.test_date), 'dd/MM/yy')}
                  </span>
                  {enduranceData.exercises?.name && (
                    <span className="text-xs text-gray-600 truncate font-medium">
                      {enduranceData.exercises.name}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Μετρήσεις */}
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Απόσταση:</span>
                  <span className="font-semibold text-gray-900">{enduranceData.mas_meters}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Χρόνος:</span>
                  <span className="font-semibold text-gray-900">{enduranceData.mas_minutes}'</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">MAS:</span>
                  <span className="font-bold text-[#00ffba]">{enduranceData.mas_ms?.toFixed(2)} m/s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">MAS:</span>
                  <span className="font-bold text-[#00ffba]">{enduranceData.mas_kmh?.toFixed(2)} km/h</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};