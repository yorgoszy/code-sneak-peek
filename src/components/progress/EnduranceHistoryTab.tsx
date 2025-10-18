import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const EnduranceHistoryTab: React.FC = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const [sessionsRes, usersRes] = await Promise.all([
        supabase
          .from('endurance_test_sessions')
          .select(`
            id,
            user_id,
            test_date,
            notes,
            created_at,
            endurance_test_data!endurance_test_data_test_session_id_fkey (
              id,
              exercise_id,
              mas_meters,
              mas_minutes,
              mas_ms,
              mas_kmh,
              push_ups,
              pull_ups,
              farmer_kg,
              farmer_meters,
              farmer_seconds,
              sprint_seconds,
              sprint_meters,
              sprint_resistance,
              sprint_watt,
              vo2_max,
              max_hr,
              resting_hr_1min,
              exercises (
                id,
                name
              )
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('app_users')
          .select('id, name')
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (usersRes.error) throw usersRes.error;

      const map = new Map<string, string>();
      (usersRes.data || []).forEach(u => map.set(u.id, u.name));
      setUsersMap(map);

      const filteredData = (sessionsRes.data || []).filter(session => 
        session.endurance_test_data && session.endurance_test_data.length > 0
      );
      setSessions(filteredData);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την καταγραφή;')) {
      return;
    }

    try {
      // Delete endurance test data first (due to foreign key)
      const { error: dataError } = await supabase
        .from('endurance_test_data')
        .delete()
        .eq('test_session_id', sessionId);

      if (dataError) throw dataError;

      // Delete session
      const { error: sessionError } = await supabase
        .from('endurance_test_sessions')
        .delete()
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      toast({
        title: "Επιτυχία",
        description: "Η καταγραφή διαγράφηκε"
      });

      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία διαγραφής",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Φόρτωση...</div>;
  }

  if (sessions.length === 0) {
    return <div className="text-center py-8 text-gray-500">Δεν υπάρχουν καταγραφές MAS</div>;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {sessions.map((session) => {
        const enduranceData = session.endurance_test_data[0];
        
        return (
          <Card key={session.id} className="rounded-none min-w-[220px] shrink-0">
            <CardContent className="p-3">
              <div className="space-y-2">
                {/* Header με χρήστη, ημερομηνία, άσκηση */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 truncate">
                        {usersMap.get(session.user_id) || 'Άγνωστος'}
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(session.test_date), 'dd/MM/yy')}
                      </span>
                    </div>
                    {enduranceData.exercises?.name && (
                      <span className="text-xs text-gray-600 truncate">
                        {enduranceData.exercises.name}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteSession(session.id)}
                    className="rounded-none h-8 w-8 p-0 shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
                
                {/* Μετρήσεις */}
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {enduranceData.mas_meters && (
                    <>
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
                        <span className="font-bold text-[#cb8954]">{enduranceData.mas_ms?.toFixed(2)} m/s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">MAS:</span>
                        <span className="font-bold text-[#cb8954]">{enduranceData.mas_kmh?.toFixed(2)} km/h</span>
                      </div>
                    </>
                  )}
                  {enduranceData.push_ups !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Push Ups:</span>
                      <span className="font-bold text-[#cb8954]">{enduranceData.push_ups}</span>
                    </div>
                  )}
                  {enduranceData.pull_ups !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Pull Ups:</span>
                      <span className="font-bold text-[#cb8954]">{enduranceData.pull_ups}</span>
                    </div>
                  )}
                  {enduranceData.farmer_kg !== null && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Farmer kg:</span>
                        <span className="font-bold text-[#cb8954]">{enduranceData.farmer_kg}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Farmer m:</span>
                        <span className="font-bold text-[#cb8954]">{enduranceData.farmer_meters}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Farmer s:</span>
                        <span className="font-bold text-[#cb8954]">{enduranceData.farmer_seconds}</span>
                      </div>
                    </>
                  )}
                  {enduranceData.sprint_seconds !== null && (
                    <>
                      {enduranceData.exercises?.name && (
                        <div className="flex items-center justify-between col-span-2">
                          <span className="text-gray-500">Sprint Άσκηση:</span>
                          <span className="font-bold text-[#cb8954]">{enduranceData.exercises.name}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Sprint s:</span>
                        <span className="font-bold text-[#cb8954]">{enduranceData.sprint_seconds}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Sprint m:</span>
                        <span className="font-bold text-[#cb8954]">{enduranceData.sprint_meters}</span>
                      </div>
                      {enduranceData.sprint_watt !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Sprint km/h:</span>
                          <span className="font-bold text-[#cb8954]">{parseFloat(enduranceData.sprint_watt).toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                  {enduranceData.vo2_max !== null && (
                    <div className="flex items-center justify-between col-span-2">
                      <span className="text-gray-500">VO2 Max:</span>
                      <span className="font-bold text-[#cb8954]">{enduranceData.vo2_max}</span>
                    </div>
                  )}
                  {enduranceData.max_hr !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Max HR:</span>
                      <span className="font-bold text-red-500">{enduranceData.max_hr} bpm</span>
                    </div>
                  )}
                  {enduranceData.resting_hr_1min !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Resting HR:</span>
                      <span className="font-bold text-blue-500">{enduranceData.resting_hr_1min} bpm</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};