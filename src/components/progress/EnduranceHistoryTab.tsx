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
              mas_meters,
              mas_minutes,
              mas_ms,
              mas_kmh
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
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <CardTitle className="text-base whitespace-nowrap">
                  {usersMap.get(session.user_id) || 'Άγνωστος Χρήστης'}
                </CardTitle>
                <span className="text-sm text-gray-500">
                  {format(new Date(session.test_date), 'dd MMM yyyy', { locale: el })}
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteSession(session.id)}
                  className="rounded-none ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="border border-gray-200 rounded-none p-3">
                  <div className="text-xs text-gray-500 mb-1">Απόσταση</div>
                  <div className="text-lg font-bold text-gray-900">
                    {enduranceData.mas_meters} <span className="text-xs text-gray-500">m</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-none p-3">
                  <div className="text-xs text-gray-500 mb-1">Διάρκεια</div>
                  <div className="text-lg font-bold text-gray-900">
                    {enduranceData.mas_minutes} <span className="text-xs text-gray-500">min</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-none p-3">
                  <div className="text-xs text-gray-500 mb-1">MAS</div>
                  <div className="text-lg font-bold text-[#00ffba]">
                    {enduranceData.mas_ms?.toFixed(2)} <span className="text-xs text-gray-500">m/s</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-none p-3">
                  <div className="text-xs text-gray-500 mb-1">MAS</div>
                  <div className="text-lg font-bold text-[#00ffba]">
                    {enduranceData.mas_kmh?.toFixed(2)} <span className="text-xs text-gray-500">km/h</span>
                  </div>
                </div>
              </div>

              {session.notes && (
                <div className="mt-3 text-sm text-gray-600">
                  <span className="font-medium">Σημειώσεις:</span> {session.notes}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};