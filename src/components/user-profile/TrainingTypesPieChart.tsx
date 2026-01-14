import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { format, startOfWeek, startOfMonth, parseISO, endOfWeek, addWeeks, subWeeks, addMonths, subMonths, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { el, enUS, ar } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useTranslation } from 'react-i18next';

const getDateLocale = (lang: string) => {
  switch (lang) {
    case 'el': return el;
    case 'ar': return ar;
    default: return enUS;
  }
};

interface TrainingTypesPieChartProps {
  userId: string;
  hideTimeTabs?: boolean;
  activeTab?: 'month' | 'week' | 'day';
}

const COLORS: Record<string, string> = {
  // Main tracked types
  str: '#ff3131',
  end: '#8045ed',
  pwr: '#fa009a',
  spd: '#a4e1ff',
  hpr: '#00ffba',
  acc: '#d4d4d4',
  accessory: '#d4d4d4',
  // Combined types
  'str/end': '#c43ba0',
  'spd/end': '#9273f0',
  'pwr/end': '#b405c0',
  'str/spd': '#ff7098',
  'str/pwr': '#ff1a6e',
  'pwr/spd': '#d754e0',
  // Non-tracked types
  warmup: '#ffd700',
  'warm up': '#ffd700',
  recovery: '#4a90d9',
  mobility: '#20b2aa',
  stability: '#9370db',
  rotational: '#ff8c00',
  'neural act': '#32cd32',
  activation: '#7cfc00',
  core: '#ff6347',
};

const TRAINING_TYPE_LABELS: Record<string, string> = {
  str: 'str',
  end: 'end',
  pwr: 'pwr',
  spd: 'spd',
  hpr: 'hpr',
  acc: 'acc',
  accessory: 'acc',
  'str/end': 'str/end',
  'spd/end': 'spd/end',
  'pwr/end': 'pwr/end',
  'str/spd': 'str/spd',
  'str/pwr': 'str/pwr',
  'pwr/spd': 'pwr/spd',
  warmup: 'warmup',
  'warm up': 'warmup',
  recovery: 'rec',
  mobility: 'mob',
  stability: 'stab',
  rotational: 'rot',
  'neural act': 'neural',
  activation: 'act',
  core: 'core',
};

interface WorkoutStat {
  id: string;
  user_id: string;
  assignment_id: string;
  scheduled_date: string;
  total_duration_minutes: number;
  total_volume_kg: number;
  training_type_breakdown: Record<string, number> | null;
}

// Type guard to safely cast Json to our expected type
const parseBreakdown = (data: any): Record<string, number> | null => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return data as Record<string, number>;
};

export const TrainingTypesPieChart: React.FC<TrainingTypesPieChartProps> = ({ userId, hideTimeTabs = false, activeTab }) => {
  const { t, i18n } = useTranslation();
  const dateLocale = getDateLocale(i18n.language);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('week');
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<string>('');
  
  // Συγχρονίζουμε το timeFilter με το activeTab αν υπάρχει
  useEffect(() => {
    if (activeTab) {
      setTimeFilter(activeTab);
    }
  }, [activeTab]);

  // Φόρτωση δεδομένων από workout_stats (με realtime refresh όταν ολοκληρώνεται προπόνηση)
  useEffect(() => {
    let isMounted = true;

    const fetchWorkoutStats = async (opts?: { silent?: boolean }) => {
      try {
        if (!opts?.silent) setIsLoading(true);

        const { data, error } = await supabase
          .from('workout_stats')
          .select('*')
          .eq('user_id', userId)
          .order('scheduled_date', { ascending: false });

        if (error) {
          console.error('Error fetching workout stats:', error);
          if (isMounted) setWorkoutStats([]);
          return;
        }

        const transformed = (data || []).map(stat => ({
          ...stat,
          training_type_breakdown: parseBreakdown(stat.training_type_breakdown)
        })) as WorkoutStat[];

        if (isMounted) setWorkoutStats(transformed);
      } catch (error) {
        console.error('Error:', error);
        if (isMounted) setWorkoutStats([]);
      } finally {
        if (!opts?.silent && isMounted) setIsLoading(false);
      }
    };

    if (!userId) return;

    // initial load
    fetchWorkoutStats();

    // realtime updates (insert/update) so the chart updates immediately after workout completion
    const channel = supabase
      .channel(`workout-stats-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_stats',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchWorkoutStats({ silent: true });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Φιλτράρισμα δεδομένων με βάση το time filter
  const filteredStats = useMemo(() => {
    if (workoutStats.length === 0) return [];

    const today = new Date();
    const weekStart = startOfWeek(currentWeek, { locale: dateLocale, weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { locale: dateLocale, weekStartsOn: 1 });
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    let filterStart: Date;
    let filterEnd: Date;

    if (activeTab === 'day') {
      filterStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      filterEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    } else if (activeTab === 'week') {
      filterStart = startOfWeek(today, { locale: dateLocale, weekStartsOn: 1 });
      filterEnd = endOfWeek(today, { locale: dateLocale, weekStartsOn: 1 });
    } else if (activeTab === 'month') {
      filterStart = startOfMonth(today);
      filterEnd = endOfMonth(today);
    } else if (timeFilter === 'day') {
      filterStart = weekStart;
      filterEnd = weekEnd;
    } else if (timeFilter === 'week') {
      filterStart = monthStart;
      filterEnd = monthEnd;
    } else {
      filterStart = new Date(currentYear, 0, 1);
      filterEnd = new Date(currentYear, 11, 31, 23, 59, 59);
    }

    return workoutStats.filter(stat => {
      const date = parseISO(stat.scheduled_date);
      return isWithinInterval(date, { start: filterStart, end: filterEnd });
    });
  }, [workoutStats, timeFilter, currentWeek, currentMonth, currentYear, activeTab, dateLocale]);

  // Ομαδοποίηση δεδομένων ανά περίοδο - χρησιμοποιούμε raw training types
  const groupedData = useMemo(() => {
    const groups: Record<string, { trainingTypes: Record<string, number>; total: number }> = {};

    filteredStats.forEach(stat => {
      const date = parseISO(stat.scheduled_date);
      let periodKey = '';

      if (activeTab) {
        periodKey = 'all';
      } else if (timeFilter === 'day') {
        periodKey = format(date, 'EEEE', { locale: dateLocale });
      } else if (timeFilter === 'week') {
        const weekStart = startOfWeek(date, { locale: dateLocale, weekStartsOn: 1 });
        periodKey = `${t('programs.weekShort', 'Wk')} ${format(weekStart, 'dd/MM', { locale: dateLocale })}`;
      } else {
        periodKey = format(date, 'MMM yyyy', { locale: dateLocale });
      }

      if (!groups[periodKey]) {
        groups[periodKey] = { trainingTypes: {}, total: 0 };
      }

      // Merge training_type_breakdown and calculate total from breakdown
      const breakdown = stat.training_type_breakdown as Record<string, number> | null;
      if (breakdown) {
        Object.entries(breakdown).forEach(([type, minutes]) => {
          const roundedMinutes = Math.round(minutes);
          groups[periodKey].trainingTypes[type] = (groups[periodKey].trainingTypes[type] || 0) + roundedMinutes;
          // Add to total from breakdown instead of total_duration_minutes
          groups[periodKey].total += roundedMinutes;
        });
      }
    });

    // Create day order dynamically based on locale
    const mondayDate = new Date(2024, 0, 1); // A known Monday
    const dayOrder = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(mondayDate);
      day.setDate(mondayDate.getDate() + i);
      return format(day, 'EEEE', { locale: dateLocale });
    });
    
    const result = Object.entries(groups).map(([period, data]) => ({
      period,
      trainingTypes: data.trainingTypes,
      total: data.total
    }));

    // Sort by day order for day view
    if (timeFilter === 'day' && !activeTab) {
      result.sort((a, b) => {
        const indexA = dayOrder.indexOf(a.period);
        const indexB = dayOrder.indexOf(b.period);
        return indexA - indexB;
      });
    }

    return result;
  }, [filteredStats, timeFilter, activeTab, dateLocale, t]);

  // Αρχικοποίηση επιλεγμένης ημέρας
  useEffect(() => {
    if (timeFilter === 'day' && groupedData.length > 0 && !selectedDay) {
      setSelectedDay(groupedData[0].period);
    }
  }, [timeFilter, groupedData, selectedDay]);

  // Υπολογισμός συνολικών λεπτών
  const totalMinutes = useMemo(() => {
    return groupedData.reduce((sum, item) => sum + item.total, 0);
  }, [groupedData]);

  // Δεδομένα για pie chart - χρησιμοποιούμε raw training types
  const pieData = useMemo(() => {
    const totals: Record<string, number> = {};
    
    groupedData.forEach(item => {
      Object.entries(item.trainingTypes).forEach(([type, minutes]) => {
        totals[type] = (totals[type] || 0) + minutes;
      });
    });

    return Object.entries(totals)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [groupedData]);

  const formatMinutes = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}ω ${mins}λ` : `${hours}ω`;
    }
    return `${minutes}λ`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-2 rounded-none border border-gray-200 shadow-sm">
          <p className="text-xs font-medium">{TRAINING_TYPE_LABELS[data.name] || data.name}</p>
          <p className="text-xs text-gray-600">{formatMinutes(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
        {`${name} ${formatMinutes(value)}`}
      </text>
    );
  };

  if (isLoading) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-sm md:text-base">{t('programs.trainingTypesAnalysis')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-xs font-semibold">{t('programs.trainingTypesAnalysis')}</CardTitle>
        <div className="flex items-center justify-between mt-1">
          <div className="text-xs text-gray-600">
            {t('programs.total')}: <span className="font-semibold">{formatMinutes(totalMinutes)}</span>
          </div>
          {!hideTimeTabs && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTimeFilter('day')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  timeFilter === 'day' ? 'bg-[#aca097] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('programs.weekly')}
              </button>
              <button
                onClick={() => setTimeFilter('week')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  timeFilter === 'week' ? 'bg-[#aca097] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('programs.monthly')}
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  timeFilter === 'month' ? 'bg-[#aca097] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('programs.yearly')}
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {!activeTab && timeFilter === 'day' && (
          <div className="mb-2">
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
                format(startOfWeek(currentWeek, { locale: dateLocale, weekStartsOn: 1 }), 'yyyy-MM-dd') === 
                format(startOfWeek(new Date(), { locale: dateLocale, weekStartsOn: 1 }), 'yyyy-MM-dd')
                  ? 'text-[#cb8954]' 
                  : ''
              }`}>
                {format(startOfWeek(currentWeek, { locale: dateLocale, weekStartsOn: 1 }), 'dd MMM', { locale: dateLocale })} - {format(endOfWeek(currentWeek, { locale: dateLocale, weekStartsOn: 1 }), 'dd MMM yyyy', { locale: dateLocale })}
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
                format(currentMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM') ? 'text-[#cb8954]' : ''
              }`}>
                {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
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

        {(groupedData.length === 0 || pieData.length === 0) && timeFilter !== 'month' ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {t('programs.noCompletedWorkouts')}
          </div>
        ) : (
          <>
            {/* Day view with carousel */}
            {!activeTab && timeFilter === 'day' && groupedData.length > 0 && (
              <Carousel className="w-full">
                <CarouselContent className="md:justify-center">
                  {groupedData.map((dayData, index) => {
                    const dayPieData = Object.entries(dayData.trainingTypes)
                      .filter(([_, value]) => value > 0)
                      .map(([name, value]) => ({ name, value: Math.round(value) }))
                      .sort((a, b) => b.value - a.value);

                    return (
                      <CarouselItem key={index} className="basis-1/3 md:basis-1/5">
                        <div className="flex flex-col items-center p-1">
                          <div className="text-[10px] font-medium mb-1">{dayData.period}</div>
                          <div className="text-[8px] text-gray-500">{formatMinutes(dayData.total)}</div>
                          {dayPieData.length > 0 ? (
                            <ResponsiveContainer width={80} height={80}>
                              <PieChart>
                                <Pie
                                  data={dayPieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={15}
                                  outerRadius={35}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {dayPieData.map((entry, i) => (
                                    <Cell key={`cell-${i}`} fill={COLORS[entry.name] || '#ccc'} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="w-[80px] h-[80px] flex items-center justify-center">
                              <div className="w-[70px] h-[70px] rounded-full border-2 border-dashed border-gray-300" />
                            </div>
                          )}
                          <div className="flex flex-wrap justify-center gap-1 mt-1">
                            {dayPieData.map((item, i) => (
                              <div key={i} className="flex items-center gap-0.5">
                                <div className="w-2 h-2" style={{ backgroundColor: COLORS[item.name] || '#ccc' }} />
                                <span className="text-[8px]">{TRAINING_TYPE_LABELS[item.name] || item.name}</span>
                                <span className="text-[8px] text-gray-500">({formatMinutes(item.value)})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious className="left-0 h-6 w-6" />
                <CarouselNext className="right-0 h-6 w-6" />
              </Carousel>
            )}

            {/* Week view (Μηνιαία) with carousel - shows weeks */}
            {!activeTab && timeFilter === 'week' && groupedData.length > 0 && (
              <Carousel className="w-full">
                <CarouselContent className="md:justify-center">
                  {groupedData.map((weekData, index) => {
                    const weekPieData = Object.entries(weekData.trainingTypes)
                      .filter(([_, value]) => value > 0)
                      .map(([name, value]) => ({ name, value: Math.round(value) }))
                      .sort((a, b) => b.value - a.value);

                    return (
                      <CarouselItem key={index} className="basis-1/3 md:basis-1/5">
                        <div className="flex flex-col items-center p-1">
                          <div className="text-[10px] font-medium mb-1">{weekData.period}</div>
                          <div className="text-[8px] text-gray-500">{formatMinutes(weekData.total)}</div>
                          {weekPieData.length > 0 ? (
                            <ResponsiveContainer width={80} height={80}>
                              <PieChart>
                                <Pie
                                  data={weekPieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={15}
                                  outerRadius={35}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {weekPieData.map((entry, i) => (
                                    <Cell key={`cell-${i}`} fill={COLORS[entry.name] || '#ccc'} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="w-[80px] h-[80px] flex items-center justify-center">
                              <div className="w-[70px] h-[70px] rounded-full border-2 border-dashed border-gray-300" />
                            </div>
                          )}
                          <div className="flex flex-wrap justify-center gap-1 mt-1">
                            {weekPieData.map((item, i) => (
                              <div key={i} className="flex items-center gap-0.5">
                                <div className="w-2 h-2" style={{ backgroundColor: COLORS[item.name] || '#ccc' }} />
                                <span className="text-[8px]">{TRAINING_TYPE_LABELS[item.name] || item.name}</span>
                                <span className="text-[8px] text-gray-500">({formatMinutes(item.value)})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious className="left-0 h-6 w-6" />
                <CarouselNext className="right-0 h-6 w-6" />
              </Carousel>
            )}

            {/* Month view (Ετήσια) with carousel - shows months */}
            {!activeTab && timeFilter === 'month' && (
              <>
                <div className="mb-2">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentYear(currentYear - 1)}
                      className="rounded-none h-6 px-2 bg-transparent border-0 text-[#cb8954] hover:bg-transparent hover:text-[#cb8954]/80"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <div className={`text-[10px] md:text-sm font-medium ${
                      currentYear === new Date().getFullYear() ? 'text-[#cb8954]' : ''
                    }`}>
                      {currentYear}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentYear(currentYear + 1)}
                      className="rounded-none h-6 px-2 bg-transparent border-0 text-[#cb8954] hover:bg-transparent hover:text-[#cb8954]/80"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {groupedData.length > 0 ? (
                  <Carousel className="w-full">
                    <CarouselContent className="md:justify-center">
                      {groupedData.map((monthData, index) => {
                        const monthPieData = Object.entries(monthData.trainingTypes)
                          .filter(([_, value]) => value > 0)
                          .map(([name, value]) => ({ name, value: Math.round(value) }))
                          .sort((a, b) => b.value - a.value);

                        return (
                          <CarouselItem key={index} className="basis-1/3 md:basis-1/5">
                            <div className="flex flex-col items-center p-1">
                              <div className="text-[10px] font-medium mb-1">{monthData.period}</div>
                              <div className="text-[8px] text-gray-500">{formatMinutes(monthData.total)}</div>
                              {monthPieData.length > 0 ? (
                                <ResponsiveContainer width={80} height={80}>
                                  <PieChart>
                                    <Pie
                                      data={monthPieData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={15}
                                      outerRadius={35}
                                      dataKey="value"
                                      stroke="none"
                                    >
                                      {monthPieData.map((entry, i) => (
                                        <Cell key={`cell-${i}`} fill={COLORS[entry.name] || '#ccc'} />
                                      ))}
                                    </Pie>
                                  </PieChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="w-[80px] h-[80px] flex items-center justify-center">
                                  <div className="w-[70px] h-[70px] rounded-full border-2 border-dashed border-gray-300" />
                                </div>
                              )}
                              <div className="flex flex-wrap justify-center gap-1 mt-1">
                                {monthPieData.map((item, i) => (
                                  <div key={i} className="flex items-center gap-0.5">
                                    <div className="w-2 h-2" style={{ backgroundColor: COLORS[item.name] || '#ccc' }} />
                                    <span className="text-[8px]">{TRAINING_TYPE_LABELS[item.name] || item.name}</span>
                                    <span className="text-[8px] text-gray-500">({formatMinutes(item.value)})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>
                    <CarouselPrevious className="left-0 h-6 w-6" />
                    <CarouselNext className="right-0 h-6 w-6" />
                  </Carousel>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Δεν υπάρχουν ολοκληρωμένες προπονήσεις
                  </div>
                )}
              </>
            )}

            {/* ActiveTab view - single pie chart (for calendar page) */}
            {activeTab && pieData.length > 0 && (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width={80} height={80}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={15}
                      outerRadius={35}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#ccc'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center gap-0.5">
                      <div className="w-2 h-2" style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] }} />
                      <span className="text-[8px]">{TRAINING_TYPE_LABELS[item.name] || item.name}</span>
                      <span className="text-[8px] text-gray-500">({formatMinutes(item.value)})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
