import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { format, startOfWeek, startOfMonth, parseISO, endOfWeek, addWeeks, subWeeks, addMonths, subMonths, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { el } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface TrainingTypesPieChartProps {
  userId: string;
  hideTimeTabs?: boolean;
  activeTab?: 'month' | 'week' | 'day';
}

const COLORS = {
  strength: '#ff3131',
  endurance: '#8045ed',
  power: '#fa009a',
  speed: '#a4e1ff',
};

const TRAINING_TYPE_LABELS: Record<string, string> = {
  strength: 'Δύναμη',
  endurance: 'Αντοχή',
  power: 'Ισχύς',
  speed: 'Ταχύτητα',
};

interface WorkoutStat {
  id: string;
  user_id: string;
  assignment_id: string;
  scheduled_date: string;
  total_duration_minutes: number;
  total_volume_kg: number;
  strength_minutes: number;
  endurance_minutes: number;
  power_minutes: number;
  speed_minutes: number;
}

export const TrainingTypesPieChart: React.FC<TrainingTypesPieChartProps> = ({ userId, hideTimeTabs = false, activeTab }) => {
  const [workoutStats, setWorkoutStats] = useState<WorkoutStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('week');
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<string>('');
  
  // Συγχρονίζουμε το timeFilter με το activeTab αν υπάρχει
  useEffect(() => {
    if (activeTab) {
      setTimeFilter(activeTab);
    }
  }, [activeTab]);

  // Φόρτωση δεδομένων από workout_stats
  useEffect(() => {
    const fetchWorkoutStats = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('workout_stats')
          .select('*')
          .eq('user_id', userId)
          .order('scheduled_date', { ascending: false });

        if (error) {
          console.error('Error fetching workout stats:', error);
          setWorkoutStats([]);
        } else {
          setWorkoutStats(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
        setWorkoutStats([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchWorkoutStats();
    }
  }, [userId]);

  // Φιλτράρισμα δεδομένων με βάση το time filter
  const filteredStats = useMemo(() => {
    if (workoutStats.length === 0) return [];

    const today = new Date();
    const weekStart = startOfWeek(currentWeek, { locale: el, weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { locale: el, weekStartsOn: 1 });
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    let filterStart: Date;
    let filterEnd: Date;

    if (activeTab === 'day') {
      filterStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      filterEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    } else if (activeTab === 'week') {
      filterStart = startOfWeek(today, { locale: el, weekStartsOn: 1 });
      filterEnd = endOfWeek(today, { locale: el, weekStartsOn: 1 });
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
      filterStart = startOfYear(today);
      filterEnd = endOfYear(today);
    }

    return workoutStats.filter(stat => {
      const date = parseISO(stat.scheduled_date);
      return isWithinInterval(date, { start: filterStart, end: filterEnd });
    });
  }, [workoutStats, timeFilter, currentWeek, currentMonth, activeTab]);

  // Ομαδοποίηση δεδομένων ανά περίοδο
  const groupedData = useMemo(() => {
    const groups: Record<string, { strength: number; endurance: number; power: number; speed: number; total: number }> = {};

    filteredStats.forEach(stat => {
      const date = parseISO(stat.scheduled_date);
      let periodKey = '';

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

      if (!groups[periodKey]) {
        groups[periodKey] = { strength: 0, endurance: 0, power: 0, speed: 0, total: 0 };
      }

      groups[periodKey].strength += stat.strength_minutes || 0;
      groups[periodKey].endurance += stat.endurance_minutes || 0;
      groups[periodKey].power += stat.power_minutes || 0;
      groups[periodKey].speed += stat.speed_minutes || 0;
      groups[periodKey].total += stat.total_duration_minutes || 0;
    });

    return Object.entries(groups).map(([period, data]) => ({
      period,
      ...data
    }));
  }, [filteredStats, timeFilter, activeTab]);

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

  // Δεδομένα για pie chart
  const pieData = useMemo(() => {
    const totals = groupedData.reduce((acc, item) => ({
      strength: acc.strength + item.strength,
      endurance: acc.endurance + item.endurance,
      power: acc.power + item.power,
      speed: acc.speed + item.speed
    }), { strength: 0, endurance: 0, power: 0, speed: 0 });

    return Object.entries(totals)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
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

    const shortLabels: Record<string, string> = {
      strength: 'str',
      endurance: 'end',
      power: 'pwr',
      speed: 'spd'
    };

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
        {`${shortLabels[name] || name}: ${formatMinutes(value)}`}
      </text>
    );
  };

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

        {groupedData.length === 0 || pieData.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Δεν υπάρχουν ολοκληρωμένες προπονήσεις
          </div>
        ) : (
          <>
            {/* Day view with carousel */}
            {!activeTab && timeFilter === 'day' && groupedData.length > 0 && (
              <Carousel className="w-full">
                <CarouselContent>
                  {groupedData.map((dayData, index) => {
                    const dayPieData = [
                      { name: 'strength', value: dayData.strength },
                      { name: 'endurance', value: dayData.endurance },
                      { name: 'power', value: dayData.power },
                      { name: 'speed', value: dayData.speed }
                    ].filter(item => item.value > 0);

                    return (
                      <CarouselItem key={index} className="basis-1/3">
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
                                    <Cell key={`cell-${i}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#ccc'} />
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
                                <div className="w-2 h-2" style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] }} />
                                <span className="text-[8px]">{item.name.slice(0, 3)}</span>
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

            {/* Week/Month/ActiveTab view - single pie chart */}
            {(activeTab || timeFilter !== 'day') && pieData.length > 0 && (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                      stroke="none"
                      label={renderCustomLabel}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#ccc'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] }} />
                      <span className="text-xs">{TRAINING_TYPE_LABELS[item.name] || item.name}</span>
                      <span className="text-xs text-gray-500">({formatMinutes(item.value)})</span>
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
