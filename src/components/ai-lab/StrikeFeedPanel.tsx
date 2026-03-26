/**
 * StrikeFeedPanel
 * Live strike feed and per-corner stats for competition analysis.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Swords, Target } from 'lucide-react';
import type { CompetitionStrike, CornerStats } from '@/hooks/useCompetitionStrikeDetection';

const STRIKE_LABELS: Record<string, string> = {
  jab: 'Jab', cross: 'Cross', hook: 'Hook', uppercut: 'Uppercut',
  front_kick: 'Front Kick', roundhouse_kick: 'Roundhouse', side_kick: 'Side Kick',
  knee: 'Knee', elbow: 'Elbow', spinning_elbow: 'Spinning Elbow', clinch: 'Clinch',
};

const CATEGORY_COLORS: Record<string, string> = {
  punch: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  kick: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  knee: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  elbow: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

interface StrikeFeedPanelProps {
  strikes: CompetitionStrike[];
  redStats: CornerStats;
  blueStats: CornerStats;
  isActive: boolean;
}

export const StrikeFeedPanel: React.FC<StrikeFeedPanelProps> = ({
  strikes,
  redStats,
  blueStats,
  isActive,
}) => {
  const recentStrikes = strikes.slice(-15).reverse();

  return (
    <Card className="rounded-none h-fit">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Swords className="h-4 w-4" /> Strike Detection
          {isActive && (
            <Badge className="rounded-none bg-[#00ffba] text-black text-[9px] ml-auto">
              LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        {/* Corner comparison */}
        <div className="grid grid-cols-2 gap-2">
          <CornerStatsCard corner="red" stats={redStats} />
          <CornerStatsCard corner="blue" stats={blueStats} />
        </div>

        {/* Category breakdown */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Punches</span>
            <span><span className="text-red-400">{redStats.punches}</span> / <span className="text-blue-400">{blueStats.punches}</span></span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kicks</span>
            <span><span className="text-red-400">{redStats.kicks}</span> / <span className="text-blue-400">{blueStats.kicks}</span></span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Knees</span>
            <span><span className="text-red-400">{redStats.knees}</span> / <span className="text-blue-400">{blueStats.knees}</span></span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Elbows</span>
            <span><span className="text-red-400">{redStats.elbows}</span> / <span className="text-blue-400">{blueStats.elbows}</span></span>
          </div>
        </div>

        <Separator />

        {/* Live feed */}
        <div className="space-y-1">
          <h4 className="text-xs font-medium flex items-center gap-1">
            <Target className="h-3 w-3" /> Live Feed
          </h4>
          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {recentStrikes.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-3">
                {isActive ? 'Αναμονή ανίχνευσης...' : 'Ξεκίνησε το detection'}
              </p>
            ) : (
              recentStrikes.map(strike => (
                <StrikeItem key={strike.id} strike={strike} />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CornerStatsCard: React.FC<{ corner: 'red' | 'blue'; stats: CornerStats }> = ({ corner, stats }) => {
  const isRed = corner === 'red';
  return (
    <div className={`p-2 border rounded-none text-center ${
      isRed ? 'border-red-500/30 bg-red-500/5' : 'border-blue-500/30 bg-blue-500/5'
    }`}>
      <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${isRed ? 'bg-red-500' : 'bg-blue-500'}`} />
      <p className="text-[10px] font-medium">{isRed ? 'RED' : 'BLUE'}</p>
      <p className="text-lg font-bold">{stats.total}</p>
      <p className="text-[9px] text-muted-foreground">strikes</p>
    </div>
  );
};

const StrikeItem: React.FC<{ strike: CompetitionStrike }> = ({ strike }) => {
  const isRed = strike.corner === 'red';
  const elapsed = ((Date.now() - strike.timestamp) / 1000).toFixed(0);

  return (
    <div className={`flex items-center gap-1.5 p-1 border-l-2 ${
      isRed ? 'border-l-red-500 bg-red-500/5' : 'border-l-blue-500 bg-blue-500/5'
    }`}>
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isRed ? 'bg-red-500' : 'bg-blue-500'}`} />
      <Badge className={`rounded-none text-[8px] px-1 py-0 border ${CATEGORY_COLORS[strike.category] || ''}`}>
        {STRIKE_LABELS[strike.type] || strike.type}
      </Badge>
      <span className="text-[9px] text-muted-foreground ml-auto">{elapsed}s ago</span>
    </div>
  );
};
