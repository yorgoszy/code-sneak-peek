import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseYouTubeId, useYouTubeApiReady } from "@/utils/youtubeIframeApi";

type SyncMode = "broadcaster" | "viewer";

interface SyncedYouTubePlayerProps {
  ringId: string;
  videoUrl: string;
  mode: SyncMode;
  className?: string;
  /** federation: allow controls, coach: no controls */
  controls?: 0 | 1;
}

type SyncPayload = {
  t: number;
  playing: boolean;
  sentAt: number;
};

export const SyncedYouTubePlayer: React.FC<SyncedYouTubePlayerProps> = ({
  ringId,
  videoUrl,
  mode,
  className,
  controls = 0,
}) => {
  const apiReady = useYouTubeApiReady();
  const containerId = useMemo(() => `yt-ring-${ringId}-${mode}`, [ringId, mode]);
  const playerRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  const lastPayloadRef = useRef<SyncPayload | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const youtubeId = useMemo(() => parseYouTubeId(videoUrl), [videoUrl]);

  // Create channel (broadcast)
  useEffect(() => {
    const channel = supabase.channel(`yt-sync-${ringId}`);
    channelRef.current = channel;

    channel.subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
      channelRef.current = null;
    };
  }, [ringId]);

  // Create/destroy player
  useEffect(() => {
    if (!apiReady) return;
    if (!youtubeId) return;

    const w = window as any;
    if (!w.YT?.Player) return;

    // Destroy previous
    if (playerRef.current?.destroy) {
      try {
        playerRef.current.destroy();
      } catch {}
      playerRef.current = null;
      setIsPlayerReady(false);
    }

    const player = new w.YT.Player(containerId, {
      width: "100%",
      height: "100%",
      videoId: youtubeId,
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls,
        disablekb: controls === 0 ? 1 : 0,
        modestbranding: 1,
        rel: 0,
        fs: 1,
        playsinline: 1,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          setIsPlayerReady(true);
          // Force iframe to fill container
          try {
            const iframe = document.querySelector(`#${containerId} iframe, #${containerId}`) as HTMLElement;
            if (iframe?.tagName === 'IFRAME') {
              iframe.style.width = '100%';
              iframe.style.height = '100%';
              iframe.style.position = 'absolute';
              iframe.style.inset = '0';
            }
          } catch {}
          try {
            player.mute();
            player.playVideo();
          } catch {}
        },
      },
    });

    playerRef.current = player;

    return () => {
      try {
        player.destroy();
      } catch {}
      playerRef.current = null;
      setIsPlayerReady(false);
    };
  }, [apiReady, youtubeId, containerId, controls]);

  // Broadcaster: periodically broadcast current time/state
  useEffect(() => {
    if (mode !== "broadcaster") return;
    if (!isPlayerReady) return;

    const channel = channelRef.current;
    const player = playerRef.current;
    if (!channel || !player?.getCurrentTime) return;

    const timer = window.setInterval(async () => {
      try {
        const t = Number(player.getCurrentTime?.() ?? 0);
        const state = player.getPlayerState?.(); // 1 playing, 2 paused
        const playing = state === 1;

        const payload: SyncPayload = {
          t,
          playing,
          sentAt: Date.now(),
        };

        await channel.send({
          type: "broadcast",
          event: "sync",
          payload,
        });
      } catch {
        // ignore
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [mode, isPlayerReady]);

  // Viewer: listen for sync payloads
  useEffect(() => {
    if (mode !== "viewer") return;

    const channel = channelRef.current;
    if (!channel) return;

    channel.on(
      "broadcast",
      { event: "sync" },
      ({ payload }: { payload: SyncPayload }) => {
        lastPayloadRef.current = payload;
      }
    );

    return () => {
      // channel is removed in cleanup above
    };
  }, [mode, ringId]);

  // Viewer: apply sync (seek only when drift is large to avoid jitter)
  useEffect(() => {
    if (mode !== "viewer") return;
    if (!isPlayerReady) return;

    const player = playerRef.current;
    if (!player?.getCurrentTime || !player?.seekTo) return;

    const timer = window.setInterval(() => {
      const p = lastPayloadRef.current;
      if (!p) return;

      const latencySec = (Date.now() - p.sentAt) / 1000;
      const target = Math.max(0, p.t + latencySec);

      try {
        const current = Number(player.getCurrentTime?.() ?? 0);
        const diff = target - current;

        if (Math.abs(diff) > 1.75) {
          player.seekTo(target, true);
        }

        if (p.playing) {
          player.playVideo?.();
        } else {
          player.pauseVideo?.();
        }
      } catch {
        // ignore
      }
    }, 750);

    return () => window.clearInterval(timer);
  }, [mode, isPlayerReady]);

  if (!youtubeId) {
    return <div className={className} />;
  }

  return (
    <div className={`relative ${className || ''}`}>
      <div id={containerId} className="absolute inset-0 w-full h-full [&>iframe]:!w-full [&>iframe]:!h-full [&>iframe]:!absolute [&>iframe]:!inset-0" />
    </div>
  );
};
