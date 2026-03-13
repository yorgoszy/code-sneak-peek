import { useEffect, useState } from "react";

let loadingPromise: Promise<void> | null = null;

export function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const w = window as any;
  if (w.YT && w.YT.Player) return Promise.resolve();

  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise<void>((resolve) => {
    // Preserve existing callback chain if present
    const previousReady = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      try {
        if (typeof previousReady === "function") previousReady();
      } finally {
        resolve();
      }
    };

    if (!document.getElementById("yt-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });

  return loadingPromise;
}

export function parseYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ];

  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

export function useYouTubeApiReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadYouTubeIframeApi().then(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return ready;
}
