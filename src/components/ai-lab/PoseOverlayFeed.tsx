/**
 * PoseOverlayFeed
 * Camera feed with a transparent canvas overlay for pose skeleton rendering.
 * Used in the AI Lab Competition Analysis tab.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Video, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PoseOverlayFeedProps {
  deviceId: string;
  cameraIndex: number;
  position: string;
  positionLabel: string;
  onVideoReady?: (video: HTMLVideoElement, canvas: HTMLCanvasElement, cameraIndex: number) => void;
  onVideoStopped?: (cameraIndex: number) => void;
  fighterCount?: number;
  isDetecting?: boolean;
}

export const PoseOverlayFeed: React.FC<PoseOverlayFeedProps> = ({
  deviceId,
  cameraIndex,
  position,
  positionLabel,
  onVideoReady,
  onVideoStopped,
  fighterCount = 0,
  isDetecting = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const start = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current && canvasRef.current && active) {
              onVideoReady?.(videoRef.current, canvasRef.current, cameraIndex);
            }
          };
        }
        setError(null);
      } catch (err) {
        console.error(`Camera ${cameraIndex} error:`, err);
        setError('Camera not available');
      }
    };

    start();

    return () => {
      active = false;
      onVideoStopped?.(cameraIndex);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [deviceId, cameraIndex]);

  if (error) {
    return (
      <div className="relative aspect-video bg-black flex items-center justify-center">
        <div className="text-center text-white/60">
          <AlertCircle className="h-6 w-6 mx-auto mb-1" />
          <p className="text-xs">{error}</p>
        </div>
        <div className="absolute top-1 left-1">
          <Badge className="rounded-none text-[10px] bg-black/60 text-white border-none">
            CAM {cameraIndex} • {positionLabel}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black overflow-hidden">
      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Pose overlay canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ objectFit: 'cover' }}
      />

      {/* Camera label */}
      <div className="absolute top-1 left-1">
        <Badge className="rounded-none text-[10px] bg-black/60 text-white border-none">
          CAM {cameraIndex} • {positionLabel}
        </Badge>
      </div>

      {/* Detection status */}
      {isDetecting && (
        <div className="absolute top-1 right-1 flex items-center gap-1">
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/60 text-[10px]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00ffba] animate-pulse" />
            <span className="text-[#00ffba]">AI</span>
          </div>
        </div>
      )}

      {/* Fighter count */}
      {isDetecting && (
        <div className="absolute bottom-1 left-1 flex items-center gap-1">
          {fighterCount >= 1 && (
            <Badge className="rounded-none text-[9px] bg-red-600/80 text-white border-none px-1.5">
              RED
            </Badge>
          )}
          {fighterCount >= 2 && (
            <Badge className="rounded-none text-[9px] bg-blue-600/80 text-white border-none px-1.5">
              BLUE
            </Badge>
          )}
          {fighterCount === 0 && (
            <Badge className="rounded-none text-[9px] bg-black/60 text-white/50 border-none px-1.5">
              No fighters
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
