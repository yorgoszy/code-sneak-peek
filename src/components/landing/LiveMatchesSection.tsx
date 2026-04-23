import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Radio } from "lucide-react";
import { parseYouTubeId } from "@/utils/youtubeIframeApi";

const normalizeEmbedUrl = (url: string): string => {
  if (!url) return url;
  // Already an embed URL
  // YouTube live params: autoplay, muted (required for autoplay), playsinline, loop
  const ytParams = "autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1";
  if (url.includes("/embed/")) {
    // Ensure autoplay/mute params are present
    const hasParams = url.includes("?");
    if (url.includes("autoplay=1")) return url;
    return `${url}${hasParams ? "&" : "?"}${ytParams}`;
  }
  // Try YouTube parsing
  const ytId = parseYouTubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}?${ytParams}`;
  // Twitch channel
  const twitchMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
  if (twitchMatch) {
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${host}&autoplay=true&muted=true`;
  }
  return url;
};

interface LiveEvent {
  id: string;
  title: string;
  description: string | null;
}

interface LiveRing {
  id: string;
  event_id: string;
  ring_name: string;
  embed_url: string;
  display_order: number;
}

interface Props {
  translations?: any;
}

const LiveMatchesSection: React.FC<Props> = ({ translations }) => {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [ringsByEvent, setRingsByEvent] = useState<Record<string, LiveRing[]>>({});

  useEffect(() => {
    const load = async () => {
      const { data: ev } = await supabase
        .from("live_events")
        .select("id,title,description")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (!ev || ev.length === 0) { setEvents([]); return; }
      setEvents(ev);
      const ids = ev.map((e) => e.id);
      const { data: rg } = await supabase
        .from("live_event_rings")
        .select("*")
        .in("event_id", ids)
        .order("display_order");
      const grouped: Record<string, LiveRing[]> = {};
      (rg || []).forEach((r) => {
        if (!grouped[r.event_id]) grouped[r.event_id] = [];
        grouped[r.event_id].push(r);
      });
      setRingsByEvent(grouped);
    };
    load();
  }, []);

  if (events.length === 0) return null;

  const lang = translations?.language || "el";
  const sectionTitle = lang === "en" ? "Live Matches" : "Live Αγώνες";
  const ringLabel = lang === "en" ? "Ring" : "Ρινγκ";

  return (
    <section id="live-matches" className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white text-sm font-semibold mb-4">
            <Radio className="w-4 h-4 animate-pulse" />
            LIVE
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{sectionTitle}</h2>
        </div>

        {events.map((event) => {
          const rings = ringsByEvent[event.id] || [];
          if (rings.length === 0) return null;
          const cols = rings.length === 1 ? "grid-cols-1" : rings.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3";
          return (
            <div key={event.id} className="mb-12">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white">{event.title}</h3>
                {event.description && <p className="text-gray-400 mt-1">{event.description}</p>}
              </div>
              <div className={`grid gap-4 ${cols}`}>
                {rings.map((r) => (
                  <div key={r.id} className="bg-gray-900 border border-gray-800">
                    <div className="px-4 py-2 bg-white text-black font-bold flex items-center justify-between">
                      <span>{ringLabel} {r.ring_name}</span>
                      <Radio className="w-4 h-4" />
                    </div>
                    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                      <iframe
                        src={normalizeEmbedUrl(r.embed_url)}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={`${event.title} - ${ringLabel} ${r.ring_name}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default LiveMatchesSection;
