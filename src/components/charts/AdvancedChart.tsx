
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdvancedChartFilters } from "./AdvancedChartFilters";
import { StrengthProgressChart } from "./StrengthProgressChart";
import { supabase } from "@/integrations/supabase/client";

interface AdvancedChartProps {
  testType: 'strength' | 'anthropometric' | 'endurance' | 'functional' | 'jump';
  selectedAthleteIds: string[];
}

export const AdvancedChart = ({ testType, selectedAthleteIds }: AdvancedChartProps) => {
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedTestNumbers, setSelectedTestNumbers] = useState<number[]>([1]); // 1 = τελευταίο τεστ
  const [chartData, setChartData] = useState<any[]>([]);
  const [availableExercises, setAvailableExercises] = useState<any[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    if (selectedAthleteIds.length > 0) {
      fetchAvailableData();
    }
  }, [selectedAthleteIds, testType]);

  useEffect(() => {
    if (selectedAthleteIds.length > 0 && selectedExercises.length > 0) {
      fetchChartData();
    }
  }, [selectedAthleteIds, selectedExercises, selectedYear, selectedTestNumbers]);

  const fetchAvailableData = async () => {
    if (testType === 'strength') {
      // Fetch available exercises
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('id, name')
        .order('name');

      if (exercisesData) {
        setAvailableExercises(exercisesData);
        // Επιλέγω τις πρώτες 3 ασκήσεις by default
        setSelectedExercises(exercisesData.slice(0, 3).map(ex => ex.id));
      }

      // Fetch available years
      const { data: yearsData } = await supabase
        .from('strength_test_sessions')
        .select('test_date')
        .in('athlete_id', selectedAthleteIds);

      if (yearsData) {
        const years = [...new Set(yearsData.map(session => new Date(session.test_date).getFullYear()))];
        setAvailableYears(years.sort((a, b) => b - a));
      }
    }
  };

  const fetchChartData = async () => {
    if (testType === 'strength') {
      const chartData: any[] = [];
      
      for (const athleteId of selectedAthleteIds) {
        // Fetch athlete name
        const { data: athleteData } = await supabase
          .from('app_users')
          .select('name')
          .eq('id', athleteId)
          .single();

        const athleteName = athleteData?.name || 'Unknown';

        // Fetch sessions for the selected year
        const startDate = `${selectedYear}-01-01`;
        const endDate = `${selectedYear}-12-31`;

        const { data: sessionsData } = await supabase
          .from('strength_test_sessions')
          .select('id, test_date')
          .eq('athlete_id', athleteId)
          .gte('test_date', startDate)
          .lte('test_date', endDate)
          .order('test_date', { ascending: false });

        if (sessionsData) {
          // Get only the selected test numbers (1 = latest, 2 = second latest, etc.)
          const selectedSessions = selectedTestNumbers
            .map(num => sessionsData[num - 1])
            .filter(Boolean);

          for (const session of selectedSessions) {
            const testIndex = sessionsData.indexOf(session) + 1;
            
            // Fetch attempts for this session and selected exercises
            const { data: attemptsData } = await supabase
              .from('strength_test_attempts')
              .select(`
                *,
                exercises(name)
              `)
              .eq('test_session_id', session.id)
              .in('exercise_id', selectedExercises);

            if (attemptsData) {
              attemptsData.forEach(attempt => {
                chartData.push({
                  athleteId,
                  athleteName,
                  exerciseId: attempt.exercise_id,
                  exerciseName: attempt.exercises?.name || 'Unknown',
                  weight: attempt.weight_kg,
                  velocity: attempt.velocity_ms,
                  testDate: session.test_date,
                  testIndex, // 1 = τελευταίο, 2 = προ-τελευταίο, κτλ
                  is1RM: attempt.is_1rm
                });
              });
            }
          }
        }
      }

      setChartData(chartData);
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Προχωρημένη Ανάλυση - {testType === 'strength' ? 'Δύναμη' : testType}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <AdvancedChartFilters
          testType={testType}
          availableExercises={availableExercises}
          availableYears={availableYears}
          selectedExercises={selectedExercises}
          selectedYear={selectedYear}
          selectedTestNumbers={selectedTestNumbers}
          onExercisesChange={setSelectedExercises}
          onYearChange={setSelectedYear}
          onTestNumbersChange={setSelectedTestNumbers}
        />

        {chartData.length > 0 && (
          <StrengthProgressChart
            data={chartData}
            selectedAthleteIds={selectedAthleteIds}
          />
        )}

        {chartData.length === 0 && selectedExercises.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Δεν βρέθηκαν δεδομένα για τις επιλεγμένες παραμέτρους</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
