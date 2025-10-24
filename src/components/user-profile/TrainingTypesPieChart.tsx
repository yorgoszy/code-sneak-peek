import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, startOfMonth, parseISO, endOfWeek, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { el } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { calculateProgramStats } from "@/hooks/useProgramStats";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface TrainingTypesPieChartProps {
  userId: string;
  activeStatsTab?: 'day' | 'week' | 'month';
}

const COLORS = {
  end: '#8045ed',
  'str/end': '#334ac4',
  'pwr/end': '#ef3fed',
  'spd/end': '#ff8ad1',
  str: '#ff3131',
  'str/spd': '#8affe3',
  'spd/str': '#8afbff',
  spd: '#a4e1ff',
  pwr: '#fa009a',
  hpr: '#f6b62c',
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

export const TrainingTypesPieChart: React.FC<TrainingTypesPieChartProps> = ({ userId, activeStatsTab }) => {
  const [data, setData] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Παίρνουμε τα active programs του χρήστη
  const { data: activePrograms, isLoading } = useActivePrograms();
  
  // Φιλτράρουμε για τον συγκεκριμένο χρήστη
  const userPrograms = useMemo(() => {
    return activePrograms?.filter(p => p.user_id === userId) || [];
  }, [activePrograms, userId]);

  // Αν το activeStatsTab είναι 'month', φιλτράρουμε για τον τρέχοντα μήνα
  useEffect(() => {
    if (!isLoading && userPrograms.length > 0) {
      calculateTrainingTypesData();
    } else if (!isLoading) {
      setData([]);
    }
  }, [userPrograms, isLoading, currentMonth, activeStatsTab]);

  const calculateTrainingTypesData = () => {
    console.log('📊 Calculating training types data...');
    console.log('📊 User programs count:', userPrograms.length);
    console.log('📊 Active stats tab:', activeStatsTab);
    
    const periodData: Record<string, Record<string, number>> = {};
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // Ένα κλειδί για όλα τα δεδομένα
    const periodKey = 'all';

    userPrograms.forEach((program, programIndex) => {
      const programData = program.programs;
      if (!programData?.program_weeks) return;
      
      console.log(`📊 Program ${programIndex + 1}: ${programData.name}`);
      
      // Για κάθε training date, βρίσκουμε την αντίστοιχη ημέρα προπόνησης
      program.training_dates?.forEach((dateStr, dateIndex) => {
        const date = parseISO(dateStr);
        
        // Αν το activeStatsTab είναι 'month', φιλτράρουμε για τον τρέχοντα μήνα
        if (activeStatsTab === 'month' && !isWithinInterval(date, { start: monthStart, end: monthEnd })) {
          return;
        }

        // Βρίσκουμε σε ποια εβδομάδα και ημέρα ανήκει αυτή η ημερομηνία
        const daysPerWeek = programData.program_weeks[0]?.program_days?.length || 1;
        const weekIndex = Math.floor(dateIndex / daysPerWeek);
        const dayIndex = dateIndex % daysPerWeek;
        
        const week = programData.program_weeks[weekIndex];
        if (!week) return;
        
        const day = week.program_days?.[dayIndex];
        if (!day) return;
        
        console.log(`📊 Date ${dateStr}: Week ${weekIndex + 1}, Day ${dayIndex + 1}`);
        
        // Για κάθε block της ημέρας, υπολογίζουμε τα stats
        day.program_blocks?.forEach((block: any) => {
          if (!block.training_type) {
            console.log(`⚠️ Block "${block.name}" has no training_type`);
            return;
          }
          
          // Υπολογίζουμε τον χρόνο του block
          let blockTime = 0;
          block.program_exercises?.forEach((exercise: any) => {
            const sets = exercise.sets || 0;
            const reps = parseRepsToTotal(exercise.reps || '0');
            const tempoSeconds = parseTempoToSeconds(exercise.tempo || '');
            const restSeconds = parseRestTime(exercise.rest || '');
            const workTime = sets * reps * tempoSeconds;
            const totalRestTime = sets * restSeconds;
            blockTime += workTime + totalRestTime;
          });
          
          const timeMinutes = Math.round(blockTime / 60);
          const typeLabel = block.training_type;
          
          console.log(`✅ Block "${block.name}": ${block.training_type} -> ${typeLabel}, ${timeMinutes}min`);
          
          if (!periodData[periodKey]) {
            periodData[periodKey] = {};
          }
          
          if (!periodData[periodKey][typeLabel]) {
            periodData[periodKey][typeLabel] = 0;
          }
          
          periodData[periodKey][typeLabel] += timeMinutes;
        });
      });
    });

    console.log('📊 Period data:', periodData);

    // Μετατρέπουμε σε array για το chart
    const chartData = Object.entries(periodData).map(([period, types]) => {
      const entry: any = { period };
      Object.entries(types).forEach(([type, minutes]) => {
        entry[type] = minutes;
      });
      return entry;
    });

    console.log('📊 Final chart data:', chartData);
    setData(chartData);
  };

  // Helper functions από useProgramStats
  const parseTempoToSeconds = (tempo: string): number => {
    if (!tempo || tempo.trim() === '') return 3;
    const parts = tempo.split('.');
    let totalSeconds = 0;
    parts.forEach(part => {
      if (part === 'x' || part === 'X') {
        totalSeconds += 0.5;
      } else {
        totalSeconds += parseFloat(part) || 0;
      }
    });
    return totalSeconds;
  };

  const parseRepsToTotal = (reps: string): number => {
    if (!reps) return 0;
    if (!reps.includes('.')) {
      return parseInt(reps) || 0;
    }
    const parts = reps.split('.');
    let totalReps = 0;
    parts.forEach(part => {
      totalReps += parseInt(part) || 0;
    });
    return totalReps;
  };

  const parseRestTime = (rest: string): number => {
    if (!rest) return 0;
    if (rest.includes(':')) {
      const [minutes, seconds] = rest.split(':');
      return (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
    } else if (rest.includes("'")) {
      return (parseFloat(rest.replace("'", "")) || 0) * 60;
    } else if (rest.includes('s')) {
      return parseFloat(rest.replace('s', '')) || 0;
    } else {
      const minutes = parseFloat(rest) || 0;
      return minutes * 60;
    }
  };

  const formatMinutes = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}ω ${mins}λ` : `${hours}ω`;
    }
    return `${minutes}λ`;
  };

  // Αθροίζουμε όλα τα δεδομένα ανά training type
  const pieData = data.reduce((acc, item) => {
    Object.entries(item).forEach(([key, value]) => {
      if (key !== 'period') {
        if (!acc[key]) {
          acc[key] = 0;
        }
        acc[key] += value as number;
      }
    });
    return acc;
  }, {} as Record<string, number>);

  // Μετατρέπουμε σε array για το pie chart
  const chartData = Object.entries(pieData).map(([name, value]) => ({
    name,
    value: value as number,
  }));

  const totalMinutes = (Object.values(pieData) as number[]).reduce((sum, val) => sum + val, 0);

  if (isLoading) {
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

  return (
    <Card className="rounded-none">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-xs font-semibold">Ανάλυση Τύπων Προπόνησης</CardTitle>
        <div className="flex items-center justify-between mt-1">
          <div className="text-xs text-gray-600">
            Σύνολο: <span className="font-semibold">{formatMinutes(totalMinutes)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {data.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p className="mb-1 text-xs">Δεν υπάρχουν δεδομένα για εμφάνιση</p>
            <p className="text-[10px] text-gray-400">
              Βεβαιωθείτε ότι έχετε ορίσει τύπο προπόνησης (str, end, pwr κτλ.) σε κάθε μπλοκ του προγράμματος
            </p>
          </div>
        ) : (
          <>
            {/* Mobile - Only minutes */}
            <ResponsiveContainer width="100%" height={220} className="sm:hidden">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => formatMinutes(entry.value)}
                  outerRadius={60}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ fontSize: '10px' }}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.name as keyof typeof COLORS] || '#aca097'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => formatMinutes(value)}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #ccc',
                    borderRadius: '0px',
                    fontSize: '10px'
                  }}
                  labelFormatter={(name) => TRAINING_TYPE_LABELS[name as keyof typeof TRAINING_TYPE_LABELS] || name}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '9px' }}
                  formatter={(value) => TRAINING_TYPE_LABELS[value as keyof typeof TRAINING_TYPE_LABELS] || value}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Tablet - Small text */}
            <ResponsiveContainer width="100%" height={240} className="hidden sm:block md:hidden">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${TRAINING_TYPE_LABELS[entry.name as keyof typeof TRAINING_TYPE_LABELS] || entry.name}: ${formatMinutes(entry.value)}`}
                  outerRadius={70}
                  innerRadius={45}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ fontSize: '9px' }}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.name as keyof typeof COLORS] || '#aca097'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => formatMinutes(value)}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #ccc',
                    borderRadius: '0px',
                    fontSize: '10px'
                  }}
                  labelFormatter={(name) => TRAINING_TYPE_LABELS[name as keyof typeof TRAINING_TYPE_LABELS] || name}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px' }}
                  formatter={(value) => TRAINING_TYPE_LABELS[value as keyof typeof TRAINING_TYPE_LABELS] || value}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Desktop */}
            <ResponsiveContainer width="100%" height={280} className="hidden md:block">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${TRAINING_TYPE_LABELS[entry.name as keyof typeof TRAINING_TYPE_LABELS] || entry.name}: ${formatMinutes(entry.value)}`}
                  outerRadius={80}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ fontSize: '11px' }}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.name as keyof typeof COLORS] || '#aca097'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => formatMinutes(value)}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #ccc',
                    borderRadius: '0px',
                    fontSize: '11px'
                  }}
                  labelFormatter={(name) => TRAINING_TYPE_LABELS[name as keyof typeof TRAINING_TYPE_LABELS] || name}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value) => TRAINING_TYPE_LABELS[value as keyof typeof TRAINING_TYPE_LABELS] || value}
                />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
};
