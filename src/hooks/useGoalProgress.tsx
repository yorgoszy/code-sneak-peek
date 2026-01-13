import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GoalProgressData {
  currentValue: number;
  targetValue: number;
  startValue: number;
  unit: string;
  isPositive: boolean;
  details?: string;
}

export interface TestData {
  date: string;
  value: number;
  details?: Record<string, any>;
}

export const useGoalProgress = (
  userId: string | undefined,
  goalType: string,
  startDate: string,
  targetDate: string | null,
  metadata?: any,
  coachId?: string
) => {
  const [progress, setProgress] = useState<GoalProgressData | null>(null);
  const [startTest, setStartTest] = useState<TestData | null>(null);
  const [currentTest, setCurrentTest] = useState<TestData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const useCoachTables = !!coachId;

  const fetchAnthropometricData = useCallback(async () => {
    if (!userId) return null;

    const sessionsTable = useCoachTables ? 'coach_anthropometric_test_sessions' : 'anthropometric_test_sessions';
    const dataTable = useCoachTables ? 'coach_anthropometric_test_data' : 'anthropometric_test_data';

    const { data: sessions } = await supabase
      .from(sessionsTable)
      .select('id, test_date')
      .eq('user_id', userId)
      .order('test_date', { ascending: true });

    if (!sessions || sessions.length === 0) return null;

    const testData: TestData[] = [];
    for (const session of sessions) {
      const { data } = await supabase
        .from(dataTable)
        .select('weight, body_fat_percentage, muscle_mass_percentage, bone_density, visceral_fat_percentage')
        .eq('test_session_id', session.id)
        .single();

      if (data) {
        testData.push({
          date: session.test_date,
          value: data.weight || 0,
          details: data
        });
      }
    }

    return testData;
  }, [userId, useCoachTables]);

  const fetchStrengthData = useCallback(async () => {
    if (!userId) return null;

    const sessionsTable = useCoachTables ? 'coach_strength_test_sessions' : 'strength_test_sessions';
    const dataTable = useCoachTables ? 'coach_strength_test_data' : 'strength_test_attempts';

    const strengthExerciseId = metadata?.exercise_id as string | undefined;

    const { data: sessions } = await supabase
      .from(sessionsTable)
      .select('id, test_date')
      .eq('user_id', userId)
      .order('test_date', { ascending: true });

    if (!sessions || sessions.length === 0) return null;

    const testData: TestData[] = [];
    for (const session of sessions) {
      let query = supabase
        .from(dataTable)
        .select(useCoachTables ? 'weight_kg, velocity_ms, is_1rm' : 'weight_kg, is_1rm, exercise_id')
        .eq('test_session_id', session.id)
        .eq('is_1rm', true);

      if (!useCoachTables && strengthExerciseId) {
        query = query.eq('exercise_id', strengthExerciseId);
      }

      const { data } = await query;

      if (data && data.length > 0) {
        const maxWeight = Math.max(...data.map((d: any) => d.weight_kg || 0));
        testData.push({
          date: session.test_date,
          value: maxWeight,
          details: { records: data }
        });
      }
    }

    return testData;
  }, [userId, useCoachTables, metadata]);

  const fetchEnduranceData = useCallback(async () => {
    if (!userId) return null;

    const sessionsTable = useCoachTables ? 'coach_endurance_test_sessions' : 'endurance_test_sessions';
    const dataTable = useCoachTables ? 'coach_endurance_test_data' : 'endurance_test_data';

    const { data: sessions } = await supabase
      .from(sessionsTable)
      .select('id, test_date')
      .eq('user_id', userId)
      .order('test_date', { ascending: true });

    if (!sessions || sessions.length === 0) return null;

    const testData: TestData[] = [];
    for (const session of sessions) {
      const { data } = await supabase
        .from(dataTable)
        .select('mas_kmh, mas_ms, vo2_max, sprint_seconds, sprint_meters')
        .eq('test_session_id', session.id)
        .single();

      if (data) {
        testData.push({
          date: session.test_date,
          value: data.mas_kmh || data.mas_ms || 0,
          details: data
        });
      }
    }

    return testData;
  }, [userId, useCoachTables]);

  const fetchJumpData = useCallback(async () => {
    if (!userId) return null;

    const sessionsTable = useCoachTables ? 'coach_jump_test_sessions' : 'jump_test_sessions';
    const dataTable = useCoachTables ? 'coach_jump_test_data' : 'jump_test_data';

    const { data: sessions } = await supabase
      .from(sessionsTable)
      .select('id, test_date')
      .eq('user_id', userId)
      .order('test_date', { ascending: true });

    if (!sessions || sessions.length === 0) return null;

    const testData: TestData[] = [];
    for (const session of sessions) {
      const { data } = await supabase
        .from(dataTable)
        .select('counter_movement_jump, non_counter_movement_jump, depth_jump, broad_jump')
        .eq('test_session_id', session.id)
        .single();

      if (data) {
        const maxJump = Math.max(
          data.counter_movement_jump || 0,
          data.non_counter_movement_jump || 0,
          data.depth_jump || 0
        );
        testData.push({
          date: session.test_date,
          value: maxJump,
          details: data
        });
      }
    }

    return testData;
  }, [userId, useCoachTables]);

  const fetchFunctionalData = useCallback(async () => {
    if (!userId) return null;

    const sessionsTable = useCoachTables ? 'coach_functional_test_sessions' : 'functional_test_sessions';
    const dataTable = useCoachTables ? 'coach_functional_test_data' : 'functional_test_data';

    const { data: sessions } = await supabase
      .from(sessionsTable)
      .select('id, test_date')
      .eq('user_id', userId)
      .order('test_date', { ascending: true });

    if (!sessions || sessions.length === 0) return null;

    const testData: TestData[] = [];
    for (const session of sessions) {
      const { data } = await supabase
        .from(dataTable)
        .select('fms_score')
        .eq('test_session_id', session.id)
        .single();

      if (data) {
        testData.push({
          date: session.test_date,
          value: data.fms_score || 0,
          details: data
        });
      }
    }

    return testData;
  }, [userId, useCoachTables]);

  const fetchAttendanceFromPrograms = useCallback(async () => {
    if (!userId) return { completed: 0, missed: 0, total: 0 };

    const { data: completions } = await supabase
      .from('workout_completions')
      .select('id, status, scheduled_date')
      .eq('user_id', userId)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', targetDate || new Date().toISOString().split('T')[0]);

    const completed = completions?.filter(c => c.status === 'completed').length || 0;
    const missed = completions?.filter(c => c.status === 'missed').length || 0;
    
    return { completed, missed, total: (completions?.length || 0) };
  }, [userId, startDate, targetDate]);

  const fetchAttendanceFromBookings = useCallback(async () => {
    if (!userId) return { completed: 0, missed: 0, total: 0 };

    const { data: bookings } = await supabase
      .from('booking_sessions')
      .select('id, status, attendance_status')
      .eq('user_id', userId)
      .gte('booking_date', startDate)
      .lte('booking_date', targetDate || new Date().toISOString().split('T')[0]);

    const completed = bookings?.filter(b => b.attendance_status === 'attended' || b.status === 'completed').length || 0;
    const missed = bookings?.filter(b => b.attendance_status === 'missed' || b.status === 'missed').length || 0;
    
    return { completed, missed, total: (bookings?.length || 0) };
  }, [userId, startDate, targetDate]);

  const calculateProgress = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);

    try {
      let testData: TestData[] | null = null;

      switch (goalType) {
        case 'weight_loss':
          testData = await fetchAnthropometricData();
          if (testData && testData.length > 0) {
            const startData = testData.find(t => t.date >= startDate) || testData[0];
            const currentData = testData[testData.length - 1];
            
            setStartTest(startData);
            setCurrentTest(currentData);
            
            const weightLoss = startData.value - currentData.value;
            setProgress({
              currentValue: Math.max(0, weightLoss),
              targetValue: 0,
              startValue: startData.value,
              unit: 'kg',
              isPositive: weightLoss > 0,
              details: `Αρχικό: ${startData.value}kg → Τρέχον: ${currentData.value}kg`
            });
          }
          break;

        case 'strength_gain':
          testData = await fetchStrengthData();
          if (testData && testData.length > 0) {
            // Start value = the most recent test ON or BEFORE the goal start_date
            const candidates = testData.filter(t => t.date <= startDate);
            const startData = candidates.length > 0 ? candidates[candidates.length - 1] : testData[0];
            const currentData = testData[testData.length - 1];
            
            setStartTest(startData);
            setCurrentTest(currentData);
            
            const strengthGain = currentData.value - startData.value;
            setProgress({
              currentValue: currentData.value,
              targetValue: 0,
              startValue: startData.value,
              unit: 'kg',
              isPositive: strengthGain > 0,
              details: `Αρχικό: ${startData.value}kg → Τρέχον: ${currentData.value}kg`
            });
          }
          break;

        case 'endurance_gain':
          testData = await fetchEnduranceData();
          if (testData && testData.length > 0) {
            const startData = testData.find(t => t.date >= startDate) || testData[0];
            const currentData = testData[testData.length - 1];
            
            setStartTest(startData);
            setCurrentTest(currentData);
            
            const enduranceGain = currentData.value - startData.value;
            setProgress({
              currentValue: currentData.value,
              targetValue: 0,
              startValue: startData.value,
              unit: 'km/h',
              isPositive: enduranceGain > 0,
              details: `MAS: ${startData.value} → ${currentData.value} km/h`
            });
          }
          break;

        case 'jump_gain':
          testData = await fetchJumpData();
          if (testData && testData.length > 0) {
            const startData = testData.find(t => t.date >= startDate) || testData[0];
            const currentData = testData[testData.length - 1];
            
            setStartTest(startData);
            setCurrentTest(currentData);
            
            const jumpGain = currentData.value - startData.value;
            setProgress({
              currentValue: currentData.value,
              targetValue: 0,
              startValue: startData.value,
              unit: 'cm',
              isPositive: jumpGain > 0,
              details: `Άλμα: ${startData.value}cm → ${currentData.value}cm`
            });
          }
          break;

        case 'sprint_gain':
          testData = await fetchEnduranceData();
          if (testData && testData.length > 0) {
            const startData = testData.find(t => t.date >= startDate) || testData[0];
            const currentData = testData[testData.length - 1];
            
            const startSprint = startData.details?.sprint_seconds || 0;
            const currentSprint = currentData.details?.sprint_seconds || 0;
            
            setStartTest({ ...startData, value: startSprint });
            setCurrentTest({ ...currentData, value: currentSprint });
            
            // For sprint, less time is better
            const sprintGain = startSprint - currentSprint;
            setProgress({
              currentValue: currentSprint,
              targetValue: 0,
              startValue: startSprint,
              unit: 'sec',
              isPositive: sprintGain > 0,
              details: `Sprint: ${startSprint}s → ${currentSprint}s`
            });
          }
          break;

        case 'functional_gain':
          testData = await fetchFunctionalData();
          if (testData && testData.length > 0) {
            const startData = testData.find(t => t.date >= startDate) || testData[0];
            const currentData = testData[testData.length - 1];
            
            setStartTest(startData);
            setCurrentTest(currentData);
            
            const fmsGain = currentData.value - startData.value;
            setProgress({
              currentValue: currentData.value,
              targetValue: 21, // Max FMS score
              startValue: startData.value,
              unit: 'points',
              isPositive: fmsGain > 0,
              details: `FMS: ${startData.value} → ${currentData.value}/21`
            });
          }
          break;

        case 'body_composition':
          testData = await fetchAnthropometricData();
          if (testData && testData.length > 0) {
            const startData = testData.find(t => t.date >= startDate) || testData[0];
            const currentData = testData[testData.length - 1];
            
            setStartTest(startData);
            setCurrentTest(currentData);
            
            const startDetails = startData.details || {};
            const currentDetails = currentData.details || {};
            
            // Calculate composite score
            const fatLoss = (startDetails.body_fat_percentage || 0) - (currentDetails.body_fat_percentage || 0);
            const muscleGain = (currentDetails.muscle_mass_percentage || 0) - (startDetails.muscle_mass_percentage || 0);
            const boneGain = (currentDetails.bone_density || 0) - (startDetails.bone_density || 0);
            const visceralLoss = (startDetails.visceral_fat_percentage || 0) - (currentDetails.visceral_fat_percentage || 0);
            
            const isImproving = fatLoss >= 0 && muscleGain >= 0 && visceralLoss >= 0;
            
            setProgress({
              currentValue: isImproving ? 1 : 0,
              targetValue: 1,
              startValue: 0,
              unit: '',
              isPositive: isImproving,
              details: `Λίπος: ${fatLoss >= 0 ? '-' : '+'}${Math.abs(fatLoss).toFixed(1)}%, Μυς: ${muscleGain >= 0 ? '+' : ''}${muscleGain.toFixed(1)}%`
            });
          }
          break;

        case 'attendance':
          // Will be handled by the attendance source selection
          break;
      }
    } catch (error) {
      console.error('Error calculating progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, goalType, startDate, targetDate, fetchAnthropometricData, fetchStrengthData, fetchEnduranceData, fetchJumpData, fetchFunctionalData]);

  useEffect(() => {
    calculateProgress();
  }, [calculateProgress]);

  return {
    progress,
    startTest,
    currentTest,
    isLoading,
    refetch: calculateProgress,
    fetchAttendanceFromPrograms,
    fetchAttendanceFromBookings,
  };
};
