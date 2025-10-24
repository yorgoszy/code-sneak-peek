import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, startOfMonth, parseISO, endOfWeek, addWeeks, subWeeks, isWithinInterval } from "date-fns";
import { el } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { calculateProgramStats } from "@/hooks/useProgramStats";

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
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('week');
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<string>('');
  
  // Παίρνουμε τα active programs του χρήστη
  const { data: activePrograms, isLoading } = useActivePrograms();
  
  // Φιλτράρουμε για τον συγκεκριμένο χρήστη
  const userPrograms = useMemo(() => {
    return activePrograms?.filter(p => p.user_id === userId) || [];
  }, [activePrograms, userId]);

  useEffect(() => {
    if (!isLoading && userPrograms.length > 0) {
      calculateTrainingTypesData();
    } else if (!isLoading) {
      setData([]);
    }
  }, [userPrograms, timeFilter, isLoading, currentWeek]);

  const calculateTrainingTypesData = () => {
    console.log('📊 Calculating training types data...');
    console.log('📊 User programs count:', userPrograms.length);
    
    const periodData: Record<string, Record<string, number>> = {};
    const weekStart = startOfWeek(currentWeek, { locale: el, weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { locale: el, weekStartsOn: 1 });

    userPrograms.forEach((program, programIndex) => {
      const programData = program.programs;
      if (!programData?.program_weeks) return;
      
      console.log(`📊 Program ${programIndex + 1}: ${programData.name}`);
      
      // Για κάθε training date, βρίσκουμε την αντίστοιχη ημέρα προπόνησης
      program.training_dates?.forEach((dateStr, dateIndex) => {
        const date = parseISO(dateStr);
        
        // Φιλτράρουμε για την τρέχουσα εβδομάδα αν είμαστε σε day mode
        if (timeFilter === 'day' && !isWithinInterval(date, { start: weekStart, end: weekEnd })) {
          return;
        }
        
        let periodKey = '';
        
        if (timeFilter === 'day') {
          periodKey = format(date, 'EEEE', { locale: el });
        } else if (timeFilter === 'week') {
          const weekStart = startOfWeek(date, { locale: el, weekStartsOn: 1 });
          periodKey = `Εβδ ${format(weekStart, 'dd/MM', { locale: el })}`;
        } else {
          periodKey = format(date, 'MMM yyyy', { locale: el });
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
          const typeLabel = TRAINING_TYPE_LABELS[block.training_type] || block.training_type;
          
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
    
    // Αρχικοποιούμε την επιλεγμένη ημέρα αν είμαστε σε day mode
    if (timeFilter === 'day' && chartData.length > 0 && !selectedDay) {
      setSelectedDay(chartData[0].period);
    }
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

  // Αν είμαστε σε day mode, φιλτράρουμε για την επιλεγμένη ημέρα
  const filteredData = timeFilter === 'day' && selectedDay
    ? data.filter(item => item.period === selectedDay)
    : data;

  // Αθροίζουμε όλα τα δεδομένα ανά training type
  const pieData = filteredData.reduce((acc, item) => {
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

  const totalMinutes = chartData.reduce((sum, item) => sum + item.value, 0);

  // Λίστα ημερών για τα tabs
  const daysList = data.map(item => item.period);

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
        {timeFilter === 'day' && (
          <div className="mb-4 space-y-4">
            {/* Week Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                className="rounded-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium">
                {format(startOfWeek(currentWeek, { locale: el, weekStartsOn: 1 }), 'dd MMM', { locale: el })} - {format(endOfWeek(currentWeek, { locale: el, weekStartsOn: 1 }), 'dd MMM yyyy', { locale: el })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                className="rounded-none"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Day Tabs */}
            {daysList.length > 0 && (
              <Tabs value={selectedDay} onValueChange={setSelectedDay} className="w-full">
                <TabsList className="rounded-none h-8 w-full grid" style={{ gridTemplateColumns: `repeat(${daysList.length}, 1fr)` }}>
                  {daysList.map((day) => (
                    <TabsTrigger key={day} value={day} className="text-xs rounded-none">
                      {day}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </div>
        )}
        
        {data.length === 0 || chartData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">Δεν υπάρχουν δεδομένα για εμφάνιση</p>
            <p className="text-xs text-gray-400">
              Βεβαιωθείτε ότι έχετε ορίσει τύπο προπόνησης (str, end, pwr κτλ.) σε κάθε μπλοκ του προγράμματος
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${formatMinutes(entry.value)}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => {
                const colorKey = Object.keys(TRAINING_TYPE_LABELS).find(
                  key => TRAINING_TYPE_LABELS[key] === entry.name
                );
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[colorKey as keyof typeof COLORS] || '#aca097'} 
                  />
                );
              })}
            </Pie>
            <Tooltip 
              formatter={(value: any) => formatMinutes(value)}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #ccc',
                borderRadius: '0px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
