import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

type JoinPayload = { viewerId: string };
type OfferPayload = { viewerId: string; sdp: RTCSessionDescriptionInit };
type AnswerPayload = { viewerId: string; sdp: RTCSessionDescriptionInit };
type IcePayload = { viewerId: string; candidate: RTCIceCandidateInit; from: "broadcaster" | "viewer" };

interface RingCameraViewerProps {
  ringId: string;
  className?: string;
}

export const RingCameraViewer: React.FC<RingCameraViewerProps> = ({ ringId, className }) => {
  const viewerId = useMemo(() => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`), []);
  const channelName = useMemo(() => `webrtc-ring-${ringId}`, [ringId]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasStream, setHasStream] = useState(false);

  useEffect(() => {
    const channel = supabase.channel(channelName);

    const ensurePc = () => {
      if (pcRef.current) return pcRef.current;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream && videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasStream(true);
        }
      };

      pc.onicecandidate = (ev) => {
        if (!ev.candidate) return;
        const payload: IcePayload = {
          viewerId,
          candidate: ev.candidate.toJSON(),
          from: "viewer",
        };
        channel.send({ type: "broadcast", event: "ice", payload });
      };

      return pc;
    };

    channel
      .on("broadcast", { event: "offer" }, async ({ payload }: { payload: OfferPayload }) => {
        try {
          if (payload.viewerId !== viewerId) return;
          const pc = ensurePc();

          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          const msg: AnswerPayload = { viewerId, sdp: pc.localDescription! };
          await channel.send({ type: "broadcast", event: "answer", payload: msg });
        } catch (e) {
          console.error("[WebRTC] viewer offer/answer error", e);
        }
      })
      .on("broadcast", { event: "ice" }, async ({ payload }: { payload: IcePayload }) => {
        try {
          if (payload.viewerId !== viewerId) return;
          if (payload.from !== "broadcaster") return;
          const pc = ensurePc();
          if (!payload.candidate) return;
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch {
          // ignore
        }
      })
      .subscribe();

    // join
    channel.send({ type: "broadcast", event: "viewer-join", payload: { viewerId } as JoinPayload });

    return () => {
      try {
        channel.send({ type: "broadcast", event: "viewer-leave", payload: { viewerId } });
      } catch {}
      try {
        supabase.removeChannel(channel);
      } catch {}

      try {
        pcRef.current?.close();
      } catch {}
      pcRef.current = null;
    };
  }, [channelName, viewerId]);

  return (
    <div className={className}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={"w-full h-full object-cover"}
      />
      {!hasStream && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Connecting…</span>
        </div>
      )}
    </div>
  );
};
