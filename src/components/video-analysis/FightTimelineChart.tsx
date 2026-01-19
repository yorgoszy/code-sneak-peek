import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TimelineDataPoint, RoundBoundary } from '@/hooks/useFightStats';

interface FightTimelineChartProps {
  data: TimelineDataPoint[];
  roundBoundaries?: RoundBoundary[];
  loading?: boolean;
}

export const FightTimelineChart: React.FC<FightTimelineChartProps> = ({ data, roundBoundaries = [], loading }) => {
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
            {roundBoundaries.length > 1 && (
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-gray-400"></span>Round</span>
            )}
          </div>
        </div>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 2, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStrikes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ffba" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#00ffba" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDefenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
              {/* Round boundaries - skip first round (starts at 0) */}
              {roundBoundaries.slice(1).map((boundary) => (
                <ReferenceLine
                  key={`round-${boundary.roundNumber}`}
                  x={boundary.startTimeLabel}
                  stroke="#9ca3af"
                  strokeDasharray="4 2"
                  strokeWidth={1}
                  label={{
                    value: `R${boundary.roundNumber}`,
                    position: 'top',
                    fontSize: 8,
                    fill: '#6b7280',
                    offset: -2
                  }}
                />
              ))}
              <Area 
                type="monotone"
                dataKey="strikes" 
                name="Χτυπ." 
                stroke="#00ffba" 
                strokeWidth={2}
                fill="url(#colorStrikes)"
              />
              <Area 
                type="monotone"
                dataKey="attacks" 
                name="Δέχτ." 
                stroke="#ef4444" 
                strokeWidth={2}
                fill="url(#colorAttacks)"
              />
              <Area 
                type="monotone"
                dataKey="defenses" 
                name="Άμυν." 
                stroke="#8b5cf6" 
                strokeWidth={2}
                fill="url(#colorDefenses)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
