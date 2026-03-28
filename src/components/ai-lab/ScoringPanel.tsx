/**
 * ScoringPanel
 * Phase 3: Live round scoring, activity bars, and post-fight report.
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Trophy, Timer, Play, Square, FileText, Loader2, BarChart3, Medal, Swords, Link2,
} from 'lucide-react';
import type { RoundScore, FightReport, ActivitySnapshot } from '@/hooks/useCompetitionScoring';
import type { CompetitionStrike } from '@/hooks/useCompetitionStrikeDetection';

interface ScoringPanelProps {
  currentRound: number;
  roundScores: RoundScore[];
  isRoundActive: boolean;
  report: FightReport | null;
  isGeneratingReport: boolean;
  activityTimeline: ActivitySnapshot[];
  onStartRound: () => void;
  onEndRound: () => void;
  onGenerateReport: () => void;
  onReset: () => void;
  totalStrikes: { red: number; blue: number };
  ringSynced?: boolean;
}

export const ScoringPanel: React.FC<ScoringPanelProps> = ({
  currentRound,
  roundScores,
  isRoundActive,
  report,
  isGeneratingReport,
  activityTimeline,
  onStartRound,
  onEndRound,
  onGenerateReport,
  onReset,
  totalStrikes,
  ringSynced = false,
}) => {
  const [reportOpen, setReportOpen] = useState(false);

  // Total scores across rounds
  const totalRedScore = roundScores.reduce((a, r) => a + r.redScore, 0);
  const totalBlueScore = roundScores.reduce((a, r) => a + r.blueScore, 0);

  return (
    <>
      <Card className="rounded-none h-fit">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4" /> Scoring Engine
            <Badge className="rounded-none bg-[#cb8954] text-black text-[9px] ml-auto">
              Phase 3
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          {/* Round Controls */}
          {ringSynced ? (
            <div className="flex items-center gap-2 p-2 bg-muted/30 border border-border rounded-none">
              <Link2 className="h-3.5 w-3.5 text-[#00ffba]" />
              <span className="text-xs text-muted-foreground">
                Synced με το χρονόμετρο ρινγκ
              </span>
              {isRoundActive && (
                <Badge variant="outline" className="rounded-none animate-pulse text-[10px] ml-auto">
                  <Timer className="h-3 w-3 mr-1" /> R{currentRound} LIVE
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={isRoundActive ? onEndRound : onStartRound}
                size="sm"
                className={`rounded-none flex-1 text-xs ${
                  isRoundActive
                    ? 'bg-destructive hover:bg-destructive/90'
                    : 'bg-[#00ffba] hover:bg-[#00ffba]/90 text-black'
                }`}
              >
                {isRoundActive ? (
                  <><Square className="h-3 w-3 mr-1" /> End Round {currentRound}</>
                ) : (
                  <><Play className="h-3 w-3 mr-1" /> Start Round {currentRound}</>
                )}
              </Button>
              {isRoundActive && (
                <Badge variant="outline" className="rounded-none animate-pulse text-[10px]">
                  <Timer className="h-3 w-3 mr-1" /> R{currentRound} LIVE
                </Badge>
              )}
            </div>
          )}

          {/* Scoreboard */}
          {roundScores.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium flex items-center gap-1">
                <BarChart3 className="h-3 w-3" /> Scoreboard
              </h4>

              {/* Total */}
              <div className="flex items-center gap-2 p-2 bg-muted/30 border border-border rounded-none">
                <div className="flex-1 text-right">
                  <span className="text-lg font-bold text-red-500">{totalRedScore}</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-medium">TOTAL</div>
                <div className="flex-1 text-left">
                  <span className="text-lg font-bold text-blue-500">{totalBlueScore}</span>
                </div>
              </div>

              {/* Per-round scores */}
              {roundScores.map(rs => (
                <div key={rs.roundNumber} className="flex items-center gap-2 text-xs">
                  <div className="flex-1 text-right">
                    <span className={`font-medium ${rs.dominant === 'red' ? 'text-red-500' : ''}`}>
                      {rs.redScore}
                    </span>
                    <span className="text-[9px] text-muted-foreground ml-1">
                      ({rs.redStrikes})
                    </span>
                  </div>
                  <Badge variant="outline" className="rounded-none text-[9px] w-10 justify-center">
                    R{rs.roundNumber}
                  </Badge>
                  <div className="flex-1 text-left">
                    <span className={`font-medium ${rs.dominant === 'blue' ? 'text-blue-500' : ''}`}>
                      {rs.blueScore}
                    </span>
                    <span className="text-[9px] text-muted-foreground ml-1">
                      ({rs.blueStrikes})
                    </span>
                  </div>
                </div>
              ))}

              {/* Activity Balance */}
              {roundScores.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-medium text-muted-foreground">Activity Balance</h4>
                    {roundScores.map(rs => {
                      const total = rs.redActivity + rs.blueActivity || 1;
                      const redPct = Math.round((rs.redActivity / total) * 100);
                      return (
                        <div key={rs.roundNumber} className="flex items-center gap-1">
                          <span className="text-[9px] w-6 text-right text-muted-foreground">R{rs.roundNumber}</span>
                          <div className="flex-1 h-2 bg-muted rounded-none overflow-hidden flex">
                            <div
                              className="h-full bg-red-500 transition-all"
                              style={{ width: `${redPct}%` }}
                            />
                            <div
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${100 - redPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Live activity during round */}
          {isRoundActive && (
            <>
              <Separator />
              <div className="space-y-1">
                <h4 className="text-[10px] font-medium text-muted-foreground">Live Strike Rate</h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-[9px]">
                      <span className="text-red-400">RED</span>
                      <span>{totalStrikes.red}</span>
                    </div>
                    <Progress value={Math.min(totalStrikes.red * 5, 100)} className="h-1.5 rounded-none" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[9px]">
                      <span className="text-blue-400">BLUE</span>
                      <span>{totalStrikes.blue}</span>
                    </div>
                    <Progress value={Math.min(totalStrikes.blue * 5, 100)} className="h-1.5 rounded-none" />
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Report generation */}
          <div className="space-y-2">
            <Button
              onClick={onGenerateReport}
              disabled={isGeneratingReport || roundScores.length === 0}
              size="sm"
              variant="outline"
              className="rounded-none w-full text-xs"
            >
              {isGeneratingReport ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generating Report...</>
              ) : (
                <><FileText className="h-3 w-3 mr-1" /> Generate AI Report</>
              )}
            </Button>

            {report && (
              <Button
                onClick={() => setReportOpen(true)}
                size="sm"
                variant="outline"
                className="rounded-none w-full text-xs border-[#cb8954]/50 text-[#cb8954]"
              >
                <Medal className="h-3 w-3 mr-1" /> View Report
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Dialog */}
      {report && (
        <FightReportDialog
          report={report}
          open={reportOpen}
          onOpenChange={setReportOpen}
        />
      )}
    </>
  );
};

const FightReportDialog: React.FC<{
  report: FightReport;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}> = ({ report, open, onOpenChange }) => {
  const totalRedScore = report.rounds.reduce((a, r) => a + r.redScore, 0);
  const totalBlueScore = report.rounds.reduce((a, r) => a + r.blueScore, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-[#cb8954]" />
            AI Post-Fight Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Winner Banner */}
          <div className={`p-4 text-center border rounded-none ${
            report.suggestedWinner === 'red'
              ? 'border-red-500/50 bg-red-500/10'
              : report.suggestedWinner === 'blue'
              ? 'border-blue-500/50 bg-blue-500/10'
              : 'border-[#cb8954]/50 bg-[#cb8954]/10'
          }`}>
            <p className="text-xs text-muted-foreground mb-1">Suggested Winner</p>
            <p className="text-lg font-bold">
              {report.suggestedWinner === 'red' ? '🔴 RED CORNER' :
               report.suggestedWinner === 'blue' ? '🔵 BLUE CORNER' : '🤝 DRAW'}
            </p>
            <p className="text-sm text-muted-foreground">{report.winMethod}</p>
            <div className="flex justify-center gap-8 mt-2">
              <div>
                <span className="text-xl font-bold text-red-500">{totalRedScore}</span>
                <p className="text-[10px] text-muted-foreground">{report.totalRedStrikes} strikes</p>
              </div>
              <div className="text-muted-foreground self-center">vs</div>
              <div>
                <span className="text-xl font-bold text-blue-500">{totalBlueScore}</span>
                <p className="text-[10px] text-muted-foreground">{report.totalBlueStrikes} strikes</p>
              </div>
            </div>
          </div>

          {/* Round Breakdown */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
              <BarChart3 className="h-4 w-4" /> Round Breakdown
            </h3>
            <div className="space-y-1">
              {report.rounds.map(r => (
                <div key={r.roundNumber} className="flex items-center gap-3 p-2 border border-border rounded-none">
                  <Badge variant="outline" className="rounded-none text-[10px] w-8 justify-center">
                    R{r.roundNumber}
                  </Badge>
                  <div className="flex-1 flex items-center gap-2">
                    <span className={`text-sm font-bold ${r.dominant === 'red' ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {r.redScore}
                    </span>
                    <div className="flex-1 h-2 bg-muted rounded-none overflow-hidden flex">
                      <div className="h-full bg-red-500" style={{ width: `${r.redActivity}%` }} />
                      <div className="h-full bg-blue-500" style={{ width: `${r.blueActivity}%` }} />
                    </div>
                    <span className={`text-sm font-bold ${r.dominant === 'blue' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                      {r.blueScore}
                    </span>
                  </div>
                  <div className="text-[9px] text-muted-foreground w-16 text-right">
                    {r.redStrikes} vs {r.blueStrikes}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border border-red-500/30 rounded-none">
              <h4 className="text-xs font-medium text-red-400 mb-2">🔴 Red Highlights</h4>
              {report.redHighlights.length > 0 ? (
                <ul className="space-y-1">
                  {report.redHighlights.map((h, i) => (
                    <li key={i} className="text-[10px] text-muted-foreground">• {h}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[10px] text-muted-foreground">No data</p>
              )}
            </div>
            <div className="p-3 border border-blue-500/30 rounded-none">
              <h4 className="text-xs font-medium text-blue-400 mb-2">🔵 Blue Highlights</h4>
              {report.blueHighlights.length > 0 ? (
                <ul className="space-y-1">
                  {report.blueHighlights.map((h, i) => (
                    <li key={i} className="text-[10px] text-muted-foreground">• {h}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[10px] text-muted-foreground">No data</p>
              )}
            </div>
          </div>

          {/* Summary */}
          {report.summary && (
            <div className="p-3 bg-muted/30 border border-border rounded-none">
              <h4 className="text-xs font-medium mb-1">📋 Summary</h4>
              <p className="text-xs text-muted-foreground whitespace-pre-line">{report.summary}</p>
            </div>
          )}

          {/* Technical Analysis */}
          {report.technicalAnalysis && (
            <div className="p-3 bg-muted/30 border border-border rounded-none">
              <h4 className="text-xs font-medium mb-1">🔬 Technical Analysis</h4>
              <p className="text-xs text-muted-foreground whitespace-pre-line">{report.technicalAnalysis}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
