import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, Wifi, WifiOff, RotateCcw, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const positionLabels: Record<string, string> = {
  left: 'Αριστερά / Left',
  right: 'Δεξιά / Right',
  front: 'Μπροστά / Front',
  back: 'Πίσω / Back',
};

const MobileCameraFeed: React.FC = () => {
  const [searchParams] = useSearchParams();
  const ringId = searchParams.get('ring') || '';
  const camIndex = searchParams.get('cam') || '0';
  const position = searchParams.get('pos') || 'left';

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [connected, setConnected] = useState(false);
  const [dbRegistered, setDbRegistered] = useState(false);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  // Detect orientation changes
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Register this mobile camera in the database
  const registerCamera = async () => {
    if (!ringId) return;
    try {
      const camNum = Number(camIndex);
      // Check if camera row exists for this ring + camera_index
      const { data: existing } = await supabase
        .from('ring_analysis_cameras')
        .select('id')
        .eq('ring_id', ringId)
        .eq('camera_index', camNum)
        .maybeSingle();

      if (existing) {
        // Update: mark as active with mobile source
        await supabase
          .from('ring_analysis_cameras')
          .update({
            is_active: true,
            stream_url: `mobile:${Date.now()}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Insert new camera entry
        await supabase.from('ring_analysis_cameras').insert({
          ring_id: ringId,
          camera_index: camNum,
          camera_label: `Camera ${camNum + 1}`,
          position: position,
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

  // Unregister on unmount
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
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      setError(null);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          aspectRatio: { ideal: 16 / 9 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setConnected(true);

      // Register in DB once camera is working
      registerCamera();
    } catch (err: any) {
      console.error('Camera error:', err);
      setError(err.message || 'Δεν ήταν δυνατή η πρόσβαση στην κάμερα');
      setConnected(false);
    }
  };

  // Lock screen orientation to portrait so the camera doesn't rotate
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        // @ts-ignore - screen.orientation.lock is not in all TS typings
        await screen.orientation?.lock?.('portrait');
      } catch (e) {
        // Fallback: not supported on all browsers, that's OK
        console.log('Orientation lock not supported');
      }
    };
    lockOrientation();

    // Also add a CSS-based lock via viewport meta
    const meta = document.querySelector('meta[name="viewport"]');
    const originalContent = meta?.getAttribute('content') || '';

    return () => {
      try {
        screen.orientation?.unlock?.();
      } catch (e) {}
      if (meta && originalContent) {
        meta.setAttribute('content', originalContent);
      }
    };
  }, []);

  useEffect(() => {
    startCamera(facingMode);

    // Cleanup on unmount
    return () => {
      stream?.getTracks().forEach(t => t.stop());
      unregisterCamera();
    };
  }, []);

  // Keep-alive: update timestamp every 10 seconds so AI Lab knows we're still connected
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

  // Broadcast video frames via Supabase Realtime so the dashboard can display them
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

      // Always output landscape 320x180 (16:9)
      const targetWidth = 320;
      const targetHeight = 180;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      const isVideoPortrait = vh > vw;

      if (isVideoPortrait) {
        // Portrait source: crop center to fill landscape canvas
        // We need to take a horizontal slice from the portrait video
        const sourceAspect = targetWidth / targetHeight; // 16/9
        const cropHeight = vw / sourceAspect; // height of crop area in source
        const cropY = Math.max(0, (vh - cropHeight) / 2);
        ctx.drawImage(video, 0, cropY, vw, cropHeight, 0, 0, targetWidth, targetHeight);
      } else {
        // Landscape source: draw normally
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      }

      const frame = canvas.toDataURL('image/jpeg', 0.55);

      channel.send({
        type: 'broadcast',
        event: 'frame',
        payload: { frame, width: targetWidth, height: targetHeight },
      });
    }, 500); // 2 FPS

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [connected, ringId, camIndex]);

  const toggleCamera = () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    startCamera(newFacing);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top bar */}
      <div className="bg-black/80 text-white px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          <div>
            <p className="text-sm font-semibold">
              {positionLabels[position] || position}
            </p>
            <p className="text-[10px] text-white/60">
              Camera {Number(camIndex) + 1}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleCamera}
            className="p-2 rounded-full bg-white/10 active:bg-white/20"
          >
            <RotateCcw className="h-5 w-5 text-white" />
          </button>
          <div className="flex items-center gap-1">
            {connected ? (
              <Wifi className="h-4 w-4 text-[#00ffba]" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400" />
            )}
            <span className="text-[10px]">
              {connected ? 'LIVE' : 'OFF'}
            </span>
          </div>
        </div>
      </div>

      {/* Camera feed */}
      <div className="flex-1 relative">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6 text-center">
            <Camera className="h-12 w-12 mb-4 text-white/40" />
            <p className="text-sm mb-2">Σφάλμα κάμερας</p>
            <p className="text-xs text-white/60 mb-4">{error}</p>
            <button
              onClick={() => startCamera(facingMode)}
              className="px-4 py-2 bg-white/10 text-white text-sm active:bg-white/20"
            >
              Δοκιμή ξανά
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Portrait mode warning */}
            {isPortrait && connected && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-yellow-500/90 text-black px-4 py-2 text-xs font-semibold animate-pulse">
                <Smartphone className="h-4 w-4 rotate-90" />
                Γυρίστε το κινητό οριζόντια για καλύτερη εικόνα
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom bar */}
      <div className="bg-black/80 text-white px-4 py-2 flex items-center justify-center z-10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-[#00ffba] animate-pulse' : 'bg-red-400'}`} />
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
