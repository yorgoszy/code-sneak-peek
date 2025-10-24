import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfWeek, startOfMonth, parseISO } from "date-fns";
import { el } from "date-fns/locale";
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
  }, [userPrograms, timeFilter, isLoading]);

  const calculateTrainingTypesData = () => {
    console.log('📊 Calculating training types data...');
    console.log('📊 User programs count:', userPrograms.length);
    
    const periodData: Record<string, Record<string, number>> = {};

    userPrograms.forEach((program, programIndex) => {
      const stats = calculateProgramStats(program);
      
      console.log(`📊 Program ${programIndex + 1}: ${program.programs?.name}`);
      console.log(`📊 Block stats count:`, stats.blockStats.length);
      
      // Για κάθε block, προσθέτουμε τον χρόνο του στον τύπο του
      stats.blockStats.forEach((blockStat, blockIndex) => {
        if (!blockStat.training_type) {
          console.log(`⚠️ Block ${blockIndex + 1} has no training_type`);
          return;
        }
        
        const typeLabel = TRAINING_TYPE_LABELS[blockStat.training_type] || blockStat.training_type;
        const timeMinutes = Math.round(blockStat.time / 60);
        
        console.log(`✅ Block ${blockIndex + 1}: ${blockStat.training_type} -> ${typeLabel}, ${timeMinutes}min`);
        
        // Για κάθε training date, προσθέτουμε τα stats
        program.training_dates?.forEach((dateStr) => {
          const date = parseISO(dateStr);
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

  const totalMinutes = chartData.reduce((sum, item) => sum + item.value, 0);

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

  if (data.length === 0) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-sm md:text-base">Ανάλυση Τύπων Προπόνησης</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">Δεν υπάρχουν δεδομένα για εμφάνιση</p>
            <p className="text-xs text-gray-400">
              Βεβαιωθείτε ότι έχετε ορίσει τύπο προπόνησης (str, end, pwr κτλ.) σε κάθε μπλοκ του προγράμματος
            </p>
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
      </CardContent>
    </Card>
  );
};
