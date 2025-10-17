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
    <Card className="rounded-none max-w-2xl" style={{ width: 'calc(100% + 10px)' }}>
      <CardHeader className="p-[5px]">
        <CardTitle className="text-sm">MAS Tests</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2 overflow-x-auto pb-2 p-[5px]">
        {sessions.flatMap((session) => 
          session.endurance_test_data.map((enduranceData) => (
            <Card key={enduranceData.id} className="rounded-none min-w-[130px] shrink-0">
              <CardContent className="p-[3px]">
                <div className="space-y-1">
                  {/* Header με άσκηση και μέτρα/λεπτά */}
                  <div className="flex items-start justify-between">
                    {enduranceData.exercises?.name && (
                      <div className="text-sm font-semibold text-gray-900">
                        {enduranceData.exercises.name}
                      </div>
                    )}
                    <div className="flex flex-col text-xs text-gray-500 text-right">
                      <span>{enduranceData.mas_meters}m</span>
                      <span>{Math.floor(enduranceData.mas_minutes)}:{String(Math.round((enduranceData.mas_minutes % 1) * 60)).padStart(2, '0')}</span>
                    </div>
                  </div>
                  
                  {/* MAS */}
                  <div className="font-bold text-[#cb8954]">
                    {enduranceData.mas_ms?.toFixed(2)} m/s
                  </div>
                  
                  {/* Ημερομηνία κάτω αριστερά */}
                  <div className="text-xs text-gray-500">
                    {format(new Date(session.test_date), 'dd/MM/yy')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};