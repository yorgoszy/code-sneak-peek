import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

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
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainingTypes();
  }, [userId, assignmentId, timeFilter]);

  const fetchTrainingTypes = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('workout_training_types')
        .select(`
          *,
          workout_completions!inner(
            user_id,
            assignment_id,
            scheduled_date,
            status
          )
        `)
        .eq('workout_completions.user_id', userId)
        .eq('workout_completions.status', 'completed');

      // Filter by assignment if specified
      if (assignmentId) {
        query = query.eq('workout_completions.assignment_id', assignmentId);
      }

      // Apply time filter
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (timeFilter) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'week':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'all':
          // No date filter for 'all'
          startDate = new Date(0);
          break;
      }

      if (timeFilter !== 'all') {
        query = query
          .gte('workout_completions.scheduled_date', format(startDate, 'yyyy-MM-dd'))
          .lte('workout_completions.scheduled_date', format(endDate, 'yyyy-MM-dd'));
      }

      const { data: trainingTypes, error } = await query;

      if (error) throw error;

      // Aggregate by training type
      const aggregated = trainingTypes.reduce((acc: any, item: any) => {
        const type = item.training_type;
        if (!acc[type]) {
          acc[type] = {
            name: TRAINING_TYPE_LABELS[type] || type,
            value: 0,
            color: COLORS[type as keyof typeof COLORS] || '#aca097'
          };
        }
        acc[type].value += parseFloat(item.duration_minutes) || 0;
        return acc;
      }, {});

      // Convert to array and filter out zero values
      const chartData = Object.values(aggregated)
        .filter((item: any) => item.value > 0)
        .map((item: any) => ({
          ...item,
          value: Math.round(item.value) // Round to whole minutes
        }));

      setData(chartData);
    } catch (error) {
      console.error('Error fetching training types:', error);
      setData([]);
    } finally {
      setLoading(false);
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
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm md:text-base">Ανάλυση Τύπων Προπόνησης</CardTitle>
            <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
              <SelectTrigger className="w-[180px] rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="day">Σήμερα</SelectItem>
                <SelectItem value="week">Αυτή την Εβδομάδα</SelectItem>
                <SelectItem value="month">Αυτόν τον Μήνα</SelectItem>
                <SelectItem value="all">Όλες οι Προπονήσεις</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Δεν υπάρχουν δεδομένα για την επιλεγμένη περίοδο
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm md:text-base">Ανάλυση Τύπων Προπόνησης</CardTitle>
          <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
            <SelectTrigger className="w-[180px] rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="day">Σήμερα</SelectItem>
              <SelectItem value="week">Αυτή την Εβδομάδα</SelectItem>
              <SelectItem value="month">Αυτόν τον Μήνα</SelectItem>
              <SelectItem value="all">Όλες οι Προπονήσεις</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
