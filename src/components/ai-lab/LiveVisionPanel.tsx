/**
 * LiveVisionPanel
 * Real-time AI vision analysis panel for the AI Lab.
 * Captures frames from ring cameras and sends them to Gemini for live commentary.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Play, Square, Loader2, Brain, Zap, Shield, Swords, RotateCcw } from 'lucide-react';
import { useRingVisionAI, LiveAnalysis } from '@/hooks/useRingVisionAI';

interface LiveVisionPanelProps {
  sport?: string;
  roundNumber?: number;
  fighterNames?: { red: string; blue: string };
  cameraPositions?: string[];
  isTimerRunning?: boolean;
}

const activityIcon = (activity: string) => {
  switch (activity) {
    case 'attacking': return <Swords className="h-3 w-3 text-red-400" />;
    case 'defending': return <Shield className="h-3 w-3 text-blue-400" />;
    case 'clinch': return <Zap className="h-3 w-3 text-yellow-400" />;
    default: return <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />;
  }
};

const actionLevelColor = (level: string) => {
  switch (level) {
    case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

export const LiveVisionPanel: React.FC<LiveVisionPanelProps> = ({
  sport,
  roundNumber,
  fighterNames,
  cameraPositions,
  isTimerRunning,
}) => {
  const {
    isActive,
    isAnalyzing,
    latestAnalysis,
    analyses,
    error,
    start,
    stop,
    reset,
  } = useRingVisionAI({
    sport,
    roundNumber,
    fighterNames,
    cameraPositions,
    intervalMs: 8000,
  });

  return (
    <Card className="rounded-none">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4" />
            AI Vision Live
            {isActive && (
              <div className="w-2 h-2 rounded-full bg-[#00ffba] animate-pulse" />
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            {analyses.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-none h-6 w-6 p-0"
                onClick={reset}
                title="Reset"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant={isActive ? 'destructive' : 'default'}
              size="sm"
              className="rounded-none h-6 text-[10px] px-2"
              onClick={isActive ? stop : start}
            >
              {isActive ? (
                <><Square className="h-3 w-3 mr-1" /> Stop</>
              ) : (
                <><Play className="h-3 w-3 mr-1" /> Start AI</>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {/* Current Status */}
        {isAnalyzing && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Analyzing frame...
          </div>
        )}

        {error && (
          <div className="text-[10px] text-destructive p-1.5 bg-destructive/10 border border-destructive/20">
            {error}
          </div>
        )}

        {/* Latest Analysis */}
        {latestAnalysis && (
          <div className="space-y-2">
            {/* Activity indicators */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 flex-1">
                <div className="w-2.5 h-2.5 bg-red-600 rounded-none" />
                {activityIcon(latestAnalysis.red_activity)}
                <span className="text-[9px] capitalize">{latestAnalysis.red_activity}</span>
              </div>
              <Badge variant="outline" className={`rounded-none text-[8px] px-1.5 ${actionLevelColor(latestAnalysis.action_level)}`}>
                {latestAnalysis.action_level}
              </Badge>
              <div className="flex items-center gap-1 flex-1 justify-end">
                <span className="text-[9px] capitalize">{latestAnalysis.blue_activity}</span>
                {activityIcon(latestAnalysis.blue_activity)}
                <div className="w-2.5 h-2.5 bg-blue-600 rounded-none" />
              </div>
            </div>

            {/* Ring control */}
            <div className="flex items-center gap-1">
              <div className={`h-1 flex-1 rounded-none ${latestAnalysis.ring_control === 'red' ? 'bg-red-500' : latestAnalysis.ring_control === 'blue' ? 'bg-blue-500/30' : 'bg-muted'}`} />
              <span className="text-[8px] text-muted-foreground px-1">Ring</span>
              <div className={`h-1 flex-1 rounded-none ${latestAnalysis.ring_control === 'blue' ? 'bg-blue-500' : latestAnalysis.ring_control === 'red' ? 'bg-red-500/30' : 'bg-muted'}`} />
            </div>

            {/* Commentary */}
            <div className="p-2 bg-muted/50 border border-border">
              <p className="text-[10px] leading-relaxed">{latestAnalysis.commentary}</p>
            </div>

            {/* Strikes */}
            {latestAnalysis.strikes_visible && latestAnalysis.strikes_visible.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {latestAnalysis.strikes_visible.map((s, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={`rounded-none text-[8px] px-1 ${
                      s.corner === 'red' ? 'border-red-500/50 text-red-400' : 'border-blue-500/50 text-blue-400'
                    } ${s.landed ? 'bg-foreground/5' : 'opacity-60'}`}
                  >
                    {s.type} {s.landed ? '✓' : '✗'}
                  </Badge>
                ))}
              </div>
            )}

            {/* Notable technique */}
            {latestAnalysis.notable_technique && (
              <div className="flex items-center gap-1 text-[9px] text-[#00ffba]">
                <Brain className="h-3 w-3" />
                {latestAnalysis.notable_technique}
              </div>
            )}
          </div>
        )}

        {/* No analysis yet */}
        {!latestAnalysis && !isActive && (
          <div className="text-center py-3 text-muted-foreground">
            <Eye className="h-6 w-6 mx-auto mb-1 opacity-30" />
            <p className="text-[10px]">Πάτα Start AI για real-time ανάλυση</p>
            <p className="text-[9px] opacity-60">Αναλύει τα frames των καμερών κάθε 8 δευτ.</p>
          </div>
        )}

        {/* History */}
        {analyses.length > 1 && (
          <>
            <Separator />
            <div className="space-y-1">
              <h4 className="text-[9px] font-medium text-muted-foreground">Ιστορικό ({analyses.length})</h4>
              <ScrollArea className="h-[120px]">
                <div className="space-y-1">
                  {analyses.slice(1, 20).map((a, i) => (
                    <div key={i} className="text-[9px] p-1.5 bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Badge variant="outline" className={`rounded-none text-[7px] px-1 ${actionLevelColor(a.action_level)}`}>
                          {a.action_level}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(a.timestamp).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[9px] leading-snug opacity-80">{a.commentary}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
