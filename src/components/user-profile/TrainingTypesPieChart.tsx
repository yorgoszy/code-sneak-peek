import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from "@/integrations/supabase/client";

interface TrainingTypesPieChartProps {
  userId: string;
}

const COLORS = {
  str: '#cb8954',
  'str/spd': '#a855f7',
  pwr: '#eab308',
  'spd/str': '#ec4899',
  spd: '#ef4444',
  'str/end': '#f97316',
  'pwr/end': '#84cc16',
  'spd/end': '#14b8a6',
  end: '#22c55e',
};

const TRAINING_TYPE_LABELS: Record<string, string> = {
  str: 'Δύναμη',
  'str/spd': 'Δύναμη/Ταχύτητα',
  pwr: 'Ισχύς',
  'spd/str': 'Ταχύτητα/Δύναμη',
  spd: 'Ταχύτητα',
  'str/end': 'Δύναμη/Αντοχή',
  'pwr/end': 'Ισχύς/Αντοχή',
  'spd/end': 'Ταχύτητα/Αντοχή',
  end: 'Αντοχή',
};

export const TrainingTypesPieChart: React.FC<TrainingTypesPieChartProps> = ({ userId }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainingTypes();
  }, [userId]);

  const fetchTrainingTypes = async () => {
    try {
      setLoading(true);
      
      // Παίρνουμε όλα τα completed workouts του χρήστη
      const { data: completions, error: completionsError } = await supabase
        .from('workout_completions')
        .select(`
          id,
          assignment_id,
          scheduled_date,
          status,
          program_assignments!inner(
            program_id,
            programs!inner(
              program_weeks(
                program_days(
                  program_blocks(
                    training_type,
                    program_exercises(
                      sets,
                      reps,
                      tempo,
                      rest
                    )
                  )
                )
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (completionsError) throw completionsError;

      // Συγκεντρώνουμε τα training types από τα blocks
      const typeMinutes: Record<string, number> = {};

      completions?.forEach((completion: any) => {
        const program = completion.program_assignments?.programs;
        if (!program?.program_weeks) return;

        program.program_weeks.forEach((week: any) => {
          week.program_days?.forEach((day: any) => {
            day.program_blocks?.forEach((block: any) => {
              if (!block.training_type) return;

              // Υπολογίζουμε χρόνο μπλοκ
              let blockMinutes = 0;
              block.program_exercises?.forEach((ex: any) => {
                const sets = ex.sets || 1;
                const reps = parseReps(ex.reps);
                const tempo = parseTempo(ex.tempo);
                const rest = parseRest(ex.rest);
                
                const exerciseTime = (sets * reps * tempo + (sets - 1) * rest) / 60;
                blockMinutes += exerciseTime;
              });

              if (!typeMinutes[block.training_type]) {
                typeMinutes[block.training_type] = 0;
              }
              typeMinutes[block.training_type] += blockMinutes;
            });
          });
        });
      });

      // Μετατρέπουμε σε array για το chart
      const chartData = Object.entries(typeMinutes)
        .filter(([_, minutes]) => minutes > 0)
        .map(([type, minutes]) => ({
          name: TRAINING_TYPE_LABELS[type] || type,
          value: Math.round(minutes),
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

  const parseReps = (reps: string): number => {
    if (!reps) return 10;
    const numbers = reps.split(/[.,]/).map(n => parseFloat(n) || 0);
    return numbers.reduce((sum, n) => sum + n, 0) || 10;
  };

  const parseTempo = (tempo: string): number => {
    if (!tempo) return 4;
    const numbers = tempo.split(/[.,]/).map(n => parseFloat(n) || 0);
    return numbers.reduce((sum, n) => sum + n, 0) || 4;
  };

  const parseRest = (rest: string): number => {
    if (!rest) return 60;
    const num = parseFloat(rest.replace(/[^0-9.]/g, '')) || 60;
    return rest.includes("'") || rest.includes(":") ? num : num;
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
          <div className="text-center py-8 text-gray-500">Φόρτωση...</div>
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
            Δεν υπάρχουν ολοκληρωμένες προπονήσεις με τύπους
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-sm md:text-base">Ανάλυση Τύπων Προπόνησης</CardTitle>
        <div className="text-sm text-gray-600">
          Σύνολο: <span className="font-semibold">{formatMinutes(totalMinutes)}</span>
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
