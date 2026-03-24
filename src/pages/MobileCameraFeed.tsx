import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, Wifi, WifiOff, RotateCcw, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const positionLabels: Record<string, string> = {
  left: 'Αριστερά / Left',
  right: 'Δεξιά / Right',
  front: 'Μπροστά / Front',
  back: 'Πίσω / Back',
};

const getOrientationAngle = () => {
  if (typeof window === 'undefined') return 0;

  const screenAngle = window.screen.orientation?.angle;
  if (typeof screenAngle === 'number') return screenAngle;

  const legacyAngle = (window as Window & { orientation?: number }).orientation;
  return typeof legacyAngle === 'number' ? legacyAngle : 0;
};

const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

const MobileCameraFeed: React.FC = () => {
  const [searchParams] = useSearchParams();
  const ringId = searchParams.get('ring') || '';
  const camIndex = searchParams.get('cam') || '0';
  const position = searchParams.get('pos') || 'left';

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [connected, setConnected] = useState(false);
  const [dbRegistered, setDbRegistered] = useState(false);
  const [viewport, setViewport] = useState({
    isLandscape: window.innerWidth > window.innerHeight,
    angle: getOrientationAngle(),
  });
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        isLandscape: window.innerWidth > window.innerHeight,
        angle: getOrientationAngle(),
      });
    };

    const handleOrientationChange = () => {
      window.setTimeout(updateViewport, 150);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  const registerCamera = async () => {
    if (!ringId) return;

    try {
      const camNum = Number(camIndex);
      const { data: existing } = await supabase
        .from('ring_analysis_cameras')
        .select('id')
        .eq('ring_id', ringId)
        .eq('camera_index', camNum)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('ring_analysis_cameras')
          .update({
            is_active: true,
            stream_url: `mobile:${Date.now()}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('ring_analysis_cameras').insert({
          ring_id: ringId,
          camera_index: camNum,
          camera_label: `Camera ${camNum + 1}`,
          position,
          stream_url: `mobile:${Date.now()}`,
          is_active: true,
          fps: 30,
        });
      }

      setDbRegistered(true);
    } catch (err) {
      console.error('Failed to register camera:', err);
    }
  };

  const unregisterCamera = async () => {
    if (!ringId) return;

    const camNum = Number(camIndex);
    await supabase
      .from('ring_analysis_cameras')
      .update({
        is_active: false,
        stream_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('ring_id', ringId)
      .eq('camera_index', camNum);
  };

  const startCamera = async (facing: 'environment' | 'user') => {
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setError(null);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 16 / 9 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => undefined);
      }

      setConnected(true);
      registerCamera();
    } catch (err: any) {
      console.error('Camera error:', err);
      setError(err.message || 'Δεν ήταν δυνατή η πρόσβαση στην κάμερα');
      setConnected(false);
    }
  };

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      unregisterCamera();
    };
  }, []);

  useEffect(() => {
    if (!dbRegistered || !connected || !ringId) return;

    const interval = setInterval(async () => {
      const camNum = Number(camIndex);
      await supabase
        .from('ring_analysis_cameras')
        .update({ updated_at: new Date().toISOString() })
        .eq('ring_id', ringId)
        .eq('camera_index', camNum);
    }, 10000);

    return () => clearInterval(interval);
  }, [dbRegistered, connected, ringId, camIndex]);

  const rotationDegrees = useMemo(() => {
    const normalizedAngle = normalizeAngle(viewport.angle);

    if (!viewport.isLandscape || videoSize.width >= videoSize.height) {
      return 0;
    }

    if (normalizedAngle === 270) return -90;
    return 90;
  }, [viewport.angle, viewport.isLandscape, videoSize.height, videoSize.width]);

  useEffect(() => {
    if (!connected || !ringId || !videoRef.current) return;

    const channelName = `mobile-cam-${ringId}-${camIndex}`;
    const channel = supabase.channel(channelName);
    channel.subscribe();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || !ctx || video.readyState < 2) return;

      const rawWidth = video.videoWidth || 640;
      const rawHeight = video.videoHeight || 480;

      setVideoSize((prev) => (
        prev.width === rawWidth && prev.height === rawHeight
          ? prev
          : { width: rawWidth, height: rawHeight }
      ));

      const targetWidth = 320;
      const targetHeight = 180;
      const shouldRotate = viewport.isLandscape && rawHeight > rawWidth;
      const drawRotation = shouldRotate ? rotationDegrees : 0;
      const effectiveWidth = shouldRotate ? rawHeight : rawWidth;
      const effectiveHeight = shouldRotate ? rawWidth : rawHeight;
      const scale = Math.min(targetWidth / effectiveWidth, targetHeight / effectiveHeight);
      const drawWidth = rawWidth * scale;
      const drawHeight = rawHeight * scale;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.save();
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate((drawRotation * Math.PI) / 180);
      ctx.drawImage(video, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      const frame = canvas.toDataURL('image/jpeg', 0.6);

      channel.send({
        type: 'broadcast',
        event: 'frame',
        payload: {
          frame,
          width: targetWidth,
          height: targetHeight,
        },
      });
    }, 500);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [camIndex, connected, ringId, rotationDegrees, viewport.isLandscape]);

  const toggleCamera = () => {
    const nextFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacingMode);
    startCamera(nextFacingMode);
  };

  const handleVideoMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    setVideoSize({
      width: video.videoWidth || 0,
      height: video.videoHeight || 0,
    });

    video.play().catch(() => undefined);
  };

  const landscapePreviewStyle: React.CSSProperties = rotationDegrees
    ? {
        width: '100vh',
        height: '100vw',
        objectFit: 'contain',
        transform: `rotate(${rotationDegrees}deg)`,
      }
    : {
        width: '100vw',
        height: '100vh',
        objectFit: 'contain',
      };

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <div className="absolute inset-0 bg-black">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
            <Camera className="mb-4 h-12 w-12 text-white/40" />
            <p className="mb-2 text-sm">Σφάλμα κάμερας</p>
            <p className="mb-4 text-xs text-white/60">{error}</p>
            <button
              onClick={() => startCamera(facingMode)}
              className="bg-white/10 px-4 py-2 text-sm text-white active:bg-white/20"
            >
              Δοκιμή ξανά
            </button>
          </div>
        ) : viewport.isLandscape ? (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onLoadedMetadata={handleVideoMetadata}
              className="max-w-none"
              style={landscapePreviewStyle}
            />
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onLoadedMetadata={handleVideoMetadata}
              className="absolute inset-0 h-full w-full object-cover opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-white">
              <div className="max-w-sm bg-black/60 px-5 py-4 backdrop-blur-sm">
                <Smartphone className="mx-auto mb-3 h-10 w-10 rotate-90" />
                <p className="text-base font-semibold">Γυρίστε το κινητό οριζόντια</p>
                <p className="mt-1 text-sm text-white/70">Rotate the phone to landscape for full 16:9 capture</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="absolute inset-x-0 top-0 z-10 bg-black/80 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">{positionLabels[position] || position}</p>
              <p className="text-[10px] text-white/60">Camera {Number(camIndex) + 1}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleCamera}
              className="rounded-full bg-white/10 p-2 active:bg-white/20"
            >
              <RotateCcw className="h-5 w-5 text-white" />
            </button>
            <div className="flex items-center gap-1">
              {connected ? (
                <Wifi className="h-4 w-4 text-[#00ffba]" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <span className="text-[10px]">{connected ? 'LIVE' : 'OFF'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 bg-black/80 px-4 py-2 text-white">
        <div className="flex items-center justify-center gap-2">
          <div className={`h-2 w-2 rounded-full ${connected ? 'bg-[#00ffba] animate-pulse' : 'bg-red-400'}`} />
          <span className="text-xs text-white/70">
            Ring • {positionLabels[position] || position}
            {dbRegistered && ' • Synced'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MobileCameraFeed;
