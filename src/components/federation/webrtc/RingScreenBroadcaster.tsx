import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Monitor } from "lucide-react";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

type JoinPayload = { viewerId: string };
type OfferPayload = { viewerId: string; sdp: RTCSessionDescriptionInit };
type AnswerPayload = { viewerId: string; sdp: RTCSessionDescriptionInit };
type IcePayload = { viewerId: string; candidate: RTCIceCandidateInit; from: "broadcaster" | "viewer" };
type LeavePayload = { viewerId: string };

interface RingScreenBroadcasterProps {
  ringId: string;
  className?: string;
}

export const RingScreenBroadcaster: React.FC<RingScreenBroadcasterProps> = ({ ringId, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});

  const [error, setError] = useState<string | null>(null);
  const [needsPrompt, setNeedsPrompt] = useState(true);

  const channelName = useMemo(() => `webrtc-ring-${ringId}`, [ringId]);

  const startScreenCapture = async () => {
    try {
      setError(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      } as any);

      streamRef.current = stream;
      setNeedsPrompt(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Handle user stopping the share via browser UI
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        streamRef.current = null;
        setNeedsPrompt(true);
      });
    } catch (e: any) {
      console.error("[WebRTC] screen capture error", e);
      if (e.name === "NotAllowedError") {
        setNeedsPrompt(true);
      } else {
        setError("Αδυναμία κοινής χρήσης οθόνης");
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Signaling (same as RingCameraBroadcaster)
  useEffect(() => {
    const channel = supabase.channel(channelName);

    const closePc = (viewerId: string) => {
      const pc = pcsRef.current[viewerId];
      if (pc) {
        try { pc.close(); } catch {}
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
          console.error("[WebRTC] screen broadcaster offer error", e);
        }
      })
      .on("broadcast", { event: "answer" }, async ({ payload }: { payload: AnswerPayload }) => {
        try {
          const pc = pcsRef.current[payload.viewerId];
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        } catch (e) {
          console.error("[WebRTC] screen broadcaster answer error", e);
        }
      })
      .on("broadcast", { event: "ice" }, async ({ payload }: { payload: IcePayload }) => {
        try {
          if (payload.from !== "viewer") return;
          const pc = pcsRef.current[payload.viewerId];
          if (!pc) return;
          if (!payload.candidate) return;
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch {}
      })
      .on("broadcast", { event: "viewer-leave" }, ({ payload }: { payload: LeavePayload }) => {
        closePc(payload.viewerId);
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch {}
      Object.keys(pcsRef.current).forEach(closePc);
    };
  }, [channelName]);

  if (error) {
    return (
      <div className={`bg-black flex items-center justify-center ${className || ''}`}>
        <div className="text-center text-white/60">
          <Monitor className="h-6 w-6 mx-auto mb-1" />
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (needsPrompt) {
    return (
      <div className={`bg-black flex items-center justify-center ${className || ''}`}>
        <button
          onClick={startScreenCapture}
          className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors px-4 py-3"
        >
          <Monitor className="h-8 w-8" />
          <span className="text-xs font-medium">Κοινοποίηση Παραθύρου</span>
          <span className="text-[10px] text-white/50">Κάντε κλικ για να επιλέξετε παράθυρο</span>
        </button>
      </div>
    );
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
