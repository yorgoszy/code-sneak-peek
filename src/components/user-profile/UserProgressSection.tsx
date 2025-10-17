import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadVelocityChart } from "@/components/charts/LoadVelocityChart";
import { MasProgressCard } from "./MasProgressCard";
import { MasTestSelector } from "./MasTestSelector";
import { TestBarChart } from "@/components/charts/TestBarChart";

interface UserProgressSectionProps {
  userId: string;
}

export const UserProgressSection: React.FC<UserProgressSectionProps> = ({ userId }) => {
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [rawHistoricalData, setRawHistoricalData] = useState<any[]>([]);
  const [exerciseSessions, setExerciseSessions] = useState<Record<string, any[]>>({});
  const [selectedSessions, setSelectedSessions] = useState<Record<string, string[]>>({});
  const [masData, setMasData] = useState<any[]>([]);
  const [masExercises, setMasExercises] = useState<any[]>([]);
  const [selectedMasExercises, setSelectedMasExercises] = useState<string[]>([]);
  const [selectedMasSessions, setSelectedMasSessions] = useState<Record<string, string[]>>({});

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
      fetchMasData();
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

  const fetchMasData = async () => {
    try {
      const { data, error } = await supabase
        .from('endurance_test_sessions')
        .select(`
          id,
          test_date,
          endurance_test_data!endurance_test_data_test_session_id_fkey (
            id,
            mas_meters,
            exercise_id,
            exercises (
              id,
              name
            )
          )
        `)
        .eq('user_id', userId)
        .order('test_date', { ascending: false });

      if (error) throw error;
      
      // Flatten all endurance data with their test dates
      const allData = (data || []).flatMap(session => 
        (session.endurance_test_data || []).map(ed => ({
          ...ed,
          test_date: session.test_date
        }))
      );
      
      // Group by exercise_id and get ALL records for each
      const exerciseMap = new Map();
      allData.forEach(item => {
        if (!item.exercise_id || !item.mas_meters) return;
        
        if (!exerciseMap.has(item.exercise_id)) {
          exerciseMap.set(item.exercise_id, []);
        }
        exerciseMap.get(item.exercise_id).push(item);
      });
      
      // For each exercise, sort and number the records
      const processedExercises: any[] = [];
      exerciseMap.forEach((items, exerciseId) => {
        const sorted = items.sort((a, b) => 
          new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
        );
        
        const sessions = sorted.map((item, index) => ({
          sessionId: item.id,
          date: item.test_date,
          mas_meters: item.mas_meters,
          recordNumber: index + 1,
          fullData: item
        }));
        
        processedExercises.push({
          id: exerciseId,
          name: sorted[0].exercises?.name || 'Άγνωστη',
          sessions: sessions
        });
      });
      
      setMasExercises(processedExercises);
      
      // Auto-select first exercise and its latest session
      if (processedExercises.length > 0) {
        const firstExercise = processedExercises[0];
        setSelectedMasExercises([firstExercise.id]);
        setSelectedMasSessions({
          [firstExercise.id]: [firstExercise.sessions[0].sessionId]
        });
      }
      
    } catch (error) {
      console.error('Error fetching MAS data:', error);
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

  // Υπολογισμός 1RM για κάθε επιλεγμένη άσκηση (τελευταία προσπάθεια από την τελευταία session)
  const exerciseOneRMs = useMemo(() => {
    const oneRMs: Record<string, { weight: number; velocity: number; date: string; percentageChange: number | null }> = {};
    
    selectedExercises.forEach(exerciseId => {
      const exerciseData = historicalData.filter(d => d.exerciseId === exerciseId);
      if (exerciseData.length === 0) return;
      
      // Βρίσκουμε τις μοναδικές sessions ταξινομημένες από νεότερη σε παλαιότερη
      const uniqueSessions = [...new Set(exerciseData.map(d => d.sessionId))]
        .map(sessionId => {
          const sessionData = exerciseData.find(d => d.sessionId === sessionId);
          return { sessionId, date: sessionData?.date || '' };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (uniqueSessions.length === 0) return;
      
      // Τελευταία session
      const latestSessionId = uniqueSessions[0].sessionId;
      const latestSessionAttempts = exerciseData.filter(d => d.sessionId === latestSessionId);
      const latestOneRM = latestSessionAttempts.reduce((max, current) => {
        return current.weight > max.weight ? current : max;
      });
      
      // Προηγούμενη session (αν υπάρχει)
      let percentageChange: number | null = null;
      if (uniqueSessions.length > 1) {
        const previousSessionId = uniqueSessions[1].sessionId;
        const previousSessionAttempts = exerciseData.filter(d => d.sessionId === previousSessionId);
        const previousOneRM = previousSessionAttempts.reduce((max, current) => {
          return current.weight > max.weight ? current : max;
        });
        
        if (previousOneRM.weight > 0) {
          percentageChange = ((latestOneRM.weight - previousOneRM.weight) / previousOneRM.weight) * 100;
        }
      }
      
      oneRMs[exerciseId] = {
        weight: latestOneRM.weight,
        velocity: latestOneRM.velocity,
        date: latestOneRM.date,
        percentageChange
      };
    });
    
    return oneRMs;
  }, [selectedExercises, historicalData]);

  return (
    <div className="space-y-0">
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

          {/* Progress Cards Container */}
          <div className="flex gap-0">
            {/* 1RM Display */}
            {selectedExercises.length > 0 && Object.keys(exerciseOneRMs).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-none p-2 max-w-2xl" style={{ paddingBottom: '8px', width: 'calc(100% + 10px)' }}>
                <div className="mb-1.5">
                  <span className="text-[10px] font-medium text-gray-700">1RM</span>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {selectedExercises.map((exerciseId, index) => {
                    const exercise = exercises.find(e => e.id === exerciseId);
                    const oneRM = exerciseOneRMs[exerciseId];
                    const exerciseColor = getExerciseColor(exercise?.name || '', index);
                    
                    if (!oneRM) return null;
                    
                    return (
                      <div 
                        key={exerciseId} 
                        className="border border-gray-200 rounded-none p-1.5"
                        style={{ borderLeftWidth: '3px', borderLeftColor: exerciseColor }}
                      >
                        <div className="text-[10px] text-gray-500 mb-1">{exercise?.name}</div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-bold" style={{ color: exerciseColor }}>
                            {oneRM.weight}<span className="text-[9px]">kg</span>
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {oneRM.velocity.toFixed(2)}
                          </span>
                          <span className="text-[9px] text-gray-400">m/s</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-[9px] text-gray-400">
                            {new Date(oneRM.date).toLocaleDateString('el-GR')}
                          </div>
                          {oneRM.percentageChange !== null && (
                            <div className={`text-[10px] font-medium ${oneRM.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {oneRM.percentageChange >= 0 ? '+' : ''}{oneRM.percentageChange.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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

          {/* MAS Test Selector */}
          {masExercises.length > 0 && (
            <MasTestSelector
              exercises={masExercises}
              selectedExercises={selectedMasExercises}
              selectedSessions={selectedMasSessions}
              onExerciseToggle={(exerciseId) => {
                setSelectedMasExercises(prev => 
                  prev.includes(exerciseId)
                    ? prev.filter(id => id !== exerciseId)
                    : [...prev, exerciseId]
                );
              }}
              onSessionToggle={(exerciseId, sessionId) => {
                setSelectedMasSessions(prev => {
                  const current = prev[exerciseId] || [];
                  const updated = current.includes(sessionId)
                    ? current.filter(id => id !== sessionId)
                    : [...current, sessionId];
                  return { ...prev, [exerciseId]: updated };
                });
              }}
            />
          )}

          {/* MAS Card */}
          <MasProgressCard userId={userId} />

          {/* MAS Bar Chart */}
          {selectedMasExercises.length > 0 && (
            <div className="max-w-2xl" style={{ width: 'calc(100% + 10px)' }}>
              <TestBarChart
                data={masExercises
                  .filter(ex => selectedMasExercises.includes(ex.id))
                  .flatMap(exercise => {
                    const exerciseSessions = selectedMasSessions[exercise.id] || [];
                    return exercise.sessions
                      .filter(session => exerciseSessions.includes(session.sessionId))
                      .map(session => {
                        const exerciseName = exercise.name.toLowerCase();
                        let barColor = '#00ffba';
                        
                        if (exerciseName.includes('skierg')) {
                          barColor = '#ff8c42';
                        } else if (exerciseName.includes('rowerg') || exerciseName.includes('row erg')) {
                          barColor = '#9b59b6';
                        } else if (exerciseName.includes('bikeerg') || exerciseName.includes('bike erg')) {
                          barColor = '#3498db';
                        } else if (exerciseName.includes('woodway')) {
                          barColor = '#ff69b4';
                        } else if (exerciseName.includes('track')) {
                          barColor = '#90ee90';
                        }
                        
                        // Opacity based on record number (1st = full, 2nd = 0.7, 3rd = 0.5, etc)
                        const opacity = Math.max(0.3, 1 - (session.recordNumber - 1) * 0.15);
                        
                        return {
                          name: `${exercise.name} (${session.recordNumber}η)`,
                          value: session.mas_meters || 0,
                          unit: 'm',
                          color: barColor,
                          opacity: opacity
                        };
                      });
                  })
                }
                title="MAS Tests - Μέτρα ανά Άσκηση"
                color="#00ffba"
              />
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
