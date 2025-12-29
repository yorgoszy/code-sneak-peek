import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CombinedLoadVelocityChart } from "@/components/charts/CombinedLoadVelocityChart";
import { format } from "date-fns";

interface CoachUserProgressSectionProps {
  coachUserId: string;
  coachId: string;
}

export const CoachUserProgressSection: React.FC<CoachUserProgressSectionProps> = ({ coachUserId, coachId }) => {
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [rawHistoricalData, setRawHistoricalData] = useState<any[]>([]);
  const [exerciseSessions, setExerciseSessions] = useState<Record<string, any[]>>({});
  const [selectedSessions, setSelectedSessions] = useState<Record<string, string[]>>({});

  // Endurance data
  const [enduranceData, setEnduranceData] = useState<any[]>([]);
  // Jump data
  const [jumpData, setJumpData] = useState<any[]>([]);
  // Anthropometric data
  const [anthropometricData, setAnthropometricData] = useState<any[]>([]);

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    if (coachUserId && coachId) {
      fetchAllData();
    }
  }, [coachUserId, coachId]);

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

  const fetchAllData = async () => {
    if (!coachUserId || !coachId) return;

    try {
      // Fetch strength data
      const { data: strengthSessions } = await supabase
        .from('coach_strength_test_sessions')
        .select(`
          id, test_date, coach_user_id,
          coach_strength_test_data (id, exercise_id, weight_kg, velocity_ms, is_1rm)
        `)
        .eq('coach_id', coachId)
        .eq('coach_user_id', coachUserId)
        .order('test_date', { ascending: false });

      if (strengthSessions) {
        const transformedData: any[] = [];
        strengthSessions.forEach(session => {
          const testData = session.coach_strength_test_data || [];
          testData.forEach((d: any) => {
            if (d.exercise_id && d.weight_kg && d.velocity_ms) {
              transformedData.push({
                exercise_id: d.exercise_id,
                weight_kg: d.weight_kg,
                velocity_ms: d.velocity_ms,
                is_1rm: d.is_1rm,
                test_date: session.test_date,
                session_id: session.id
              });
            }
          });
        });
        setRawHistoricalData(transformedData);

        // Auto-select the first exercise with data
        if (selectedExercises.length === 0 && transformedData.length > 0) {
          const firstExerciseId = transformedData[0].exercise_id;
          setSelectedExercises([firstExerciseId]);
        }
      }

      // Fetch endurance data
      const { data: enduranceSessions } = await supabase
        .from('coach_endurance_test_sessions')
        .select(`
          id, test_date,
          coach_endurance_test_data (*)
        `)
        .eq('coach_id', coachId)
        .eq('coach_user_id', coachUserId)
        .order('test_date', { ascending: false });

      if (enduranceSessions) {
        const enduranceResults = enduranceSessions.flatMap(session => 
          (session.coach_endurance_test_data || []).map((d: any) => ({
            ...d,
            test_date: session.test_date
          }))
        );
        setEnduranceData(enduranceResults);
      }

      // Fetch jump data
      const { data: jumpSessions } = await supabase
        .from('coach_jump_test_sessions')
        .select(`
          id, test_date,
          coach_jump_test_data (*)
        `)
        .eq('coach_id', coachId)
        .eq('coach_user_id', coachUserId)
        .order('test_date', { ascending: false });

      if (jumpSessions) {
        const jumpResults = jumpSessions.flatMap(session => 
          (session.coach_jump_test_data || []).map((d: any) => ({
            ...d,
            test_date: session.test_date
          }))
        );
        setJumpData(jumpResults);
      }

      // Fetch anthropometric data
      const { data: anthropometricSessions } = await supabase
        .from('coach_anthropometric_test_sessions')
        .select(`
          id, test_date,
          coach_anthropometric_test_data (*)
        `)
        .eq('coach_id', coachId)
        .eq('coach_user_id', coachUserId)
        .order('test_date', { ascending: false });

      if (anthropometricSessions) {
        const anthropometricResults = anthropometricSessions.flatMap(session => 
          (session.coach_anthropometric_test_data || []).map((d: any) => ({
            ...d,
            test_date: session.test_date
          }))
        );
        setAnthropometricData(anthropometricResults);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Group data by exercise
  const groupedByExercise = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    rawHistoricalData.forEach(item => {
      if (!grouped[item.exercise_id]) {
        grouped[item.exercise_id] = [];
      }
      grouped[item.exercise_id].push(item);
    });
    return grouped;
  }, [rawHistoricalData]);

  // Build sessions for each exercise
  useEffect(() => {
    const sessionsMap: Record<string, any[]> = {};
    
    Object.entries(groupedByExercise).forEach(([exerciseId, dataPoints]) => {
      const sessionsByDate: Record<string, any> = {};
      dataPoints.forEach(point => {
        const key = `${point.test_date}_${point.session_id}`;
        if (!sessionsByDate[key]) {
          sessionsByDate[key] = {
            id: point.session_id,
            test_date: point.test_date,
            label: format(new Date(point.test_date), 'dd/MM/yyyy')
          };
        }
      });
      sessionsMap[exerciseId] = Object.values(sessionsByDate).sort(
        (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
      );
    });
    
    setExerciseSessions(sessionsMap);
  }, [groupedByExercise]);

  // Initialize selected sessions
  useEffect(() => {
    const newSelected: Record<string, string[]> = {};
    
    selectedExercises.forEach(exerciseId => {
      if (!selectedSessions[exerciseId] && exerciseSessions[exerciseId]?.length > 0) {
        // Select the 3 most recent sessions by default
        newSelected[exerciseId] = exerciseSessions[exerciseId]
          .slice(0, 3)
          .map(s => s.id);
      }
    });
    
    if (Object.keys(newSelected).length > 0) {
      setSelectedSessions(prev => ({ ...prev, ...newSelected }));
    }
  }, [selectedExercises, exerciseSessions]);

  const exerciseChartData = useMemo(() => {
    const result: Record<string, any[]> = {};
    
    selectedExercises.forEach(exerciseId => {
      const exerciseData = groupedByExercise[exerciseId] || [];
      const selectedSessionIds = selectedSessions[exerciseId] || [];
      
      result[exerciseId] = exerciseData
        .filter(d => selectedSessionIds.includes(d.session_id))
        .map(d => ({
          weight_kg: d.weight_kg,
          velocity_ms: d.velocity_ms,
          is_1rm: d.is_1rm,
          sessionLabel: format(new Date(d.test_date), 'dd/MM/yyyy')
        }))
        .sort((a, b) => b.weight_kg - a.weight_kg);
    });
    
    return result;
  }, [groupedByExercise, selectedExercises, selectedSessions]);

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExercises(prev => {
      if (prev.includes(exerciseId)) {
        return prev.filter(id => id !== exerciseId);
      }
      return [...prev, exerciseId];
    });
  };

  const toggleSessionSelection = (exerciseId: string, sessionId: string) => {
    setSelectedSessions(prev => {
      const current = prev[exerciseId] || [];
      if (current.includes(sessionId)) {
        return { ...prev, [exerciseId]: current.filter(id => id !== sessionId) };
      }
      return { ...prev, [exerciseId]: [...current, sessionId] };
    });
  };

  const getExerciseName = (id: string) => {
    return exercises.find(e => e.id === id)?.name || 'Άγνωστη';
  };

  // Get latest values for progress cards
  const latestEndurance = enduranceData[0];
  const latestJump = jumpData[0];
  const latestAnthropometric = anthropometricData[0];

  return (
    <div className="space-y-6">
      {/* Strength Section */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Δύναμη - Load-Velocity Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Exercise Selection */}
          <div className="space-y-2">
            <Label>Επιλέξτε Άσκηση</Label>
            <Select
              value={selectedExercises[0] || ''}
              onValueChange={(value) => {
                if (value) {
                  setSelectedExercises([value]);
                }
              }}
            >
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επιλέξτε άσκηση..." />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(groupedByExercise).map(exerciseId => (
                  <SelectItem key={exerciseId} value={exerciseId}>
                    {getExerciseName(exerciseId)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Charts per selected exercise */}
          {selectedExercises.map(exerciseId => {
            const sessions = exerciseSessions[exerciseId] || [];
            const selected = selectedSessions[exerciseId] || [];
            const chartData = exerciseChartData[exerciseId] || [];

            return (
              <div key={exerciseId} className="space-y-3 border border-border p-4 rounded-none">
                <h4 className="font-medium">{getExerciseName(exerciseId)}</h4>
                
                {sessions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {sessions.map(session => (
                      <button
                        key={session.id}
                        onClick={() => toggleSessionSelection(exerciseId, session.id)}
                        className={`px-2 py-1 text-xs rounded-none border transition-colors ${
                          selected.includes(session.id)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:bg-muted'
                        }`}
                      >
                        {session.label}
                      </button>
                    ))}
                  </div>
                )}

                {chartData.length > 0 ? (
                  <CombinedLoadVelocityChart data={chartData.map(d => ({
                    exerciseName: getExerciseName(exerciseId),
                    weight: d.weight_kg,
                    velocity: d.velocity_ms,
                    date: d.sessionLabel
                  }))} />
                ) : (
                  <p className="text-muted-foreground text-sm">Δεν υπάρχουν δεδομένα</p>
                )}
              </div>
            );
          })}

          {Object.keys(groupedByExercise).length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Δεν υπάρχουν δεδομένα δύναμης
            </p>
          )}
        </CardContent>
      </Card>

      {/* Endurance Section */}
      {enduranceData.length > 0 && (
        <Card className="rounded-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Αντοχή
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {latestEndurance?.vo2_max && (
                <div className="p-3 border border-border rounded-none">
                  <p className="text-sm text-muted-foreground">VO2 Max</p>
                  <p className="text-xl font-bold">{latestEndurance.vo2_max}</p>
                </div>
              )}
              {latestEndurance?.max_hr && (
                <div className="p-3 border border-border rounded-none">
                  <p className="text-sm text-muted-foreground">Max HR</p>
                  <p className="text-xl font-bold">{latestEndurance.max_hr}</p>
                </div>
              )}
              {latestEndurance?.mas_kmh && (
                <div className="p-3 border border-border rounded-none">
                  <p className="text-sm text-muted-foreground">MAS (km/h)</p>
                  <p className="text-xl font-bold">{latestEndurance.mas_kmh}</p>
                </div>
              )}
              {latestEndurance?.push_ups && (
                <div className="p-3 border border-border rounded-none">
                  <p className="text-sm text-muted-foreground">Push-ups</p>
                  <p className="text-xl font-bold">{latestEndurance.push_ups}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jump Section */}
      {jumpData.length > 0 && (
        <Card className="rounded-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Άλματα
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {latestJump?.counter_movement_jump && (
                <div className="p-3 border border-border rounded-none">
                  <p className="text-sm text-muted-foreground">CMJ</p>
                  <p className="text-xl font-bold">{latestJump.counter_movement_jump} cm</p>
                </div>
              )}
              {latestJump?.non_counter_movement_jump && (
                <div className="p-3 border border-border rounded-none">
                  <p className="text-sm text-muted-foreground">SJ</p>
                  <p className="text-xl font-bold">{latestJump.non_counter_movement_jump} cm</p>
                </div>
              )}
              {latestJump?.broad_jump && (
                <div className="p-3 border border-border rounded-none">
                  <p className="text-sm text-muted-foreground">Broad Jump</p>
                  <p className="text-xl font-bold">{latestJump.broad_jump} cm</p>
                </div>
              )}
              {latestJump?.depth_jump && (
                <div className="p-3 border border-border rounded-none">
                  <p className="text-sm text-muted-foreground">Depth Jump</p>
                  <p className="text-xl font-bold">{latestJump.depth_jump} cm</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anthropometric Section */}
      {anthropometricData.length > 0 && (
        <Card className="rounded-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ανθρωπομετρικά
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {latestAnthropometric?.weight && (
                <div className="p-3 border border-border rounded-none">
                  <p className="text-sm text-muted-foreground">Βάρος</p>
                  <p className="text-xl font-bold">{latestAnthropometric.weight} kg</p>
                </div>
              )}
              {latestAnthropometric?.height && (
                <div className="p-3 border border-border rounded-none">
                  <p className="text-sm text-muted-foreground">Ύψος</p>
                  <p className="text-xl font-bold">{latestAnthropometric.height} cm</p>
                </div>
              )}
              {latestAnthropometric?.body_fat_percentage && (
                <div className="p-3 border border-border rounded-none">
                  <p className="text-sm text-muted-foreground">Body Fat %</p>
                  <p className="text-xl font-bold">{latestAnthropometric.body_fat_percentage}%</p>
                </div>
              )}
              {latestAnthropometric?.muscle_mass_percentage && (
                <div className="p-3 border border-border rounded-none">
                  <p className="text-sm text-muted-foreground">Muscle Mass %</p>
                  <p className="text-xl font-bold">{latestAnthropometric.muscle_mass_percentage}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No data message */}
      {Object.keys(groupedByExercise).length === 0 && 
       enduranceData.length === 0 && 
       jumpData.length === 0 && 
       anthropometricData.length === 0 && (
        <Card className="rounded-none">
          <CardContent className="text-center py-8 text-muted-foreground">
            Δεν υπάρχουν δεδομένα προόδου για αυτόν τον αθλητή
          </CardContent>
        </Card>
      )}
    </div>
  );
};
