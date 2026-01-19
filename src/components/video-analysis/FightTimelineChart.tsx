import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RoundTimelineData } from '@/hooks/useFightStats';

interface FightTimelineChartProps {
  roundsData: RoundTimelineData[];
  loading?: boolean;
}

export const FightTimelineChart: React.FC<FightTimelineChartProps> = ({ roundsData, loading }) => {
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

  if (!roundsData || roundsData.length === 0) {
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
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500"></span>Χτυπ.</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500"></span>Δέχτ.</span>
          </div>
        </div>
        
        {/* Rounds displayed horizontally with gaps */}
        <div className="flex gap-2">
          {roundsData.map((round) => (
            <div key={round.roundNumber} className="flex-1 min-w-0">
              <div className="text-[10px] text-center text-gray-500 mb-0.5">
                R{round.roundNumber}
              </div>
              <div className="h-20 border border-gray-100 rounded-none">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={round.data} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`colorStrikes-${round.roundNumber}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id={`colorAttacks-${round.roundNumber}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e5e5e5" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 7 }} 
                      stroke="#9ca3af"
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 7 }} 
                      stroke="#9ca3af"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      width={20}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e5e5',
                        borderRadius: 0,
                        fontSize: 9,
                        padding: '3px 6px'
                      }}
                      labelFormatter={(label) => `R${round.roundNumber} - ${label}`}
                    />
                    <Area 
                      type="monotone"
                      dataKey="strikes" 
                      name="Χτυπ." 
                      stroke="#3b82f6" 
                      strokeWidth={1.5}
                      fill={`url(#colorStrikes-${round.roundNumber})`}
                    />
                    <Area 
                      type="monotone"
                      dataKey="attacks" 
                      name="Δέχτ." 
                      stroke="#ef4444" 
                      strokeWidth={1.5}
                      fill={`url(#colorAttacks-${round.roundNumber})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
