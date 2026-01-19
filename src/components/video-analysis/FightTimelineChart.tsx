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
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-medium">Ανάλυση ανά 30"</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10 }} 
                stroke="#9ca3af"
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                stroke="#9ca3af"
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e5e5',
                  borderRadius: 0,
                  fontSize: 12
                }}
                labelFormatter={(label) => `Χρόνος: ${label}`}
              />
              <Legend 
                wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
                formatter={(value) => {
                  if (value === 'strikes') return 'Χτυπήματα';
                  if (value === 'attacks') return 'Δέχτηκε';
                  if (value === 'defenses') return 'Άμυνες';
                  return value;
                }}
              />
              <Bar 
                dataKey="strikes" 
                name="strikes" 
                fill="#00ffba" 
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="attacks" 
                name="attacks" 
                fill="#ef4444" 
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="defenses" 
                name="defenses" 
                fill="#8b5cf6" 
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
