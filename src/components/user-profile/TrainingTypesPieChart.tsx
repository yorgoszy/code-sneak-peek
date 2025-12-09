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
import { parseRepsToTime, parseTempoToSeconds, parseRestTime } from '@/utils/timeCalculations';
import { fetchTrainingTypeStats, aggregateStatsByType, aggregateStatsByWeek, aggregateStatsByDay, aggregateStatsByMonth, calculateStatsFromCompletedWorkouts } from '@/services/trainingTypeStatsService';

interface TrainingTypesPieChartProps {
  userId: string;
  hideTimeTabs?: boolean;
  activeTab?: 'month' | 'week' | 'day';
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

export const TrainingTypesPieChart: React.FC<TrainingTypesPieChartProps> = ({ userId, hideTimeTabs = false, activeTab }) => {
  const [data, setData] = useState<any[]>([]);
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('week');
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  
  // Συγχρονίζουμε το timeFilter με το activeTab αν υπάρχει
  useEffect(() => {
    if (activeTab) {
      setTimeFilter(activeTab);
    }
  }, [activeTab]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [currentYear, setCurrentYear] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<string>('');
  
  // Παίρνουμε τα active programs του χρήστη
  const { data: activePrograms, isLoading } = useActivePrograms();
  
  // Φιλτράρουμε για τον συγκεκριμένο χρήστη
  const userPrograms = useMemo(() => {
    return activePrograms?.filter(p => p.user_id === userId) || [];
  }, [activePrograms, userId]);

  // State για τα δεδομένα από τη βάση
  const [dbStats, setDbStats] = useState<Record<string, number>>({});
  const [dbStatsByPeriod, setDbStatsByPeriod] = useState<Record<string, Record<string, number>>>({});
  const [dbStatsLoading, setDbStatsLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && userPrograms.length > 0) {
      calculateTrainingTypesData();
    } else if (!isLoading) {
      setData([]);
    }
  }, [userPrograms, timeFilter, isLoading, currentWeek, currentMonth, currentYear, activeTab]);

  // Ref για να ξέρουμε αν έχει γίνει ήδη το retroactive calculation
  const retroCalculationDoneRef = React.useRef(false);

  // Φόρτωση δεδομένων από τη βάση για completed workouts
  useEffect(() => {
    const loadDbStats = async () => {
      if (!userId) return;
      
      setDbStatsLoading(true);
      try {
        // Πρώτα, αν δεν έχει γίνει, κάνουμε retroactive calculation
        if (!retroCalculationDoneRef.current) {
          console.log('📊 Running retroactive calculation for completed workouts...');
          await calculateStatsFromCompletedWorkouts(userId);
          retroCalculationDoneRef.current = true;
        }

        const today = new Date();
        let startDate: string;
        let endDate: string;

        if (activeTab === 'day') {
          // Για ημέρα: φέρνουμε δεδομένα ολόκληρης της εβδομάδας
          startDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          endDate = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        } else if (activeTab === 'week') {
          // Για εβδομάδα: φέρνουμε δεδομένα ολόκληρου του μήνα
          startDate = format(startOfMonth(today), 'yyyy-MM-dd');
          endDate = format(endOfMonth(today), 'yyyy-MM-dd');
        } else if (activeTab === 'month' || timeFilter === 'week') {
          // Για μήνα: φέρνουμε δεδομένα ολόκληρου του έτους
          startDate = format(startOfYear(today), 'yyyy-MM-dd');
          endDate = format(endOfYear(today), 'yyyy-MM-dd');
        } else if (timeFilter === 'month') {
          startDate = format(startOfYear(currentYear), 'yyyy-MM-dd');
          endDate = format(endOfYear(currentYear), 'yyyy-MM-dd');
        } else if (timeFilter === 'day') {
          startDate = format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          endDate = format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        } else {
          startDate = format(startOfMonth(today), 'yyyy-MM-dd');
          endDate = format(endOfMonth(today), 'yyyy-MM-dd');
        }

        console.log('📊 Loading DB stats for:', { userId, startDate, endDate, activeTab });
        const stats = await fetchTrainingTypeStats(userId, startDate, endDate);
        
        // Aggregated stats (για σύνολο)
        const aggregated = aggregateStatsByType(stats);
        console.log('📊 DB stats loaded (aggregated):', aggregated);
        setDbStats(aggregated);

        // Stats ανά περίοδο
        let periodStats: Record<string, Record<string, number>> = {};
        if (activeTab === 'day') {
          periodStats = aggregateStatsByDay(stats, startDate, endDate);
        } else if (activeTab === 'week') {
          periodStats = aggregateStatsByWeek(stats);
        } else if (activeTab === 'month') {
          periodStats = aggregateStatsByMonth(stats);
        }
        console.log('📊 DB stats by period:', periodStats);
        setDbStatsByPeriod(periodStats);
      } catch (error) {
        console.error('❌ Error loading DB stats:', error);
        setDbStats({});
        setDbStatsByPeriod({});
      } finally {
        setDbStatsLoading(false);
      }
    };

    loadDbStats();
  }, [userId, activeTab, timeFilter, currentWeek, currentMonth, currentYear]);

  // Αρχικοποίηση επιλεγμένης ημέρας όταν αλλάζει το timeFilter
  useEffect(() => {
    if (timeFilter === 'day' && data.length > 0 && !selectedDay) {
      setSelectedDay(data[0].period);
    }
  }, [timeFilter, data, selectedDay]);

  const calculateTrainingTypesData = () => {
    console.log('📊 Calculating training types data...');
    console.log('📊 User programs count:', userPrograms.length);
    console.log('📊 Active tab:', activeTab);
    
    const periodData: Record<string, Record<string, number>> = {};
    const today = new Date();
    const weekStart = startOfWeek(currentWeek, { locale: el, weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { locale: el, weekStartsOn: 1 });
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const yearStart = startOfYear(currentYear);
    const yearEnd = endOfYear(currentYear);

    // Αν το activeTab είναι set (από το ημερολόγιο), φιλτράρουμε για την τρέχουσα περίοδο
    let filterStart: Date | null = null;
    let filterEnd: Date | null = null;
    
    if (activeTab === 'day') {
      filterStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      filterEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    } else if (activeTab === 'week') {
      filterStart = startOfWeek(today, { locale: el, weekStartsOn: 1 });
      filterEnd = endOfWeek(today, { locale: el, weekStartsOn: 1 });
    } else if (activeTab === 'month') {
      filterStart = startOfMonth(today);
      filterEnd = endOfMonth(today);
    }

    userPrograms.forEach((program, programIndex) => {
      const programData = program.programs;
      if (!programData?.program_weeks) return;
      
      console.log(`📊 Program ${programIndex + 1}: ${programData.name}`);
      
      // Για κάθε training date, βρίσκουμε την αντίστοιχη ημέρα προπόνησης
      program.training_dates?.forEach((dateStr, dateIndex) => {
        const date = parseISO(dateStr);
        
        // Αν έχουμε activeTab (από ημερολόγιο), φιλτράρουμε για τη συγκεκριμένη περίοδο
        if (activeTab && filterStart && filterEnd) {
          if (!isWithinInterval(date, { start: filterStart, end: filterEnd })) {
            return;
          }
        } else {
          // Αλλιώς χρησιμοποιούμε την παλιά λογική για το programs view
          if (timeFilter === 'day' && !isWithinInterval(date, { start: weekStart, end: weekEnd })) {
            return;
          }
          if (timeFilter === 'week' && !isWithinInterval(date, { start: monthStart, end: monthEnd })) {
            return;
          }
          if (timeFilter === 'month' && !isWithinInterval(date, { start: yearStart, end: yearEnd })) {
            return;
          }
        }
        
        let periodKey = '';
        
        // Αν έχουμε activeTab, αθροίζουμε όλα σε μια κατηγορία
        if (activeTab) {
          periodKey = 'all';
        } else if (timeFilter === 'day') {
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
          
          // Εξαιρούμε τους τύπους που δεν θέλουμε στο pie chart
          const excludedTypes = ['mobility', 'stability', 'activation', 'neural act', 'recovery'];
          if (excludedTypes.includes(block.training_type)) {
            console.log(`⏭️ Skipping block "${block.name}" with type ${block.training_type} (excluded from pie chart)`);
            return;
          }
          
          // Υπολογίζουμε τον χρόνο του block
          let blockTime = 0;
          block.program_exercises?.forEach((exercise: any) => {
            const sets = exercise.sets || 0;
            const repsData = parseRepsToTime(exercise.reps || '0');
            
            // Έλεγχος αν το reps_mode είναι 'time' ή αν το string reps περιέχει χρόνο
            const isTimeMode = exercise.reps_mode === 'time' || repsData.isTime;
            
            if (isTimeMode) {
              // Time-based exercise
              const workTime = sets * repsData.seconds;
              const restSeconds = parseRestTime(exercise.rest || '');
              const totalRestTime = sets * restSeconds;
              blockTime += workTime + totalRestTime;
            } else {
              // Rep-based exercise
              const reps = repsData.count;
              const tempoSeconds = parseTempoToSeconds(exercise.tempo || '');
              const restSeconds = parseRestTime(exercise.rest || '');
              const workTime = sets * reps * tempoSeconds;
              const totalRestTime = sets * restSeconds;
              blockTime += workTime + totalRestTime;
            }
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

  // Συνδυασμός δεδομένων από βάση (completed workouts) + υπολογιζόμενα (μελλοντικά)
  const combinedPieData = useMemo(() => {
    const combined: Record<string, number> = { ...dbStats };
    
    // Προσθέτουμε τα δεδομένα από τα active programs μόνο για μελλοντικές ημερομηνίες
    Object.entries(pieData).forEach(([type, minutes]) => {
      if (!combined[type]) {
        combined[type] = 0;
      }
      // Τα pieData περιέχουν μελλοντικές προπονήσεις, τα προσθέτουμε
      combined[type] += minutes as number;
    });
    
    return combined;
  }, [dbStats, pieData]);

  // Μετατρέπουμε σε array για το pie chart - χρησιμοποιούμε τα combined δεδομένα
  const chartData = Object.entries(combinedPieData).map(([name, value]) => ({
    name,
    value: value as number,
  }));

  // Για το σύνολο σε day, week και month mode, αθροίζουμε όλες τις περιόδους
  const totalMinutesData = (timeFilter === 'day' || timeFilter === 'week' || timeFilter === 'month') ? data : filteredData;
  // Υπολογισμός συνόλου από τα combined δεδομένα
  const totalMinutes = Object.values(combinedPieData).reduce((sum, val) => sum + (val as number), 0);

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
          {!hideTimeTabs && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTimeFilter('day')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  timeFilter === 'day' ? 'bg-[#aca097] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Ημέρα
              </button>
              <button
                onClick={() => setTimeFilter('week')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  timeFilter === 'week' ? 'bg-[#aca097] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Εβδομάδα
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  timeFilter === 'month' ? 'bg-[#aca097] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Μήνας
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {!activeTab && timeFilter === 'day' && (
          <div className="mb-2">
            {/* Week Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                className="rounded-none h-6 px-2 bg-transparent border-0 text-[#cb8954] hover:bg-transparent hover:text-[#cb8954]/80"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <div className={`text-[10px] md:text-sm font-medium ${
                format(startOfWeek(currentWeek, { locale: el, weekStartsOn: 1 }), 'yyyy-MM-dd') === 
                format(startOfWeek(new Date(), { locale: el, weekStartsOn: 1 }), 'yyyy-MM-dd')
                  ? 'text-[#cb8954]' 
                  : ''
              }`}>
                {format(startOfWeek(currentWeek, { locale: el, weekStartsOn: 1 }), 'dd MMM', { locale: el })} - {format(endOfWeek(currentWeek, { locale: el, weekStartsOn: 1 }), 'dd MMM yyyy', { locale: el })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                className="rounded-none h-6 px-2 bg-transparent border-0 text-[#cb8954] hover:bg-transparent hover:text-[#cb8954]/80"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {!activeTab && timeFilter === 'week' && (
          <div className="mb-2">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="rounded-none h-6 px-2 bg-transparent border-0 text-[#cb8954] hover:bg-transparent hover:text-[#cb8954]/80"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <div className={`text-[10px] md:text-sm font-medium ${
                format(currentMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM')
                  ? 'text-[#cb8954]' 
                  : ''
              }`}>
                {format(currentMonth, 'MMMM yyyy', { locale: el })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="rounded-none h-6 px-2 bg-transparent border-0 text-[#cb8954] hover:bg-transparent hover:text-[#cb8954]/80"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {!activeTab && timeFilter === 'month' && (
          <div className="mb-2">
            {/* Year Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentYear(subYears(currentYear, 1))}
                className="rounded-none h-6 px-2 bg-transparent border-0 text-[#cb8954] hover:bg-transparent hover:text-[#cb8954]/80"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <div className={`text-[10px] md:text-sm font-medium ${
                format(currentYear, 'yyyy') === format(new Date(), 'yyyy')
                  ? 'text-[#cb8954]' 
                  : ''
              }`}>
                {format(currentYear, 'yyyy')}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentYear(addYears(currentYear, 1))}
                className="rounded-none h-6 px-2 bg-transparent border-0 text-[#cb8954] hover:bg-transparent hover:text-[#cb8954]/80"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        
        {chartData.length === 0 && Object.keys(dbStats).length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p className="mb-1 text-xs">Δεν υπάρχουν δεδομένα για εμφάνιση</p>
            <p className="text-[10px] text-gray-400">
              Βεβαιωθείτε ότι έχετε ορίσει τύπο προπόνησης (str, end, pwr κτλ.) σε κάθε μπλοκ του προγράμματος
            </p>
          </div>
        ) : activeTab && Object.keys(dbStatsByPeriod).length > 0 ? (
          // Εμφάνιση πολλαπλών γραφημάτων βάσει περιόδου
          <div className="w-full">
            <Carousel
              opts={{
                align: "start",
                slidesToScroll: 1,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-0">
                {Object.entries(dbStatsByPeriod)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([periodKey, typeStats]) => {
                    const periodChartData = Object.entries(typeStats).map(([name, value]) => ({
                      name,
                      value: value as number,
                    }));
                    
                    const periodTotalMinutes = periodChartData.reduce((sum, item) => sum + item.value, 0);
                    
                    // Μορφοποίηση label ανάλογα με το activeTab
                    let periodLabel = periodKey;
                    if (activeTab === 'day') {
                      const date = parseISO(periodKey);
                      periodLabel = format(date, 'EEEE dd/MM', { locale: el });
                    } else if (activeTab === 'week') {
                      const date = parseISO(periodKey);
                      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
                      periodLabel = `${format(date, 'dd/MM', { locale: el })} - ${format(weekEnd, 'dd/MM', { locale: el })}`;
                    } else if (activeTab === 'month') {
                      const [year, month] = periodKey.split('-');
                      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                      periodLabel = format(date, 'MMMM yyyy', { locale: el });
                    }
                    
                    if (periodChartData.length === 0) return null;
                    
                    return (
                      <CarouselItem key={periodKey} className="pl-0 basis-1/2 sm:basis-1/3 md:basis-1/4">
                        <div className="border border-gray-200 rounded-none p-2">
                          <div className="mb-2">
                            <h4 className="text-[10px] font-semibold text-gray-900 truncate">{periodLabel}</h4>
                            <div className="text-[10px] text-gray-600">
                              <span className="font-semibold">{formatMinutes(periodTotalMinutes)}</span>
                            </div>
                          </div>
                          
                          <ResponsiveContainer width="100%" height={120}>
                            <PieChart>
                              <Pie
                                data={periodChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={35}
                                innerRadius={20}
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
                                  fontSize: '9px'
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          
                          {/* Legend μικρό */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {periodChartData.map((entry, index) => (
                              <div key={index} className="flex items-center gap-0.5">
                                <div 
                                  className="w-2 h-2 rounded-none" 
                                  style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] || '#aca097' }}
                                />
                                <span className="text-[8px] text-gray-600">
                                  {TRAINING_TYPE_LABELS[entry.name] || entry.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
              </CarouselContent>
              <CarouselPrevious className="left-0" />
              <CarouselNext className="right-0" />
            </Carousel>
          </div>
        ) : activeTab ? (
          // Fallback: αν δεν υπάρχουν period stats, εμφάνισε aggregated
          <div className="w-full">
            {chartData.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-xs">
                Δεν υπάρχουν δεδομένα για την επιλεγμένη περίοδο
              </div>
            ) : (
              <>
                {/* Mobile - Only minutes */}
                <ResponsiveContainer width="100%" height={200} className="sm:hidden">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => formatMinutes(entry.value)}
                      outerRadius={60}
                      innerRadius={35}
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
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '9px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Desktop */}
                <ResponsiveContainer width="100%" height={250} className="hidden sm:block">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${TRAINING_TYPE_LABELS[entry.name] || entry.name}: ${formatMinutes(entry.value)}`}
                      outerRadius={75}
                      innerRadius={45}
                      fill="#8884d8"
                      dataKey="value"
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
                        borderRadius: '0px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        ) : data.length === 0 && Object.keys(dbStats).length > 0 ? (
          // Αν δεν υπάρχουν active programs αλλά υπάρχουν completed workouts, εμφάνισε aggregated pie chart
          <div className="w-full">
            {chartData.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-xs">
                Δεν υπάρχουν δεδομένα για την επιλεγμένη περίοδο
              </div>
            ) : (
              <>
                {/* Mobile - Only minutes */}
                <ResponsiveContainer width="100%" height={200} className="sm:hidden">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => formatMinutes(entry.value)}
                      outerRadius={60}
                      innerRadius={35}
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
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '9px' }}
                      formatter={(value) => TRAINING_TYPE_LABELS[value] || value}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Tablet/Desktop */}
                <ResponsiveContainer width="100%" height={250} className="hidden sm:block">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${TRAINING_TYPE_LABELS[entry.name] || entry.name}: ${formatMinutes(entry.value)}`}
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
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px' }}
                      formatter={(value) => TRAINING_TYPE_LABELS[value] || value}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
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
