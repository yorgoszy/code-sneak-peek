/**
 * useCompetitionPoseAnalysis
 * Manages multi-camera pose detection for competition analysis.
 * Tracks Red/Blue corner fighters using MediaPipe PoseLandmarker.
 */
import { useCallback, useRef, useState } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

export interface FighterPose {
  corner: 'red' | 'blue';
  landmarks: Array<{ x: number; y: number; z: number; visibility: number }>;
  centerX: number; // normalized 0-1
  centerY: number;
}

export interface FrameAnalysis {
  cameraIndex: number;
  fighters: FighterPose[];
  timestamp: number;
}

interface CompetitionPoseState {
  isInitialized: boolean;
  isLoading: boolean;
  isRunning: boolean;
  error: string | null;
  fps: number;
  fighterData: Record<number, FighterPose[]>; // keyed by camera index
}

export function useCompetitionPoseAnalysis(onFighterFrame?: (fighters: FighterPose[], cameraIndex: number) => void) {
  const [state, setState] = useState<CompetitionPoseState>({
    isInitialized: false,
    isLoading: false,
    isRunning: false,
    error: null,
    fps: 0,
    fighterData: {},
  });

  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafIdsRef = useRef<Map<number, number>>(new Map());
  const lastTimesRef = useRef<Map<number, number>>(new Map());
  const fpsCounterRef = useRef({ frames: 0, lastCheck: 0 });

  // Initialize MediaPipe PoseLandmarker (2 poses for 2 fighters)
  const initialize = useCallback(async () => {
    if (landmarkerRef.current) return;

    setState(s => ({ ...s, isLoading: true, error: null }));

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 2, // detect 2 fighters
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      landmarkerRef.current = landmarker;
      setState(s => ({ ...s, isInitialized: true, isLoading: false }));
      console.log('✅ Competition PoseLandmarker initialized (2 poses)');
    } catch (err) {
      console.error('❌ PoseLandmarker init error:', err);
      setState(s => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to init pose detection',
      }));
    }
  }, []);

  /**
   * Assign corners based on horizontal position.
   * Left fighter = Red, Right fighter = Blue (consistent with competition setup).
   */
  const assignCorners = (
    poses: Array<{ landmarks: Array<{ x: number; y: number; z: number; visibility: number }> }>
  ): FighterPose[] => {
    if (poses.length === 0) return [];

    const fighters: FighterPose[] = poses.map(pose => {
      const lHip = pose.landmarks[23];
      const rHip = pose.landmarks[24];
      const centerX = (lHip.x + rHip.x) / 2;
      const centerY = (lHip.y + rHip.y) / 2;

      return {
        corner: 'red',
        landmarks: pose.landmarks,
        centerX,
        centerY,
      };
    });

    // Sort by X position: leftmost = red, rightmost = blue
    fighters.sort((a, b) => a.centerX - b.centerX);
    if (fighters.length >= 1) fighters[0].corner = 'red';
    if (fighters.length >= 2) fighters[1].corner = 'blue';

    return fighters;
  };

  /**
   * Draw pose overlay on canvas with corner colors.
   */
  const drawPoseOverlay = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      fighters: FighterPose[],
      width: number,
      height: number
    ) => {
      ctx.clearRect(0, 0, width, height);
      const drawingUtils = new DrawingUtils(ctx);

      for (const fighter of fighters) {
        const color = fighter.corner === 'red' ? '#ff4444' : '#4488ff';
        const labelBg = fighter.corner === 'red' ? 'rgba(255,0,0,0.7)' : 'rgba(0,100,255,0.7)';

        // Draw connections
        drawingUtils.drawConnectors(
          fighter.landmarks as any,
          PoseLandmarker.POSE_CONNECTIONS,
          { color, lineWidth: 2 }
        );

        // Draw landmarks
        drawingUtils.drawLandmarks(fighter.landmarks as any, {
          color: '#ffffff',
          lineWidth: 1,
          radius: 3,
        });

        // Draw corner label
        const labelX = fighter.centerX * width;
        const labelY = Math.max(fighter.centerY * height - 60, 20);
        const label = fighter.corner === 'red' ? 'RED' : 'BLUE';

        ctx.fillStyle = labelBg;
        ctx.fillRect(labelX - 22, labelY - 10, 44, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, labelX, labelY + 2);
      }
    },
    []
  );

  /**
   * Start detection loop for a camera feed.
   */
  const startDetection = useCallback(
    (
      cameraIndex: number,
      video: HTMLVideoElement,
      overlayCanvas: HTMLCanvasElement
    ) => {
      if (!landmarkerRef.current) return;

      const ctx = overlayCanvas.getContext('2d');
      if (!ctx) return;

      const detect = () => {
        if (!landmarkerRef.current || video.paused || video.ended) return;

        const now = video.currentTime;
        const lastTime = lastTimesRef.current.get(cameraIndex) ?? -1;

        if (now !== lastTime && video.videoWidth > 0) {
          lastTimesRef.current.set(cameraIndex, now);

          // Size canvas to video
          overlayCanvas.width = video.videoWidth;
          overlayCanvas.height = video.videoHeight;

          try {
            const results = landmarkerRef.current.detectForVideo(video, performance.now());

            if (results.landmarks && results.landmarks.length > 0) {
              const poses = results.landmarks.map((lm, i) => ({
                landmarks: lm,
                worldLandmarks: results.worldLandmarks?.[i] || lm,
              }));

              const fighters = assignCorners(poses);

              // Draw overlay
              drawPoseOverlay(ctx, fighters, overlayCanvas.width, overlayCanvas.height);

              // Update state
              setState(s => ({
                ...s,
                fighterData: { ...s.fighterData, [cameraIndex]: fighters },
              }));
            } else {
              ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
              setState(s => ({
                ...s,
                fighterData: { ...s.fighterData, [cameraIndex]: [] },
              }));
            }
          } catch (err) {
            // Skip frame errors silently
          }

          // FPS counter
          fpsCounterRef.current.frames++;
          const elapsed = performance.now() - fpsCounterRef.current.lastCheck;
          if (elapsed > 1000) {
            setState(s => ({
              ...s,
              fps: Math.round((fpsCounterRef.current.frames / elapsed) * 1000),
            }));
            fpsCounterRef.current.frames = 0;
            fpsCounterRef.current.lastCheck = performance.now();
          }
        }

        const id = requestAnimationFrame(detect);
        rafIdsRef.current.set(cameraIndex, id);
      };

      setState(s => ({ ...s, isRunning: true }));
      fpsCounterRef.current.lastCheck = performance.now();
      detect();
    },
    [drawPoseOverlay]
  );

  /**
   * Stop detection for a specific camera.
   */
  const stopDetection = useCallback((cameraIndex: number) => {
    const id = rafIdsRef.current.get(cameraIndex);
    if (id) {
      cancelAnimationFrame(id);
      rafIdsRef.current.delete(cameraIndex);
    }
    if (rafIdsRef.current.size === 0) {
      setState(s => ({ ...s, isRunning: false }));
    }
  }, []);

  /**
   * Stop all detection loops.
   */
  const stopAll = useCallback(() => {
    rafIdsRef.current.forEach(id => cancelAnimationFrame(id));
    rafIdsRef.current.clear();
    lastTimesRef.current.clear();
    setState(s => ({ ...s, isRunning: false, fighterData: {}, fps: 0 }));
  }, []);

  /**
   * Cleanup.
   */
  const destroy = useCallback(() => {
    stopAll();
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    setState(s => ({ ...s, isInitialized: false }));
  }, [stopAll]);

  return {
    ...state,
    initialize,
    startDetection,
    stopDetection,
    stopAll,
    destroy,
  };
}
