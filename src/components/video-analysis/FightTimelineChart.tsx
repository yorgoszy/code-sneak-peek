import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TimelineDataPoint } from '@/hooks/useFightStats';

interface FightTimelineChartProps {
  data: TimelineDataPoint[];
  loading?: boolean;
}

export const FightTimelineChart: React.FC<FightTimelineChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-4">
          <div className="h-48 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Φόρτωση...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-4">
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            Δεν υπάρχουν δεδομένα χρονολογίου
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardContent className="p-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600">Ανά 30"</span>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#00ffba]"></span>Χτυπ.</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500"></span>Δέχτ.</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-violet-500"></span>Άμυν.</span>
          </div>
        </div>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 2, right: 2, left: -25, bottom: 0 }} barSize={8}>
              <CartesianGrid strokeDasharray="2 2" stroke="#e5e5e5" vertical={false} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 8 }} 
                stroke="#9ca3af"
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 8 }} 
                stroke="#9ca3af"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e5e5',
                  borderRadius: 0,
                  fontSize: 10,
                  padding: '4px 8px'
                }}
                labelFormatter={(label) => label}
              />
              <Bar 
                dataKey="strikes" 
                name="Χτυπ." 
                fill="#00ffba" 
                radius={[1, 1, 0, 0]}
              />
              <Bar 
                dataKey="attacks" 
                name="Δέχτ." 
                fill="#ef4444" 
                radius={[1, 1, 0, 0]}
              />
              <Bar 
                dataKey="defenses" 
                name="Άμυν." 
                fill="#8b5cf6" 
                radius={[1, 1, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
