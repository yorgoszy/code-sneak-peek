/**
 * ModelPerformancePanel — Phase 5
 * Shows accuracy metrics, threshold adjustments, and training progress.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Brain, RefreshCw, Loader2, TrendingUp, Target, AlertTriangle, BarChart3,
} from 'lucide-react';
import type { LearningState } from '@/hooks/useAdaptiveLearning';

interface ModelPerformancePanelProps {
  state: LearningState;
  onLearn: () => void;
}

export const ModelPerformancePanel: React.FC<ModelPerformancePanelProps> = ({
  state,
  onLearn,
}) => {
  const { metrics, adjustedThresholds, baseThresholds, isLearning, totalTrainingSamples } = state;
  const accuracyPct = Math.round(metrics.accuracyRate * 100);

  return (
    <Card className="rounded-none h-fit">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4" /> Model Performance
          <Badge className="rounded-none bg-[#cb8954] text-black text-[9px] ml-auto">
            Phase 5
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        {/* Learn Button */}
        <Button
          onClick={onLearn}
          disabled={isLearning}
          size="sm"
          className="rounded-none w-full text-xs bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
        >
          {isLearning ? (
            <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Εκπαίδευση...</>
          ) : (
            <><RefreshCw className="h-3 w-3 mr-1" /> Εκπαίδευση από Labels</>
          )}
        </Button>

        {totalTrainingSamples === 0 ? (
          <div className="text-center py-3 text-muted-foreground text-xs">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Δεν υπάρχουν δεδομένα εκπαίδευσης</p>
            <p className="text-[10px] mt-1">Αποθήκευσε labels στο Phase 4 πρώτα</p>
          </div>
        ) : (
          <>
            {/* Overall Accuracy */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" /> Ακρίβεια
                </span>
                <span className={`font-bold ${
                  accuracyPct >= 80 ? 'text-[#00ffba]' :
                  accuracyPct >= 60 ? 'text-[#cb8954]' :
                  'text-destructive'
                }`}>
                  {accuracyPct}%
                </span>
              </div>
              <Progress value={accuracyPct} className="h-2 rounded-none" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{metrics.correctCount} σωστά</span>
                <span>{metrics.correctedCount} διορθωμένα</span>
                <span>{totalTrainingSamples} σύνολο</span>
              </div>
            </div>

            <Separator />

            {/* Per-Category Accuracy */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Ακρίβεια ανά κατηγορία
              </h4>
              {Object.entries(metrics.perCategory).map(([cat, stats]) => (
                <div key={cat} className="flex items-center gap-2 text-[10px]">
                  <span className="w-12 text-muted-foreground capitalize">{cat}</span>
                  <div className="flex-1">
                    <Progress
                      value={Math.round(stats.accuracy * 100)}
                      className="h-1.5 rounded-none"
                    />
                  </div>
                  <span className="w-8 text-right font-mono">
                    {Math.round(stats.accuracy * 100)}%
                  </span>
                  <span className="w-6 text-right text-muted-foreground">
                    ({stats.total})
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Threshold Adjustments */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Velocity Thresholds
              </h4>
              {(Object.keys(baseThresholds) as Array<keyof typeof baseThresholds>).map(key => {
                const base = baseThresholds[key];
                const adj = adjustedThresholds[key];
                const diff = adj - base;
                const diffPct = Math.round((diff / base) * 100);
                return (
                  <div key={key} className="flex items-center justify-between text-[10px]">
                    <span className="capitalize text-muted-foreground">{key}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground">{base}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className={`font-mono font-bold ${
                        diff > 0 ? 'text-[#cb8954]' : diff < 0 ? 'text-[#00ffba]' : ''
                      }`}>
                        {adj}
                      </span>
                      {diff !== 0 && (
                        <Badge variant="outline" className={`rounded-none text-[8px] px-1 ${
                          diff > 0 ? 'border-[#cb8954]/50 text-[#cb8954]' : 'border-[#00ffba]/50 text-[#00ffba]'
                        }`}>
                          {diff > 0 ? '+' : ''}{diffPct}%
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top confusion pairs */}
            {metrics.confusionPairs.length > 0 && (
              <>
                <Separator />
                <div className="space-y-1">
                  <h4 className="text-[10px] font-medium">Top Corrections</h4>
                  {metrics.confusionPairs.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">→ {p.actual}</span>
                      <Badge variant="outline" className="rounded-none text-[8px]">
                        {p.count}x
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}

            {state.lastUpdated && (
              <p className="text-[9px] text-muted-foreground text-center">
                Τελευταία ενημέρωση: {new Date(state.lastUpdated).toLocaleTimeString('el-GR')}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
