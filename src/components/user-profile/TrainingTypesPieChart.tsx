import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, startOfMonth, parseISO } from "date-fns";
import { el } from "date-fns/locale";

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
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    fetchTrainingTypes();
  }, [userId, timeFilter]);

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

      // Συγκεντρώνουμε τα training types ανά περίοδο
      const periodData: Record<string, Record<string, number>> = {};

      completions?.forEach((completion: any) => {
        const program = completion.program_assignments?.programs;
        if (!program?.program_weeks) return;

        // Βρίσκουμε την περίοδο (ημέρα/εβδομάδα/μήνα)
        const date = parseISO(completion.scheduled_date);
        let periodKey = '';
        
        if (timeFilter === 'day') {
          periodKey = format(date, 'dd/MM', { locale: el });
        } else if (timeFilter === 'week') {
          const weekStart = startOfWeek(date, { locale: el });
          periodKey = `Εβδ ${format(weekStart, 'dd/MM', { locale: el })}`;
        } else {
          periodKey = format(date, 'MMM yyyy', { locale: el });
        }

        if (!periodData[periodKey]) {
          periodData[periodKey] = {};
        }

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

              const typeLabel = TRAINING_TYPE_LABELS[block.training_type] || block.training_type;
              if (!periodData[periodKey][typeLabel]) {
                periodData[periodKey][typeLabel] = 0;
              }
              periodData[periodKey][typeLabel] += blockMinutes;
            });
          });
        });
      });

      // Μετατρέπουμε σε array για το chart
      const chartData = Object.entries(periodData).map(([period, types]) => {
        const entry: any = { period };
        Object.entries(types).forEach(([type, minutes]) => {
          entry[type] = Math.round(minutes);
        });
        return entry;
      });

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

  const totalMinutes = data.reduce((sum, item) => {
    const itemSum = Object.entries(item)
      .filter(([key]) => key !== 'period')
      .reduce((s, [, value]) => s + (value as number), 0);
    return sum + itemSum;
  }, 0);

  // Παίρνουμε όλους τους unique types για τα bars
  const allTypes = Array.from(
    new Set(
      data.flatMap(item => 
        Object.keys(item).filter(key => key !== 'period')
      )
    )
  );

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
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Σύνολο: <span className="font-semibold">{formatMinutes(totalMinutes)}</span>
          </div>
          <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as any)} className="w-auto">
            <TabsList className="rounded-none h-8">
              <TabsTrigger value="day" className="text-xs rounded-none">Ημέρα</TabsTrigger>
              <TabsTrigger value="week" className="text-xs rounded-none">Εβδομάδα</TabsTrigger>
              <TabsTrigger value="month" className="text-xs rounded-none">Μήνας</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value: any) => formatMinutes(value)}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #ccc',
                borderRadius: '0px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            {allTypes.map((type) => {
              const colorKey = Object.keys(TRAINING_TYPE_LABELS).find(
                key => TRAINING_TYPE_LABELS[key] === type
              );
              return (
                <Bar 
                  key={type} 
                  dataKey={type} 
                  stackId="a" 
                  fill={COLORS[colorKey as keyof typeof COLORS] || '#aca097'}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
