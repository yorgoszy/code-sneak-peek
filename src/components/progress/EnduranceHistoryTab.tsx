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
    <div className="space-y-4">
      {sessions.map((session) => {
        const enduranceData = session.endurance_test_data[0];
        
        return (
          <Card key={session.id} className="rounded-none">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900 truncate">
                      {usersMap.get(session.user_id) || 'Άγνωστος'}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {format(new Date(session.test_date), 'dd/MM/yy')}
                    </span>
                  </div>
                  {enduranceData.exercises && (
                    <span className="text-xs text-gray-600 truncate">
                      {enduranceData.exercises.name}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">MAS</div>
                    <div className="text-sm font-bold text-[#00ffba]">
                      {enduranceData.mas_ms?.toFixed(2)} <span className="text-xs">m/s</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">MAS</div>
                    <div className="text-sm font-bold text-[#00ffba]">
                      {enduranceData.mas_kmh?.toFixed(2)} <span className="text-xs">km/h</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteSession(session.id)}
                    className="rounded-none h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};