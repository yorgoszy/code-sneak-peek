import { useEffect, useRef, useState, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseResult {
  landmarks: Landmark[];
  worldLandmarks: Landmark[];
}

// MediaPipe Pose Landmark indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

// Calculate angle between three points
export function calculateAngle(
  point1: Landmark,
  point2: Landmark, // vertex
  point3: Landmark
): number {
  const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) -
                  Math.atan2(point1.y - point2.y, point1.x - point2.x);
  let angle = Math.abs(radians * 180 / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

// Calculate distance between two points
export function calculateDistance(point1: Landmark, point2: Landmark): number {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + 
    Math.pow(point2.y - point1.y, 2)
  );
}

interface UsePoseDetectionOptions {
  onResults?: (result: PoseResult | null) => void;
  modelPath?: string;
}

export function usePoseDetection(options: UsePoseDetectionOptions = {}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPose, setCurrentPose] = useState<PoseResult | null>(null);
  
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  // Initialize PoseLandmarker
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      poseLandmarkerRef.current = poseLandmarker;
      setIsLoading(false);
      console.log("✅ PoseLandmarker initialized successfully");
    } catch (err) {
      console.error("❌ Failed to initialize PoseLandmarker:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize pose detection");
      setIsLoading(false);
    }
  }, []);

  // Detect pose from video frame
  const detectPose = useCallback(() => {
    if (!poseLandmarkerRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.currentTime === lastVideoTimeRef.current) {
      if (isRunning) {
        animationFrameRef.current = requestAnimationFrame(detectPose);
      }
      return;
    }

    lastVideoTimeRef.current = video.currentTime;

    // Match canvas size to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Get pose results
    const results = poseLandmarkerRef.current.detectForVideo(video, performance.now());

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.landmarks && results.landmarks.length > 0) {
      const poseResult: PoseResult = {
        landmarks: results.landmarks[0],
        worldLandmarks: results.worldLandmarks?.[0] || results.landmarks[0],
      };

      setCurrentPose(poseResult);
      options.onResults?.(poseResult);

      // Draw landmarks
      const drawingUtils = new DrawingUtils(ctx);
      
      // Draw connections
      drawingUtils.drawConnectors(
        results.landmarks[0],
        PoseLandmarker.POSE_CONNECTIONS,
        { color: '#00ffba', lineWidth: 3 }
      );

      // Draw landmarks
      drawingUtils.drawLandmarks(results.landmarks[0], {
        color: '#ffffff',
        lineWidth: 1,
        radius: 4,
      });
    } else {
      setCurrentPose(null);
      options.onResults?.(null);
    }

    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(detectPose);
    }
  }, [isRunning, options]);

  // Start detection
  const start = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    videoRef.current = video;
    canvasRef.current = canvas;
    setIsRunning(true);
  }, []);

  // Stop detection
  const stop = useCallback(() => {
    setIsRunning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Run detection loop when running
  useEffect(() => {
    if (isRunning && !isLoading && poseLandmarkerRef.current) {
      animationFrameRef.current = requestAnimationFrame(detectPose);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, isLoading, detectPose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      poseLandmarkerRef.current?.close();
    };
  }, [stop]);

  return {
    initialize,
    start,
    stop,
    isLoading,
    isRunning,
    error,
    currentPose,
  };
}
