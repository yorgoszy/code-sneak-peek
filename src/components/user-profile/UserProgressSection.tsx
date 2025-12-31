import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadVelocityChart } from "@/components/charts/LoadVelocityChart";
import { MasProgressCard } from "./MasProgressCard";
import { BodyweightProgressCard } from "./BodyweightProgressCard";
import { FarmerProgressCard } from "./FarmerProgressCard";
import { SprintProgressCard } from "./SprintProgressCard";
import { CardiacProgressCard } from "./CardiacProgressCard";
import { VO2MaxProgressCard } from "./VO2MaxProgressCard";
import { JumpProfileLatestCard } from "./JumpProfileLatestCard";
import { AnthropometricProgressCard } from "./AnthropometricProgressCard";
import { BodyMapCard } from "./BodyMapCard";
import { useTranslation } from 'react-i18next';

interface UserProgressSectionProps {
  userId: string;
  useCoachTables?: boolean;
  coachId?: string;
}

export const UserProgressSection: React.FC<UserProgressSectionProps> = ({ 
  userId, 
  useCoachTables = false,
  coachId 
}) => {
  const { t } = useTranslation();
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [rawHistoricalData, setRawHistoricalData] = useState<any[]>([]);
  const [exerciseSessions, setExerciseSessions] = useState<Record<string, any[]>>({});
  const [selectedSessions, setSelectedSessions] = useState<Record<string, string[]>>({});
  const [hasFunctionalTest, setHasFunctionalTest] = useState(false);

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
  }, [userId, useCoachTables, coachId]);

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

  const checkFunctionalTest = useCallback(async () => {
    if (!userId) return;
    
    try {
      let data, error;
      
      if (useCoachTables && coachId) {
        const result = await supabase
          .from('coach_functional_test_sessions')
          .select('id')
          .eq('coach_id', coachId)
          .eq('user_id', userId)
          .limit(1);
        data = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from('functional_test_sessions')
          .select('id')
          .eq('user_id', userId)
          .limit(1);
        data = result.data;
        error = result.error;
      }

      if (!error && data && data.length > 0) {
        setHasFunctionalTest(true);
      } else {
        setHasFunctionalTest(false);
      }
    } catch (error) {
      console.error('Error checking functional test:', error);
      setHasFunctionalTest(false);
    }
  }, [userId, useCoachTables, coachId]);

  useEffect(() => {
    if (userId) {
      checkFunctionalTest();
    }
  }, [userId, checkFunctionalTest]);


  const fetchHistoricalData = async () => {
    try {
      let data, error;
      
      if (useCoachTables && coachId) {
        // Fetch from coach tables
        const result = await supabase
          .from('coach_strength_test_sessions')
          .select(`
            id,
            test_date,
            coach_strength_test_data (
              id,
              weight_kg,
              velocity_ms,
              exercise_id
            )
          `)
          .eq('coach_id', coachId)
          .eq('user_id', userId)
          .order('test_date', { ascending: false })
          .order('created_at', { ascending: false });
        
        if (result.error) throw result.error;
        
        // Transform coach data to match regular format
        const transformedData: any[] = [];
        (result.data || []).forEach((session: any) => {
          (session.coach_strength_test_data || []).forEach((attempt: any) => {
            if (attempt.velocity_ms) {
              transformedData.push({
                id: attempt.id,
                weight_kg: attempt.weight_kg,
                velocity_ms: attempt.velocity_ms,
                exercise_id: attempt.exercise_id,
                test_session_id: session.id,
                strength_test_sessions: {
                  user_id: userId,
                  test_date: session.test_date
                }
              });
            }
          });
        });
        data = transformedData;
      } else {
        const result = await supabase
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
        
        if (result.error) throw result.error;
        data = result.data;
      }

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

    // Ταξινόμηση sessions ανά ημερομηνία και sessionId (από νεότερο σε παλαιότερο)
    Object.keys(sessions).forEach(exerciseId => {
      sessions[exerciseId].sort((a, b) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        // If same date, sort by sessionId (more recent session IDs are larger)
        return (b.sessionId || '').localeCompare(a.sessionId || '');
      });
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
      let uniqueExerciseIds: string[] = [];
      
      if (useCoachTables && coachId) {
        // For coach tables, use the already fetched rawHistoricalData
        uniqueExerciseIds = [...new Set(rawHistoricalData.map((d: any) => d.exercise_id))];
      } else {
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
        uniqueExerciseIds = [...new Set((data || []).map((d: any) => d.exercise_id))];
      }
      
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

  // Υπολογισμός 1RM για κάθε επιλεγμένη άσκηση με ιστορικό
  const exerciseOneRMs = useMemo(() => {
    const oneRMs: Record<string, { 
      weight: number; 
      velocity: number; 
      date: string; 
      percentageChange: number | null;
      history: Array<{ weight: number; velocity: number; date: string }>;
    }> = {};
    
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
      
      // Ιστορικό (μέχρι 3 προηγούμενες sessions)
      const history: Array<{ weight: number; velocity: number; date: string }> = [];
      for (let i = 1; i < Math.min(uniqueSessions.length, 4); i++) {
        const sessionId = uniqueSessions[i].sessionId;
        const sessionAttempts = exerciseData.filter(d => d.sessionId === sessionId);
        const sessionOneRM = sessionAttempts.reduce((max, current) => {
          return current.weight > max.weight ? current : max;
        });
        history.push({
          weight: sessionOneRM.weight,
          velocity: sessionOneRM.velocity,
          date: sessionOneRM.date
        });
      }
      
      oneRMs[exerciseId] = {
        weight: latestOneRM.weight,
        velocity: latestOneRM.velocity,
        date: latestOneRM.date,
        percentageChange,
        history
      };
    });
    
    return oneRMs;
  }, [selectedExercises, historicalData]);

  return (
    <div className="space-y-2 sm:space-y-0 px-2 sm:px-0">
      {/* Anthropometric Card - always visible at the top */}
      <div className="mb-2 sm:mb-0">
        <AnthropometricProgressCard userId={userId} useCoachTables={useCoachTables} coachId={coachId} />
      </div>

      {/* Body Map - only show if user has functional test */}
      {hasFunctionalTest && (
        <div className="mb-2 sm:mb-0">
          <BodyMapCard userId={userId} useCoachTables={useCoachTables} coachId={coachId} />
        </div>
      )}

      {historicalData.length > 0 ? (
        <>
          {/* Φίλτρα Ασκήσεων - Responsive */}
          <div className="bg-white border border-gray-200 rounded-none p-3 sm:p-2 w-full sm:max-w-2xl">
            <div className="mb-2 sm:mb-1.5">
              <span className="text-xs sm:text-[10px] font-medium text-gray-700">{t('progress.selectExercises')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-2">
              {availableExercises.map((exerciseId, index) => {
                const exercise = exercises.find(e => e.id === exerciseId);
                const isSelected = selectedExercises.includes(exerciseId);
                const exerciseColor = getExerciseColor(exercise?.name || '', index);
                const sessions = exerciseSessions[exerciseId] || [];
                
                return (
                  <div key={exerciseId} className="space-y-1 sm:space-y-0.5">
                    <button
                      onClick={() => toggleExercise(exerciseId)}
                      className={`px-3 py-2 sm:px-1.5 sm:py-0.5 text-sm sm:text-[10px] rounded-none transition-all w-full ${
                        isSelected
                          ? 'text-white font-medium'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 opacity-50'
                      }`}
                      style={isSelected ? { backgroundColor: exerciseColor } : {}}
                    >
                      {exercise?.name || t('progress.unknownExercise')}
                    </button>
                    
                    {isSelected && sessions.length > 0 && (
                      <div className="ml-2 flex flex-wrap gap-1 sm:gap-0.5">
                        {sessions.map((session, sessionIndex) => {
                          const isSessionSelected = selectedSessions[exerciseId]?.includes(session.sessionId);
                          return (
                            <button
                              key={session.sessionId}
                              onClick={() => toggleSession(exerciseId, session.sessionId)}
                              className={`px-2 py-1 sm:px-1 sm:py-0.5 text-xs sm:text-[9px] rounded-none transition-all ${
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

          {/* Progress Cards Container - Responsive */}
          <div className="flex gap-0 w-full">
            {/* 1RM Display - Responsive */}
            {selectedExercises.length > 0 && Object.keys(exerciseOneRMs).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-none p-3 sm:p-2 w-full sm:max-w-2xl" style={{ paddingBottom: '12px', width: 'calc(100% + 10px)' }}>
                <div className="mb-2 sm:mb-1.5">
                  <span className="text-xs sm:text-[10px] font-medium text-gray-700">1RM</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-2">
                  {selectedExercises.map((exerciseId, index) => {
                    const exercise = exercises.find(e => e.id === exerciseId);
                    const oneRM = exerciseOneRMs[exerciseId];
                    const exerciseColor = getExerciseColor(exercise?.name || '', index);
                    
                    if (!oneRM) return null;
                    
                    return (
                      <div 
                        key={exerciseId} 
                        className="border border-gray-200 rounded-none p-2 sm:p-1.5"
                        style={{ borderLeftWidth: '3px', borderLeftColor: exerciseColor }}
                      >
                        <div className="text-xs sm:text-[10px] text-gray-500 mb-1.5 sm:mb-1 truncate" title={exercise?.name}>
                          {exercise?.name}
                        </div>
                        <div className="flex items-baseline gap-2 sm:gap-1.5">
                          <span className="text-lg sm:text-base font-bold" style={{ color: exerciseColor }}>
                            {oneRM.weight}<span className="text-xs sm:text-[9px]">kg</span>
                          </span>
                          <span className="text-xs sm:text-[10px] text-gray-400">
                            {oneRM.velocity.toFixed(2)}
                          </span>
                          <span className="text-xs sm:text-[9px] text-gray-400">m/s</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5 sm:mt-1">
                          <div className="text-xs sm:text-[9px] text-gray-400">
                            {new Date(oneRM.date).toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </div>
                          {oneRM.percentageChange !== null && (
                            <div className={`text-xs sm:text-[10px] font-medium ${oneRM.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {oneRM.percentageChange >= 0 ? '+' : ''}{oneRM.percentageChange.toFixed(1)}%
                            </div>
                          )}
                        </div>
                        
                        {/* History section - similar to Cardiac Data card */}
                        {oneRM.history && oneRM.history.length > 0 && (
                          <div className="space-y-0.5 pt-1.5 sm:pt-1 border-t border-gray-200 mt-1.5 sm:mt-1">
                            <div className="text-xs sm:text-[9px] text-gray-500 font-medium">{t('progress.history')}</div>
                            <div className="flex items-center justify-between text-xs sm:text-[9px] text-gray-400">
                              <span>{new Date(oneRM.history[0].date).toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                              <span>{oneRM.history[0].weight}kg @ {oneRM.history[0].velocity.toFixed(2)}m/s</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Γράφημα - Responsive */}
          {filteredData.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <LoadVelocityChart 
                data={filteredData}
                selectedExercises={selectedExercises.map(id => exercises.find(e => e.id === id)?.name || '')}
                exerciseSessions={exerciseSessions}
                selectedSessions={selectedSessions}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-sm sm:text-base text-gray-500">
              {t('progress.selectAtLeastOne')}
            </div>
          )}

          {/* MAS Card - Responsive */}
          <div className="w-full">
            <MasProgressCard userId={userId} useCoachTables={useCoachTables} coachId={coachId} />
          </div>
          
          {/* Bodyweight, Farmer - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
            <BodyweightProgressCard userId={userId} useCoachTables={useCoachTables} coachId={coachId} />
            <FarmerProgressCard userId={userId} useCoachTables={useCoachTables} coachId={coachId} />
          </div>

          {/* Sprint Track & Woodway - Side by Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
            <SprintProgressCard userId={userId} exerciseName="Track" useCoachTables={useCoachTables} coachId={coachId} />
            <SprintProgressCard userId={userId} exerciseName="Woodway" useCoachTables={useCoachTables} coachId={coachId} />
          </div>

          {/* VO2 Max and Cardiac Cards - Side by Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
            <VO2MaxProgressCard userId={userId} useCoachTables={useCoachTables} coachId={coachId} />
            <CardiacProgressCard userId={userId} useCoachTables={useCoachTables} coachId={coachId} />
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-sm sm:text-base text-gray-500">
          {t('progress.noProgressData')}
        </div>
      )}

      {/* Jump Progress - Compact Grid to match Anthropometric width */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 w-full max-w-2xl mt-2">
        <JumpProfileLatestCard userId={userId} useCoachTables={useCoachTables} coachId={coachId} />
      </div>
    </div>
  );
};
