import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export const HistoryTab: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('strength_test_sessions')
        .select(`
          id,
          test_date,
          notes,
          created_at,
          app_users!strength_test_sessions_user_id_fkey (
            id,
            name
          ),
          strength_test_attempts (
            id,
            weight_kg,
            velocity_ms,
            attempt_number,
            exercises (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Φόρτωση...</div>;
  }

  if (sessions.length === 0) {
    return <div className="text-center py-8 text-gray-500">Δεν υπάρχουν καταγραφές</div>;
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        // Group attempts by exercise
        const attemptsByExercise = session.strength_test_attempts.reduce((acc: any, attempt: any) => {
          const exerciseId = attempt.exercises?.id;
          if (!acc[exerciseId]) {
            acc[exerciseId] = {
              exerciseName: attempt.exercises?.name || 'Άγνωστη Άσκηση',
              attempts: []
            };
          }
          acc[exerciseId].attempts.push(attempt);
          return acc;
        }, {});

        return (
          <Card key={session.id} className="rounded-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {session.app_users?.name || 'Άγνωστος Χρήστης'}
                </CardTitle>
                <span className="text-sm text-gray-500">
                  {format(new Date(session.test_date), 'dd MMM yyyy', { locale: el })}
                </span>
              </div>
              {session.notes && (
                <p className="text-sm text-gray-600 mt-1">{session.notes}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.values(attemptsByExercise).map((exerciseData: any, idx: number) => (
                  <div key={idx} className="border-t pt-3">
                    <h4 className="text-sm font-semibold mb-2">{exerciseData.exerciseName}</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {exerciseData.attempts
                        .sort((a: any, b: any) => a.attempt_number - b.attempt_number)
                        .map((attempt: any) => (
                          <div key={attempt.id} className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded-none">
                            <span className="font-medium w-16">#{attempt.attempt_number}</span>
                            <span className="w-20">{attempt.weight_kg} kg</span>
                            <span className="w-20">{attempt.velocity_ms} m/s</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
