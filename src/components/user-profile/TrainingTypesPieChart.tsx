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

export const TrainingTypesPieChart: React.FC<TrainingTypesPieChartProps> = ({ userId }) => {
  const [data, setData] = useState<any[]>([]);
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('week');
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [currentYear, setCurrentYear] = useState<Date>(new Date());
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
  }, [userPrograms, timeFilter, isLoading, currentWeek, currentMonth, currentYear]);

  // Αρχικοποίηση επιλεγμένης ημέρας όταν αλλάζει το timeFilter
  useEffect(() => {
    if (timeFilter === 'day' && data.length > 0 && !selectedDay) {
      setSelectedDay(data[0].period);
    }
  }, [timeFilter, data, selectedDay]);

  const calculateTrainingTypesData = () => {
    console.log('📊 Calculating training types data...');
    console.log('📊 User programs count:', userPrograms.length);
    
    const periodData: Record<string, Record<string, number>> = {};
    const weekStart = startOfWeek(currentWeek, { locale: el, weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { locale: el, weekStartsOn: 1 });
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const yearStart = startOfYear(currentYear);
    const yearEnd = endOfYear(currentYear);

    userPrograms.forEach((program, programIndex) => {
      const programData = program.programs;
      if (!programData?.program_weeks) return;
      
      console.log(`📊 Program ${programIndex + 1}: ${programData.name}`);
      
      // Για κάθε training date, βρίσκουμε την αντίστοιχη ημέρα προπόνησης
      program.training_dates?.forEach((dateStr, dateIndex) => {
        const date = parseISO(dateStr);
        
        // Φιλτράρουμε για την τρέχουσα περίοδο ανάλογα με το mode
        if (timeFilter === 'day' && !isWithinInterval(date, { start: weekStart, end: weekEnd })) {
          return;
        }
        if (timeFilter === 'week' && !isWithinInterval(date, { start: monthStart, end: monthEnd })) {
          return;
        }
        if (timeFilter === 'month' && !isWithinInterval(date, { start: yearStart, end: yearEnd })) {
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

  // Φιλτράρουμε δεδομένα ανάλογα με το mode
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

  // Για το σύνολο σε day, week και month mode, αθροίζουμε όλες τις περιόδους
  const totalMinutesData = (timeFilter === 'day' || timeFilter === 'week' || timeFilter === 'month') ? data : filteredData;
  const totalPieData = totalMinutesData.reduce((acc, item) => {
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

  const totalMinutes = (Object.values(totalPieData) as number[]).reduce((sum, val) => sum + val, 0);

  // Λίστα ημερών, εβδομάδων και μηνών
  const daysList = data.map(item => item.period);
  const weeksList = timeFilter === 'week' ? data.map(item => item.period) : [];
  const monthsList = timeFilter === 'month' ? data.map(item => item.period) : [];

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
        ) : timeFilter === 'day' || timeFilter === 'week' || timeFilter === 'month' ? (
          <Carousel
            opts={{
              align: "start",
              slidesToScroll: 3,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-0">
              {(timeFilter === 'day' ? daysList : timeFilter === 'week' ? weeksList : monthsList).map((period) => {
              const periodData = data.find(item => item.period === period);
              if (!periodData) return null;

              // Υπολογίζουμε τα δεδομένα για αυτή την περίοδο
              const periodPieData = Object.entries(periodData).reduce((acc, [key, value]) => {
                if (key !== 'period') {
                  acc[key] = value as number;
                }
                return acc;
              }, {} as Record<string, number>);

              const periodChartData = Object.entries(periodPieData).map(([name, value]) => ({
                name,
                value: value as number,
              }));

              const periodTotalMinutes = periodChartData.reduce((sum, item) => sum + item.value, 0);

              return (
                <CarouselItem key={period} className="pl-0 basis-1/3">
                  <div className="border border-gray-200 rounded-none p-1 md:p-2">
                  <div className="mb-2">
                    <h4 className="text-[10px] font-semibold text-gray-900">{period}</h4>
                    <div className="text-[10px] text-gray-600">
                      <span className="font-semibold">{formatMinutes(periodTotalMinutes)}</span>
                    </div>
                  </div>
                  
                  {periodChartData.length === 0 ? (
                    <div className="text-center py-2 text-gray-500 text-[10px]">
                      Δεν υπάρχουν δεδομένα
                    </div>
                  ) : (
                    <>
                    {/* Mobile - Only minutes */}
                    <ResponsiveContainer width="100%" height={160} className="sm:hidden">
                      <PieChart>
                        <Pie
                          data={periodChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => formatMinutes(entry.value)}
                          outerRadius={40}
                          innerRadius={25}
                          fill="#8884d8"
                          dataKey="value"
                          style={{ fontSize: '9px' }}
                        >
                          {periodChartData.map((entry, index) => (
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
                        />
                        <Legend wrapperStyle={{ fontSize: '9px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Tablet - Small text */}
                    <ResponsiveContainer width="100%" height={160} className="hidden sm:block md:hidden">
                      <PieChart>
                        <Pie
                          data={periodChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${formatMinutes(entry.value)}`}
                          outerRadius={40}
                          innerRadius={25}
                          fill="#8884d8"
                          dataKey="value"
                          style={{ fontSize: '7px' }}
                        >
                          {periodChartData.map((entry, index) => (
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
                        />
                        <Legend wrapperStyle={{ fontSize: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Desktop */}
                    <ResponsiveContainer width="100%" height={180} className="hidden md:block">
                      <PieChart>
                        <Pie
                          data={periodChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${formatMinutes(entry.value)}`}
                          outerRadius={50}
                          innerRadius={30}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {periodChartData.map((entry, index) => (
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
                        />
                        <Legend wrapperStyle={{ fontSize: '9px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    </>
                  )}
                  </div>
                </CarouselItem>
              );
            })}
            </CarouselContent>
            <div className="flex justify-center gap-2 mt-2">
              <CarouselPrevious className="rounded-none static translate-y-0 bg-transparent border-0 text-[#cb8954] hover:bg-transparent hover:text-[#cb8954]/80" />
              <CarouselNext className="rounded-none static translate-y-0 bg-transparent border-0 text-[#cb8954] hover:bg-transparent hover:text-[#cb8954]/80" />
            </div>
          </Carousel>
        ) : null}
      </CardContent>
    </Card>
  );
};
