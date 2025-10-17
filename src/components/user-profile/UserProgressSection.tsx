import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadVelocityChart } from "@/components/charts/LoadVelocityChart";

interface UserProgressSectionProps {
  userId: string;
}

export const UserProgressSection: React.FC<UserProgressSectionProps> = ({ userId }) => {
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [rawHistoricalData, setRawHistoricalData] = useState<any[]>([]);
  const [exerciseSessions, setExerciseSessions] = useState<Record<string, any[]>>({});
  const [selectedSessions, setSelectedSessions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    if (userId && selectedExercises.length === 0) {
      fetchLatestExerciseForUser();
    }
  }, [userId, selectedExercises]);

  useEffect(() => {
    if (userId) {
      fetchHistoricalData();
    }
  }, [userId]);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchHistoricalData = async () => {
    try {
      const { data, error } = await supabase
        .from('strength_test_attempts')
        .select(`
          id,
          weight_kg,
          velocity_ms,
          exercise_id,
          test_session_id,
          strength_test_sessions!inner (
            user_id,
            test_date
          )
        `)
        .eq('strength_test_sessions.user_id', userId)
        .not('velocity_ms', 'is', null)
        .order('weight_kg', { ascending: false });

      if (error) throw error;

      setRawHistoricalData(data || []);

    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  // Δημιουργία chartData με useMemo που εξαρτάται από rawHistoricalData και exercises
  const historicalData = useMemo(() => {
    return rawHistoricalData.map(attempt => ({
      exerciseName: exercises.find(e => e.id === attempt.exercise_id)?.name || '',
      exerciseId: attempt.exercise_id,
      velocity: attempt.velocity_ms || 0,
      weight: attempt.weight_kg,
      date: attempt.strength_test_sessions.test_date,
      sessionId: attempt.test_session_id
    }));
  }, [rawHistoricalData, exercises]);

  // Ομαδοποίηση sessions και επιλογή default sessions
  useEffect(() => {
    if (historicalData.length === 0) return;

    const sessions: Record<string, any[]> = {};
    historicalData.forEach(item => {
      if (!sessions[item.exerciseId]) {
        sessions[item.exerciseId] = [];
      }
      const existingSession = sessions[item.exerciseId].find(s => s.sessionId === item.sessionId);
      if (!existingSession) {
        sessions[item.exerciseId].push({
          sessionId: item.sessionId,
          date: item.date
        });
      }
    });

    // Ταξινόμηση sessions ανά ημερομηνία (από νεότερο σε παλαιότερο)
    Object.keys(sessions).forEach(exerciseId => {
      sessions[exerciseId].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    setExerciseSessions(sessions);

    // Αρχικά επιλέγω το πιο πρόσφατο session για κάθε άσκηση
    const initialSelectedSessions: Record<string, string[]> = {};
    Object.keys(sessions).forEach(exerciseId => {
      if (sessions[exerciseId].length > 0) {
        initialSelectedSessions[exerciseId] = [sessions[exerciseId][0].sessionId];
      }
    });
    setSelectedSessions(initialSelectedSessions);
  }, [historicalData]);

  const fetchLatestExerciseForUser = async () => {
    try {
      const { data, error } = await supabase
        .from('strength_test_attempts')
        .select(`
          exercise_id,
          created_at,
          strength_test_sessions!inner (
            user_id
          )
        `)
        .eq('strength_test_sessions.user_id', userId)
        .not('velocity_ms', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Παίρνουμε όλες τις μοναδικές ασκήσεις που έχει κάνει ο χρήστης
      const uniqueExerciseIds = [...new Set((data || []).map((d: any) => d.exercise_id))];
      
      if (uniqueExerciseIds.length > 0) {
        setSelectedExercises(uniqueExerciseIds);
      } else if (exercises.length > 0) {
        setSelectedExercises([exercises[0].id]);
      }
    } catch (error) {
      console.error('Error fetching latest exercise for user:', error);
    }
  };

  const getExerciseColor = (name: string, index: number) => {
    const normalizedName = name.toLowerCase();
    
    if (normalizedName.includes('deadlift') || normalizedName.includes('dl')) {
      return '#ef4444'; // κόκκινο
    }
    if (normalizedName.includes('squat') || normalizedName.includes('sq')) {
      return '#3b82f6'; // μπλε
    }
    if (normalizedName.includes('bench press') || normalizedName.includes('bp')) {
      return '#eab308'; // κίτρινο
    }
    
    // Χρώματα για πολλαπλές ασκήσεις
    const colors = ['#00ffba', '#cb8954', '#ef4444', '#3b82f6', '#eab308', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
  };

  const toggleExercise = (exerciseId: string) => {
    setSelectedExercises(prev => {
      if (prev.includes(exerciseId)) {
        return prev.filter(id => id !== exerciseId);
      } else {
        return [...prev, exerciseId];
      }
    });
  };

  const selectAllExercises = () => {
    const userExerciseIds = [...new Set(historicalData.map(d => d.exerciseId))];
    setSelectedExercises(userExerciseIds);
  };

  const deselectAllExercises = () => {
    setSelectedExercises([]);
  };

  const toggleSession = (exerciseId: string, sessionId: string) => {
    setSelectedSessions(prev => {
      const current = prev[exerciseId] || [];
      if (current.includes(sessionId)) {
        return { ...prev, [exerciseId]: current.filter(id => id !== sessionId) };
      } else {
        return { ...prev, [exerciseId]: [...current, sessionId] };
      }
    });
  };

  const availableExercises = [...new Set(historicalData.map(d => d.exerciseId))];
  const filteredData = historicalData.filter(d => 
    selectedExercises.includes(d.exerciseId) && 
    selectedSessions[d.exerciseId]?.includes(d.sessionId)
  );

  return (
    <div className="space-y-6">
      {historicalData.length > 0 ? (
        <>
          {/* Φίλτρα Ασκήσεων - Compact */}
          <div className="bg-white border border-gray-200 rounded-none p-2 max-w-2xl">
            <div className="mb-1.5">
              <span className="text-[10px] font-medium text-gray-700">Επιλογή Ασκήσεων</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {availableExercises.map((exerciseId, index) => {
                const exercise = exercises.find(e => e.id === exerciseId);
                const isSelected = selectedExercises.includes(exerciseId);
                const exerciseColor = getExerciseColor(exercise?.name || '', index);
                const sessions = exerciseSessions[exerciseId] || [];
                
                return (
                  <div key={exerciseId} className="space-y-0.5">
                    <button
                      onClick={() => toggleExercise(exerciseId)}
                      className={`px-1.5 py-0.5 text-[10px] rounded-none transition-all w-full ${
                        isSelected
                          ? 'text-white font-medium'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 opacity-50'
                      }`}
                      style={isSelected ? { backgroundColor: exerciseColor } : {}}
                    >
                      {exercise?.name || 'Άγνωστη άσκηση'}
                    </button>
                    
                    {isSelected && sessions.length > 0 && (
                      <div className="ml-2 flex flex-wrap gap-0.5">
                        {sessions.map((session, sessionIndex) => {
                          const isSessionSelected = selectedSessions[exerciseId]?.includes(session.sessionId);
                          return (
                            <button
                              key={session.sessionId}
                              onClick={() => toggleSession(exerciseId, session.sessionId)}
                              className={`px-1 py-0.5 text-[9px] rounded-none transition-all ${
                                isSessionSelected
                                  ? 'bg-gray-700 text-white'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 opacity-50'
                              }`}
                            >
                              {sessionIndex + 1}η
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Γράφημα */}
          {filteredData.length > 0 ? (
            <LoadVelocityChart 
              data={filteredData}
              selectedExercises={selectedExercises.map(id => exercises.find(e => e.id === id)?.name || '')}
              exerciseSessions={exerciseSessions}
              selectedSessions={selectedSessions}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              Επιλέξτε τουλάχιστον μία άσκηση
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Δεν υπάρχουν δεδομένα προόδου
        </div>
      )}
    </div>
  );
};
