import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, Wifi, WifiOff, RotateCcw, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const positionLabels: Record<string, string> = {
  left: 'Αριστερά / Left',
  right: 'Δεξιά / Right',
  front: 'Μπροστά / Front',
  back: 'Πίσω / Back',
};

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ],
};

const MobileCameraFeed: React.FC = () => {
  const [searchParams] = useSearchParams();
  const ringId = searchParams.get('ring') || '';
  const camIndex = searchParams.get('cam') || '0';
  const position = searchParams.get('pos') || 'left';

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});

  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [connected, setConnected] = useState(false);
  const [dbRegistered, setDbRegistered] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  const channelName = useMemo(
    () => `webrtc-mobile-cam-${ringId}-${camIndex}`,
    [ringId, camIndex],
  );

  // ── Register camera in DB ──
  const registerCamera = async () => {
    if (!ringId) return;
    try {
      const camNum = Number(camIndex);
      const mobileStreamUrl = `mobile:${camNum}:${Date.now()}`;

      const { data: existing, error: existingError } = await supabase
        .from('ring_analysis_cameras')
        .select('id')
        .eq('ring_id', ringId)
        .eq('camera_index', camNum)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        const { error: updateError } = await supabase
          .from('ring_analysis_cameras')
          .update({
            camera_label: `Camera ${camNum}`,
            position,
            is_active: true,
            stream_url: mobileStreamUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('ring_analysis_cameras').insert({
          ring_id: ringId,
          camera_index: camNum,
          camera_label: `Camera ${camNum}`,
          position,
          stream_url: mobileStreamUrl,
          is_active: true,
          fps: 30,
        });
        if (insertError) throw insertError;
      }

      setDbRegistered(true);
    } catch (err) {
      console.error('Failed to register camera:', err);
      setDbRegistered(false);
    }
  };

  const unregisterCamera = async () => {
    if (!ringId) return;
    const camNum = Number(camIndex);
    await supabase
      .from('ring_analysis_cameras')
      .update({ is_active: false, stream_url: null, updated_at: new Date().toISOString() })
      .eq('ring_id', ringId)
      .eq('camera_index', camNum);
  };

  // ── Start camera ──
  const startCamera = async (facing: 'environment' | 'user') => {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
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

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => undefined);
      }

      // Add tracks to all existing peer connections
      Object.values(pcsRef.current).forEach((pc) => {
        const senders = pc.getSenders();
        mediaStream.getTracks().forEach((track) => {
          const existingSender = senders.find((s) => s.track?.kind === track.kind);
          if (existingSender) {
            existingSender.replaceTrack(track);
          } else {
            pc.addTrack(track, mediaStream);
          }
        });
      });

      await registerCamera();
      setConnected(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      setError(err.message || 'Δεν ήταν δυνατή η πρόσβαση στην κάμερα');
      setConnected(false);
    }
  };

  // ── Initial camera start ──
  useEffect(() => {
    startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      unregisterCamera();
    };
  }, []);

  // ── Heartbeat ──
  useEffect(() => {
    if (!dbRegistered || !connected || !ringId) return;
    const interval = setInterval(async () => {
      const camNum = Number(camIndex);
      await supabase
        .from('ring_analysis_cameras')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('ring_id', ringId)
        .eq('camera_index', camNum);
    }, 10000);
    return () => clearInterval(interval);
  }, [dbRegistered, connected, ringId, camIndex]);

  // ── WebRTC signaling (broadcaster side) ──
  useEffect(() => {
    const channel = supabase.channel(channelName);

    const closePc = (viewerId: string) => {
      const pc = pcsRef.current[viewerId];
      if (pc) {
        try { pc.close(); } catch {}
        delete pcsRef.current[viewerId];
        setViewerCount(Object.keys(pcsRef.current).length);
      }
    };

    const ensurePc = (viewerId: string) => {
      if (pcsRef.current[viewerId]) return pcsRef.current[viewerId];

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcsRef.current[viewerId] = pc;

      pc.onicecandidate = (ev) => {
        if (!ev.candidate) return;
        channel.send({
          type: 'broadcast',
          event: 'ice',
          payload: { viewerId, candidate: ev.candidate.toJSON(), from: 'broadcaster' },
        });
      };

      // Add current stream tracks
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      pc.onconnectionstatechange = () => {
        if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
          closePc(viewerId);
        }
      };

      setViewerCount(Object.keys(pcsRef.current).length);
      return pc;
    };

    channel
      .on('broadcast', { event: 'viewer-join' }, async ({ payload }: any) => {
        try {
          if (!streamRef.current) return;
          const pc = ensurePc(payload.viewerId);

          const offer = await pc.createOffer({ offerToReceiveVideo: false });
          await pc.setLocalDescription(offer);

          await channel.send({
            type: 'broadcast',
            event: 'offer',
            payload: { viewerId: payload.viewerId, sdp: pc.localDescription! },
          });
        } catch (e) {
          console.error('[WebRTC] broadcaster offer error', e);
        }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }: any) => {
        try {
          const pc = pcsRef.current[payload.viewerId];
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        } catch (e) {
          console.error('[WebRTC] broadcaster answer error', e);
        }
      })
      .on('broadcast', { event: 'ice' }, async ({ payload }: any) => {
        try {
          if (payload.from !== 'viewer') return;
          const pc = pcsRef.current[payload.viewerId];
          if (!pc || !payload.candidate) return;
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch {}
      })
      .on('broadcast', { event: 'viewer-leave' }, ({ payload }: any) => {
        closePc(payload.viewerId);
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch {}
      Object.keys(pcsRef.current).forEach(closePc);
    };
  }, [channelName]);

  const toggleCamera = () => {
    const nextFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacingMode);
    startCamera(nextFacingMode);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />

      {error && (
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
      )}

      {/* Top bar */}
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

      {/* Bottom bar */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-black/80 px-4 py-2 text-white">
        <div className="flex items-center justify-center gap-2">
          <div className={`h-2 w-2 rounded-full ${connected ? 'bg-[#00ffba] animate-pulse' : 'bg-red-400'}`} />
          <span className="text-xs text-white/70">
            WebRTC HD • {positionLabels[position] || position}
            {dbRegistered && ' • Synced'}
            {viewerCount > 0 && ` • ${viewerCount} viewer${viewerCount > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MobileCameraFeed;
