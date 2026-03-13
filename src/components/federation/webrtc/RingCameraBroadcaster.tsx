import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

type JoinPayload = { viewerId: string };
type OfferPayload = { viewerId: string; sdp: RTCSessionDescriptionInit };
type AnswerPayload = { viewerId: string; sdp: RTCSessionDescriptionInit };
type IcePayload = { viewerId: string; candidate: RTCIceCandidateInit; from: "broadcaster" | "viewer" };
type LeavePayload = { viewerId: string };

interface RingCameraBroadcasterProps {
  ringId: string;
  deviceId?: string | null;
  className?: string;
}

export const RingCameraBroadcaster: React.FC<RingCameraBroadcasterProps> = ({ ringId, deviceId, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});

  const [error, setError] = useState<string | null>(null);

  const channelName = useMemo(() => `webrtc-ring-${ringId}`, [ringId]);

  // Capture local stream
  useEffect(() => {
    let active = true;

    const start = async () => {
      try {
        setError(null);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        const constraints: MediaStreamConstraints = {
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        console.error("[WebRTC] broadcaster getUserMedia error", e);
        setError("Camera not available");
      }
    };

    start();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [deviceId]);

  // Signaling
  useEffect(() => {
    const channel = supabase.channel(channelName);

    const closePc = (viewerId: string) => {
      const pc = pcsRef.current[viewerId];
      if (pc) {
        try {
          pc.close();
        } catch {}
        delete pcsRef.current[viewerId];
      }
    };

    const ensurePc = (viewerId: string) => {
      if (pcsRef.current[viewerId]) return pcsRef.current[viewerId];

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcsRef.current[viewerId] = pc;

      pc.onicecandidate = (ev) => {
        if (!ev.candidate) return;
        const payload: IcePayload = {
          viewerId,
          candidate: ev.candidate.toJSON(),
          from: "broadcaster",
        };
        channel.send({ type: "broadcast", event: "ice", payload });
      };

      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      pc.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
          closePc(viewerId);
        }
      };

      return pc;
    };

    channel
      .on("broadcast", { event: "viewer-join" }, async ({ payload }: { payload: JoinPayload }) => {
        try {
          if (!streamRef.current) return;
          const pc = ensurePc(payload.viewerId);

          const offer = await pc.createOffer({ offerToReceiveVideo: true });
          await pc.setLocalDescription(offer);

          const msg: OfferPayload = { viewerId: payload.viewerId, sdp: pc.localDescription! };
          await channel.send({ type: "broadcast", event: "offer", payload: msg });
        } catch (e) {
          console.error("[WebRTC] broadcaster offer error", e);
        }
      })
      .on("broadcast", { event: "answer" }, async ({ payload }: { payload: AnswerPayload }) => {
        try {
          const pc = pcsRef.current[payload.viewerId];
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        } catch (e) {
          console.error("[WebRTC] broadcaster answer error", e);
        }
      })
      .on("broadcast", { event: "ice" }, async ({ payload }: { payload: IcePayload }) => {
        try {
          if (payload.from !== "viewer") return;
          const pc = pcsRef.current[payload.viewerId];
          if (!pc) return;
          if (!payload.candidate) return;
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch {
          // ignore
        }
      })
      .on("broadcast", { event: "viewer-leave" }, ({ payload }: { payload: LeavePayload }) => {
        closePc(payload.viewerId);
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
      Object.keys(pcsRef.current).forEach(closePc);
    };
  }, [channelName]);

  if (error) {
    return <div className={className} />;
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={className}
    />
  );
};
