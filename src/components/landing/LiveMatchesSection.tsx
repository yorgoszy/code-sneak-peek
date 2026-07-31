import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Radio } from "lucide-react";
import { parseYouTubeId } from "@/utils/youtubeIframeApi";
import { useLandingSection } from "@/hooks/useLandingConfig";

const normalizeEmbedUrl = (url: string, startSec?: number | null, endSec?: number | null): string => {
  if (!url) return url;
  const ytParamsBase = "autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1";
  const extra: string[] = [];
  if (typeof startSec === "number" && startSec > 0) extra.push(`start=${startSec}`);
  if (typeof endSec === "number" && endSec > 0) extra.push(`end=${endSec}`);
  const extraStr = extra.join("&");

  if (url.includes("/embed/")) {
    const hasParams = url.includes("?");
    const sep = hasParams ? "&" : "?";
    const needsAutoplay = !url.includes("autoplay=1");
    let result = url;
    if (needsAutoplay) result = `${result}${sep}${ytParamsBase}`;
    if (extraStr) result = `${result}${result.includes("?") ? "&" : "?"}${extraStr}`;
    return result;
  }
  const ytId = parseYouTubeId(url);
  if (ytId) {
    const params = extraStr ? `${ytParamsBase}&${extraStr}` : ytParamsBase;
    return `https://www.youtube.com/embed/${ytId}?${params}`;
  }
  const twitchMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
  if (twitchMatch) {
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${host}&autoplay=true&muted=true`;
  }
  return url;
};

interface EventSponsor {
  name?: string;
  logo_url: string;
  link_url?: string;
}

interface LiveEvent {
  id: string;
  title: string;
  description: string | null;
  sponsors?: EventSponsor[] | null;
}

interface RingDay {
  date: string | null;
  embed_url: string;
  start_seconds: number | null;
  end_seconds: number | null;
}

interface LiveRing {
  id: string;
  event_id: string;
  ring_name: string;
  embed_url: string;
  display_order: number;
  embed_url_day1: string | null;
  embed_url_day2: string | null;
  day1_date: string | null;
  day2_date: string | null;
  day1_start_seconds: number | null;
  day1_end_seconds: number | null;
  day2_start_seconds: number | null;
  day2_end_seconds: number | null;
  days?: RingDay[] | null;
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getRingDays = (r: LiveRing): RingDay[] => {
  const fromJson = Array.isArray(r.days) ? r.days : [];
  if (fromJson.length > 0) return fromJson;
  const legacy: RingDay[] = [];
  if (r.day1_date || r.embed_url_day1) {
    legacy.push({ date: r.day1_date, embed_url: r.embed_url_day1 || "", start_seconds: r.day1_start_seconds, end_seconds: r.day1_end_seconds });
  }
  if (r.day2_date || r.embed_url_day2) {
    legacy.push({ date: r.day2_date, embed_url: r.embed_url_day2 || "", start_seconds: r.day2_start_seconds, end_seconds: r.day2_end_seconds });
  }
  return legacy;
};

const pickActiveEmbed = (r: LiveRing): { url: string; start: number | null; end: number | null } => {
  const today = todayStr();
  const days = getRingDays(r);
  const match = days.find((d) => d.date === today && d.embed_url);
  const chosen = match || days.find((d) => d.embed_url);
  if (chosen) return { url: chosen.embed_url, start: chosen.start_seconds, end: chosen.end_seconds };
  if (days.length > 0) return { url: "", start: null, end: null };
  return { url: r.embed_url || "", start: null, end: null };
};

interface Props {
  translations?: any;
}

const LiveMatchesSection: React.FC<Props> = ({ translations }) => {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [ringsByEvent, setRingsByEvent] = useState<Record<string, LiveRing[]>>({});
  const section = useLandingSection("live_matches");
  const [draftExtra, setDraftExtra] = useState<Record<string, any>>({});

  useEffect(() => {
    const load = async () => {
      const { data: ev } = await supabase
        .from("live_events")
        .select("id,title,description,sponsors")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (!ev || ev.length === 0) { setEvents([]); return; }
      setEvents(((ev || []) as any[]).map((e) => ({
        ...e,
        sponsors: Array.isArray(e.sponsors) ? (e.sponsors as EventSponsor[]) : [],
      })) as LiveEvent[]);
      const ids = ev.map((e) => e.id);
      const { data: rg } = await supabase
        .from("live_event_rings")
        .select("*")
        .in("event_id", ids)
        .order("display_order");
      const grouped: Record<string, LiveRing[]> = {};
      ((rg || []) as any[]).forEach((r) => {
        const ring = { ...r, days: Array.isArray(r.days) ? (r.days as RingDay[]) : [] } as LiveRing;
        if (!grouped[ring.event_id]) grouped[ring.event_id] = [];
        grouped[ring.event_id].push(ring);
      });
      setRingsByEvent(grouped);
    };
    load();
  }, []);

  useEffect(() => {
    setDraftExtra((section?.extra_data ?? {}) as Record<string, any>);
  }, [section?.extra_data]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const data = e.data;
      if (data?.type === "landing-editor-draft" && data.sectionKey === "live_matches") {
        setDraftExtra((data.extra ?? {}) as Record<string, any>);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const lang = translations?.language || "el";
  const ringLabel = lang === "en" ? "Ring" : "Ρινγκ";
  const sponsors = Array.isArray(draftExtra?.sponsor_logos)
    ? draftExtra.sponsor_logos.filter(Boolean)
    : [];
  const sponsorsCaption = lang === "en"
    ? (draftExtra?.sponsor_caption_en || draftExtra?.sponsor_caption || "Our sponsors")
    : (draftExtra?.sponsor_caption || "με την υποστήριξη");
  const anyEventHasActiveLink = events.some((event) =>
    (ringsByEvent[event.id] || []).some((r) => pickActiveEmbed(r).url)
  );

  if (events.length === 0 && sponsors.length === 0) return null;

  return (
    <section
      id="live-matches"
      className="py-20"
      style={{ backgroundColor: "#ffffff", color: "#000000" }}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold mb-4" style={{ backgroundColor: "#dc2626", color: "#ffffff" }}>
            <Radio className="w-4 h-4 animate-pulse" />
            LIVE
          </div>
        </div>

        {events.map((event) => {
          const rings = ringsByEvent[event.id] || [];
          const eventSponsors = (event.sponsors || []).filter((s) => s?.logo_url);
          if (rings.length === 0 && eventSponsors.length === 0) return null;
          const allDates = rings
            .flatMap((r) => getRingDays(r).map((d) => d.date))
            .filter((d): d is string => !!d)
            .sort();
          const startDate = allDates[0] || null;
          const formatDate = (iso: string) => {
            const [y, m, d] = iso.split("-");
            return `${d}/${m}/${y}`;
          };
          const hasAnyActiveLink = rings.some((r) => pickActiveEmbed(r).url);
          const cols =
            rings.length === 1
              ? "grid-cols-1"
              : rings.length === 2
              ? "md:grid-cols-2"
              : rings.length === 3
              ? "md:grid-cols-3"
              : "md:grid-cols-2";
          return (
            <div key={event.id} className="mb-12">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold">{event.title}</h3>
                {event.description && <p className="text-muted-foreground mt-1">{event.description}</p>}
              </div>

              {!hasAnyActiveLink ? (
                <div className="bg-white border border-border p-12 text-center">
                  <span className="text-lg md:text-xl font-bold uppercase tracking-widest text-black">
                    {lang === "en" ? "Coming soon" : "COMING SOON"}
                  </span>
                  {startDate && (
                    <div className="mt-2 text-sm text-black/70">
                      {lang === "en" ? "Starts" : "Έναρξη"}: {formatDate(startDate)}
                    </div>
                  )}
                  {eventSponsors.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-border">
                      <div className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {sponsorsCaption}
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
                        {eventSponsors.map((s, i) => {
                          const img = (
                            <img
                              src={s.logo_url}
                              alt={s.name || `${sponsorsCaption} ${i + 1}`}
                              className="h-12 max-w-[160px] object-contain md:h-16 grayscale transition-all duration-300 hover:grayscale-0"
                              loading="lazy"
                            />
                          );
                          return s.link_url ? (
                            <a
                              key={`${s.logo_url}-${i}`}
                              href={s.link_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={s.name || undefined}
                            >
                              {img}
                            </a>
                          ) : (
                            <span key={`${s.logo_url}-${i}`}>{img}</span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`grid gap-4 ${cols}`}>
                  {rings.map((r) => (
                    <div key={r.id} className="border border-border bg-background">
                      <div className="px-4 py-2 font-bold flex items-center justify-between" style={{ backgroundColor: "#f4f1ea", color: "#000000" }}>
                        <span>{ringLabel} {r.ring_name}</span>
                        <Radio className="w-4 h-4" />
                      </div>
                      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                        {(() => {
                          const active = pickActiveEmbed(r);
                          if (!active.url) {
                            const ringDates = getRingDays(r).map((d) => d.date).filter((d): d is string => !!d).sort();
                            const ringStart = ringDates[0] || startDate;
                            return (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black text-center px-4">
                                <span className="text-lg md:text-xl font-bold uppercase tracking-widest text-white">
                                  {lang === "en" ? "Coming soon" : "Coming soon"}
                                </span>
                                {ringStart && (
                                  <span className="text-sm text-white/70">
                                    {lang === "en" ? "Starts" : "Έναρξη"}: {formatDate(ringStart)}
                                  </span>
                                )}
                              </div>
                            );
                          }
                          return (
                            <iframe
                              src={normalizeEmbedUrl(active.url, active.start, active.end)}
                              className="absolute inset-0 w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={`${event.title} - ${ringLabel} ${r.ring_name}`}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {hasAnyActiveLink && eventSponsors.length > 0 && (
                <div className="mt-6 border-t border-border pt-5">
                  <div className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {sponsorsCaption}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
                    {eventSponsors.map((s, i) => {
                      const img = (
                        <img
                          src={s.logo_url}
                          alt={s.name || `${sponsorsCaption} ${i + 1}`}
                          className="h-12 max-w-[160px] object-contain md:h-16 grayscale transition-all duration-300 hover:grayscale-0"
                          loading="lazy"
                        />
                      );
                      return s.link_url ? (
                        <a
                          key={`${s.logo_url}-${i}`}
                          href={s.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={s.name || undefined}
                        >
                          {img}
                        </a>
                      ) : (
                        <span key={`${s.logo_url}-${i}`}>{img}</span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {anyEventHasActiveLink && sponsors.length > 0 && (
          <div className="mt-10 border-y border-border py-6">
            <div className="mb-5 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {sponsorsCaption}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {sponsors.map((logo: string, index: number) => (
                <img
                  key={`${logo}-${index}`}
                  src={logo}
                  alt={`${sponsorsCaption} ${index + 1}`}
                  className="h-12 max-w-[160px] object-contain md:h-16 grayscale transition-all duration-300 hover:grayscale-0"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default LiveMatchesSection;
