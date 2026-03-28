/**
 * CompetitionAnalysisTab
 * AI Lab tab for real-time pose detection, fighter tracking, and strike detection.
 * Phase 1: MediaPipe skeleton overlay + Red/Blue corner identification.
 * Phase 2: Real-time strike classification with per-corner stats.
 * Phase 3: Round-based scoring synced with federation ring timer.
 * Phase 4: Data labeling for model training.
 */
import React, { useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Play, Square, Loader2, Brain, Activity, Zap, Users, Eye, RotateCcw, Link2,
} from 'lucide-react';
import { PoseOverlayFeed } from './PoseOverlayFeed';
import { StrikeFeedPanel } from './StrikeFeedPanel';
import { ScoringPanel } from './ScoringPanel';
import { DataLabelingPanel } from './DataLabelingPanel';
import { useCompetitionPoseAnalysis } from '@/hooks/useCompetitionPoseAnalysis';
import { useCompetitionStrikeDetection } from '@/hooks/useCompetitionStrikeDetection';
import { useCompetitionScoring } from '@/hooks/useCompetitionScoring';
import { useRingScoringSync } from '@/hooks/useRingScoringSync';

interface AnalysisCamera {
  id: string;
  ring_id: string;
  camera_index: number;
  camera_label: string;
  position: string;
  stream_url: string | null;
  is_active: boolean;
  fps: number;
}

interface CompetitionAnalysisTabProps {
  cameras: AnalysisCamera[];
  currentMatch: any;
  positionLabels: Record<string, string>;
  ringId?: string;
}

export const CompetitionAnalysisTab: React.FC<CompetitionAnalysisTabProps> = ({
  cameras,
  currentMatch,
  positionLabels,
  ringId,
}) => {
  // Ring sync — reads round state from federation live dashboard
  const ringSync = useRingScoringSync(ringId || null);

  // Strike detection
  const strikeDetection = useCompetitionStrikeDetection();

  // Scoring engine (Phase 3) — now synced with ring timer
  const scoring = useCompetitionScoring();

  // Connect ring timer events to scoring engine
  useEffect(() => {
    ringSync.setOnRoundStart((round: number) => {
      scoring.startRound(round);
    });
    ringSync.setOnRoundEnd((_round: number) => {
      scoring.endRound();
    });
  }, [ringSync.setOnRoundStart, ringSync.setOnRoundEnd, scoring.startRound, scoring.endRound]);

  // Pose analysis with strike detection callback
  const {
    isInitialized,
    isLoading,
    isRunning,
    error,
    fps,
    fighterData,
    initialize,
    startDetection,
    stopDetection,
    stopAll,
    destroy,
  } = useCompetitionPoseAnalysis(strikeDetection.analyzeFrame);

  const activeCameras = cameras.filter(c => c.is_active && c.stream_url?.startsWith('webcam:'));

  // Feed new strikes to scoring engine
  const prevStrikeCountRef = React.useRef(0);
  useEffect(() => {
    if (strikeDetection.strikes.length > prevStrikeCountRef.current) {
      const newStrikes = strikeDetection.strikes.slice(prevStrikeCountRef.current);
      newStrikes.forEach(s => scoring.recordStrike(s));
      prevStrikeCountRef.current = strikeDetection.strikes.length;
    }
  }, [strikeDetection.strikes, scoring.recordStrike]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { destroy(); };
  }, [destroy]);

  const handleVideoReady = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement, camIndex: number) => {
      if (isInitialized && isRunning) {
        startDetection(camIndex, video, canvas);
      }
    },
    [isInitialized, isRunning, startDetection]
  );

  const handleVideoStopped = useCallback(
    (camIndex: number) => {
      stopDetection(camIndex);
    },
    [stopDetection]
  );

  const handleStartAll = async () => {
    if (!isInitialized) {
      await initialize();
    }
    strikeDetection.start();
  };

  const handleStopAll = () => {
    stopAll();
    strikeDetection.stop();
  };

  const handleReset = () => {
    strikeDetection.reset();
  };

  // Use ring sync names if available, fallback to currentMatch
  const redName = ringSync.connected ? ringSync.redName : ((currentMatch as any)?.athlete1?.name || 'Red Corner');
  const blueName = ringSync.connected ? ringSync.blueName : ((currentMatch as any)?.athlete2?.name || 'Blue Corner');

  // Count total detected fighters across all cameras
  const redDetected = Object.values(fighterData).some(f => f.some(p => p.corner === 'red'));
  const blueDetected = Object.values(fighterData).some(f => f.some(p => p.corner === 'blue'));
  const redStats = strikeDetection.getCornerStats('red');
  const blueStats = strikeDetection.getCornerStats('blue');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Competition Analysis
            <Badge variant="outline" className="rounded-none text-[10px]">Phase 4</Badge>
          </h2>
          <p className="text-xs text-muted-foreground">
            Real-time strike detection, scoring & data labeling — Red/Blue corner
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Ring sync indicator */}
          {ringSync.connected && (
            <Badge variant="outline" className="rounded-none text-[10px] border-[#00ffba]/50 text-[#00ffba]">
              <Link2 className="h-3 w-3 mr-1" />
              Ring Synced
              {ringSync.isTimerRunning && !ringSync.isBreak && (
                <span className="ml-1">• R{ringSync.currentRound}</span>
              )}
              {ringSync.isBreak && <span className="ml-1">• BRK</span>}
            </Badge>
          )}
          {isRunning && (
            <Badge className="rounded-none bg-[#00ffba] text-black text-xs">
              {fps} FPS
            </Badge>
          )}
          {strikeDetection.isActive && (
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="rounded-none"
              title="Reset strike counters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            onClick={isRunning ? handleStopAll : handleStartAll}
            disabled={isLoading || activeCameras.length === 0}
            className={`rounded-none ${isRunning ? 'bg-destructive hover:bg-destructive/90' : ''}`}
            size="sm"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Loading Model...</>
            ) : isRunning ? (
              <><Square className="h-4 w-4 mr-1" /> Stop</>
            ) : (
              <><Play className="h-4 w-4 mr-1" /> Start Analysis</>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Camera feeds with pose overlay */}
        <div className="lg:col-span-2 space-y-3">
          {activeCameras.length === 0 ? (
            <Card className="rounded-none">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Δεν υπάρχουν ενεργές webcam κάμερες</p>
                <p className="text-xs mt-1">
                  Πήγαινε στο tab "Cameras & Analysis" για να ρυθμίσεις τις κάμερες
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid gap-2 ${activeCameras.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {activeCameras.map(cam => {
                const deviceId = cam.stream_url?.replace('webcam:', '') || '';
                const fighters = fighterData[cam.camera_index] || [];
                return (
                  <Card key={cam.camera_index} className="rounded-none overflow-hidden">
                    <PoseOverlayFeed
                      deviceId={deviceId}
                      cameraIndex={cam.camera_index}
                      position={cam.position}
                      positionLabel={positionLabels[cam.position] || cam.position}
                      onVideoReady={handleVideoReady}
                      onVideoStopped={handleVideoStopped}
                      fighterCount={fighters.length}
                      isDetecting={isRunning}
                    />
                  </Card>
                );
              })}
            </div>
          )}

          {/* Match Info — now using ring sync data */}
          <Card className="rounded-none">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-600 rounded-none" />
                    <span className="text-sm font-medium">{redName}</span>
                    <Badge variant="outline" className="rounded-none text-[9px] ml-1">
                      {redStats.total} strikes
                    </Badge>
                  </div>
                  <span className="text-muted-foreground text-xs">vs</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-600 rounded-none" />
                    <span className="text-sm font-medium">{blueName}</span>
                    <Badge variant="outline" className="rounded-none text-[9px] ml-1">
                      {blueStats.total} strikes
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ringSync.connected && ringSync.isTimerRunning && (
                    <Badge variant={ringSync.isBreak ? 'secondary' : 'default'} className="rounded-none text-[10px]">
                      {ringSync.isBreak ? 'BRK' : `R${ringSync.currentRound}`}
                    </Badge>
                  )}
                  <Badge variant="outline" className="rounded-none text-xs">
                    {currentMatch?.round_number || 3} Rounds
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right panel: Scoring + Strike Feed + Data Labeling + Stats */}
        <div className="space-y-3">
          {/* Scoring Panel (Phase 3) — auto-synced with ring timer */}
          <ScoringPanel
            currentRound={ringSync.connected ? ringSync.currentRound : scoring.currentRound}
            roundScores={scoring.roundScores}
            isRoundActive={scoring.isRoundActive}
            report={scoring.report}
            isGeneratingReport={scoring.isGeneratingReport}
            activityTimeline={scoring.activityTimeline}
            onStartRound={() => scoring.startRound()}
            onEndRound={() => scoring.endRound()}
            onGenerateReport={() => scoring.generateReport(
              strikeDetection.strikes,
              'muay_thai',
              {
                redName,
                blueName,
                totalRounds: currentMatch?.round_number || 3,
              }
            )}
            onReset={() => scoring.resetScoring()}
            totalStrikes={{ red: redStats.total, blue: blueStats.total }}
            ringSynced={ringSync.connected}
          />

          {/* Data Labeling (Phase 4) */}
          <DataLabelingPanel
            strikes={strikeDetection.strikes}
            sessionId={undefined}
            matchId={currentMatch?.id}
            isActive={strikeDetection.isActive}
          />

          {/* Strike feed */}
          <StrikeFeedPanel
            strikes={strikeDetection.strikes}
            redStats={redStats}
            blueStats={blueStats}
            isActive={strikeDetection.isActive}
          />

          {/* Detection stats */}
          <Card className="rounded-none h-fit">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" /> Detection Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={isRunning ? 'text-[#00ffba]' : 'text-muted-foreground'}>
                    {isLoading ? 'Loading...' : isRunning ? 'Active' : 'Idle'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span>PoseLandmarker Lite</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cameras:</span>
                  <span>{activeCameras.length}/4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">FPS:</span>
                  <span>{isRunning ? fps : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ring Sync:</span>
                  <span className={ringSync.connected ? 'text-[#00ffba]' : 'text-muted-foreground'}>
                    {ringSync.connected ? '● Connected' : '○ Not connected'}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Fighter Tracking */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium flex items-center gap-1">
                  <Users className="h-3 w-3" /> Fighter Tracking
                </h4>
                <div className="flex items-center gap-2">
                  <div className={`flex-1 p-2 border rounded-none text-center ${redDetected ? 'border-red-500/50 bg-red-500/5' : 'border-border'}`}>
                    <div className="w-2 h-2 bg-red-600 rounded-full mx-auto mb-1" />
                    <p className="text-[10px] font-medium">{redName.split(' ')[0]}</p>
                    <p className={`text-[9px] ${redDetected ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {redDetected ? 'Detected' : 'Not found'}
                    </p>
                  </div>
                  <div className={`flex-1 p-2 border rounded-none text-center ${blueDetected ? 'border-blue-500/50 bg-blue-500/5' : 'border-border'}`}>
                    <div className="w-2 h-2 bg-blue-600 rounded-full mx-auto mb-1" />
                    <p className="text-[10px] font-medium">{blueName.split(' ')[0]}</p>
                    <p className={`text-[9px] ${blueDetected ? 'text-blue-500' : 'text-muted-foreground'}`}>
                      {blueDetected ? 'Detected' : 'Not found'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Roadmap */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-medium flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Roadmap
                </h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <div className="w-2 h-2 bg-[#00ffba] rounded-full" />
                    <span className="font-medium">Phase 1: Pose Detection</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <div className="w-2 h-2 bg-[#00ffba] rounded-full" />
                    <span className="font-medium">Phase 2: Strike Detection</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <div className="w-2 h-2 bg-[#00ffba] rounded-full" />
                    <span className="font-medium">Phase 3: Scoring & Ring Sync</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <div className="w-2 h-2 bg-[#00ffba] rounded-full" />
                    <span className="font-medium">Phase 4: Data Labeling</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
                    <span>Phase 5: Model Fine-tuning</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
