/**
 * CompetitionAnalysisTab
 * New tab in the AI Lab for real-time pose detection and fighter tracking.
 * Phase 1: MediaPipe skeleton overlay + Red/Blue corner identification.
 */
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Play, Square, Loader2, Brain, Activity, Zap, Users, Eye,
} from 'lucide-react';
import { PoseOverlayFeed } from './PoseOverlayFeed';
import { useCompetitionPoseAnalysis } from '@/hooks/useCompetitionPoseAnalysis';

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
}

export const CompetitionAnalysisTab: React.FC<CompetitionAnalysisTabProps> = ({
  cameras,
  currentMatch,
  positionLabels,
}) => {
  const { t } = useTranslation();
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
  } = useCompetitionPoseAnalysis();

  const activeCameras = cameras.filter(c => c.is_active && c.stream_url?.startsWith('webcam:'));

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
    // Detection will start when video feeds report ready
    // We trigger a re-render by setting isRunning via startDetection
  };

  const handleStopAll = () => {
    stopAll();
  };

  // Count total detected fighters across all cameras
  const totalFighters = Object.values(fighterData).reduce(
    (sum, fighters) => sum + fighters.length, 0
  );
  const redDetected = Object.values(fighterData).some(f => f.some(p => p.corner === 'red'));
  const blueDetected = Object.values(fighterData).some(f => f.some(p => p.corner === 'blue'));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Pose Detection
            <Badge variant="outline" className="rounded-none text-[10px]">Phase 1</Badge>
          </h2>
          <p className="text-xs text-muted-foreground">
            Real-time fighter tracking με MediaPipe — Red/Blue corner identification
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <Badge className="rounded-none bg-[#00ffba] text-black text-xs">
              {fps} FPS
            </Badge>
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
              <><Square className="h-4 w-4 mr-1" /> Stop Detection</>
            ) : (
              <><Play className="h-4 w-4 mr-1" /> Start Detection</>
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

          {/* Match Info */}
          {currentMatch && (
            <Card className="rounded-none">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-600 rounded-none" />
                      <span className="text-sm font-medium">
                        {(currentMatch as any).athlete1?.name || 'Red Corner'}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">vs</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-600 rounded-none" />
                      <span className="text-sm font-medium">
                        {(currentMatch as any).athlete2?.name || 'Blue Corner'}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="rounded-none text-xs">
                    {currentMatch.round_number || 3} Rounds
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats panel */}
        <Card className="rounded-none h-fit">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" /> Live Detection Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            {/* Status */}
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
            </div>

            <Separator />

            {/* Fighter Detection */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium flex items-center gap-1">
                <Users className="h-3 w-3" /> Fighter Tracking
              </h4>

              <div className="flex items-center gap-2">
                <div className={`flex-1 p-2 border rounded-none text-center ${redDetected ? 'border-red-500/50 bg-red-500/5' : 'border-border'}`}>
                  <div className="w-2 h-2 bg-red-600 rounded-full mx-auto mb-1" />
                  <p className="text-[10px] font-medium">RED</p>
                  <p className={`text-[9px] ${redDetected ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {redDetected ? 'Detected' : 'Not found'}
                  </p>
                </div>
                <div className={`flex-1 p-2 border rounded-none text-center ${blueDetected ? 'border-blue-500/50 bg-blue-500/5' : 'border-border'}`}>
                  <div className="w-2 h-2 bg-blue-600 rounded-full mx-auto mb-1" />
                  <p className="text-[10px] font-medium">BLUE</p>
                  <p className={`text-[9px] ${blueDetected ? 'text-blue-500' : 'text-muted-foreground'}`}>
                    {blueDetected ? 'Detected' : 'Not found'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Per-camera stats */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium">Per Camera</h4>
              {cameras.map(cam => {
                const fighters = fighterData[cam.camera_index] || [];
                const isActive = cam.is_active && cam.stream_url?.startsWith('webcam:');
                return (
                  <div key={cam.camera_index} className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">
                      CAM {cam.camera_index} ({positionLabels[cam.position] || cam.position})
                    </span>
                    {isActive && isRunning ? (
                      <div className="flex items-center gap-1">
                        {fighters.length > 0 ? (
                          fighters.map((f, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${f.corner === 'red' ? 'bg-red-500' : 'bg-blue-500'}`}
                            />
                          ))
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">OFF</span>
                    )}
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Phase roadmap */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium flex items-center gap-1">
                <Zap className="h-3 w-3" /> Roadmap
              </h4>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <div className="w-2 h-2 bg-[#00ffba] rounded-full" />
                  <span className="font-medium">Phase 1: Pose Detection</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
                  <span>Phase 2: Strike Detection</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
                  <span>Phase 3: Scoring & Stats</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
                  <span>Phase 4: Model Fine-tuning</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
