import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from "@/integrations/supabase/client";

interface TrainingTypesPieChartProps {
  userId: string;
  assignmentId?: string;
}

const COLORS = {
  hypertrophy: '#00ffba',
  strength: '#cb8954',
  endurance: '#22c55e',
  power: '#eab308',
  speed: '#ef4444',
  speed_endurance: '#f97316',
  speed_strength: '#a855f7',
  strength_speed: '#ec4899',
};

const TRAINING_TYPE_LABELS: Record<string, string> = {
  hypertrophy: 'Υπερτροφία',
  strength: 'Δύναμη',
  endurance: 'Αντοχή',
  power: 'Ισχύς',
  speed: 'Ταχύτητα',
  speed_endurance: 'Ταχύτητα/Αντοχή',
  speed_strength: 'Ταχύτητα/Δύναμη',
  strength_speed: 'Δύναμη/Ταχύτητα',
};

export const TrainingTypesPieChart: React.FC<TrainingTypesPieChartProps> = ({ 
  userId, 
  assignmentId 
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainingTypes();
  }, [userId, assignmentId]);

  const fetchTrainingTypes = async () => {
    try {
      setLoading(true);
      
      // Fetch program assignments for the user
      let query = supabase
        .from('program_assignments')
        .select(`
          *,
          programs!program_assignments_program_id_fkey(
            *,
            program_weeks(
              *,
              program_days(
                *,
                program_blocks(
                  *,
                  program_exercises(
                    *,
                    exercises(name),
                    sets,
                    reps,
                    percentage_1rm,
                    velocity_ms,
                    tempo,
                    rest
                  )
                )
              )
            )
          )
        `)
        .eq('user_id', userId);

      // Filter by assignment if specified
      if (assignmentId) {
        query = query.eq('id', assignmentId);
      } else {
        query = query.eq('status', 'active');
      }

      const { data: assignments, error } = await query;

      if (error) throw error;

      if (!assignments || assignments.length === 0) {
        setData([]);
        return;
      }

      // Analyze training types from program structure
      const typeAnalysis: Record<string, number> = {
        hypertrophy: 0,
        strength: 0,
        endurance: 0,
        power: 0,
        speed: 0,
        speed_endurance: 0,
        speed_strength: 0,
        strength_speed: 0
      };

      assignments.forEach(assignment => {
        if (assignment.programs?.program_weeks) {
          assignment.programs.program_weeks.forEach((week: any) => {
            week.program_days?.forEach((day: any) => {
              day.program_blocks?.forEach((block: any) => {
                block.program_exercises?.forEach((exercise: any) => {
                  const type = categorizeExerciseType(exercise);
                  const duration = calculateExerciseDurationMinutes(exercise);
                  typeAnalysis[type] += duration;
                });
              });
            });
          });
        }
      });

      // Convert to chart data format
      const chartData = Object.entries(typeAnalysis)
        .filter(([_, value]) => value > 0)
        .map(([type, value]) => ({
          name: TRAINING_TYPE_LABELS[type] || type,
          value: Math.round(value),
          color: COLORS[type as keyof typeof COLORS] || '#aca097'
        }));

      setData(chartData);
    } catch (error) {
      console.error('Error fetching training types:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const categorizeExerciseType = (exercise: any): string => {
    const reps = parseFloat(exercise.reps) || 0;
    const percentage = parseFloat(exercise.percentage_1rm) || 0;
    const velocity = parseFloat(exercise.velocity_ms) || 0;

    // Strength: >85% 1RM or ≤5 reps
    if (percentage > 85 || (reps <= 5 && reps > 0)) return 'strength';
    
    // Hypertrophy: 65-85% 1RM or 6-12 reps
    if ((percentage >= 65 && percentage <= 85) || (reps >= 6 && reps <= 12)) return 'hypertrophy';
    
    // Endurance: <65% 1RM or >12 reps
    if (percentage < 65 || reps > 12) return 'endurance';
    
    // Speed: High velocity with low load
    if (velocity > 0.8 && percentage < 60) return 'speed';
    
    // Power: 30-60% 1RM range
    if (percentage >= 30 && percentage < 65) return 'power';
    
    // Default to hypertrophy
    return 'hypertrophy';
  };

  const calculateExerciseDurationMinutes = (exercise: any): number => {
    const sets = parseInt(exercise.sets) || 1;
    const reps = parseRepsToTotal(exercise.reps || '1');
    const tempo = exercise.tempo || '2.1.2';
    const rest = parseInt(exercise.rest) || 60;

    // Calculate tempo seconds
    const tempoPhases = tempo.split('.').map((phase: string) => parseInt(phase) || 2);
    const tempoSeconds = tempoPhases.reduce((sum: number, phase: number) => sum + phase, 0);
    
    // Total time: (sets * reps * tempo) + (sets * rest)
    const totalSeconds = (sets * reps * tempoSeconds) + (sets * rest);
    return totalSeconds / 60; // Convert to minutes
  };

  const parseRepsToTotal = (reps: string): number => {
    if (!reps) return 1;
    
    // If contains dots, it's a pattern like "1.1.1"
    if (reps.includes('.')) {
      const parts = reps.split('.').map(r => parseInt(r) || 0);
      return parts.reduce((sum, r) => sum + r, 0);
    }
    
    return parseInt(reps) || 1;
  };

  const formatMinutes = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}ω ${mins}λ` : `${hours}ω`;
    }
    return `${minutes}λ`;
  };

  const totalMinutes = data.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-sm md:text-base">Ανάλυση Τύπων Προπόνησης</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Φόρτωση...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-sm md:text-base">Ανάλυση Τύπων Προπόνησης</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Δεν υπάρχουν δεδομένα προπόνησης
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm md:text-base">Ανάλυση Τύπων Προπόνησης</CardTitle>
          <div className="text-sm text-gray-600">
            Σύνολο: <span className="font-semibold">{formatMinutes(totalMinutes)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => formatMinutes(value)}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #ccc',
                borderRadius: '0px'
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => `${value}: ${formatMinutes(entry.payload.value)}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
