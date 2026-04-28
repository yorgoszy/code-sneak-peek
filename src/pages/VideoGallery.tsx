import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Radio, Calendar, Trophy, ArrowLeft } from "lucide-react";
import { parseYouTubeId } from "@/utils/youtubeIframeApi";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const buildEmbedUrl = (url: string, startSec?: number | null, endSec?: number | null): string => {
  if (!url) return url;
  const base = "autoplay=0&mute=0&playsinline=1&controls=1&rel=0&modestbranding=1";
  const extra: string[] = [];
  if (typeof startSec === "number" && startSec > 0) extra.push(`start=${startSec}`);
  if (typeof endSec === "number" && endSec > 0) extra.push(`end=${endSec}`);
  const ytId = parseYouTubeId(url);
  if (ytId) {
    const params = extra.length ? `${base}&${extra.join("&")}` : base;
    return `https://www.youtube.com/embed/${ytId}?${params}`;
  }
  return url;
};

interface MatchVideo {
  id: string;
  title: string;
  competition_name: string | null;
  match_date: string | null;
  age_category: string | null;
  weight_category: string | null;
  youtube_url: string;
  start_seconds: number | null;
  end_seconds: number | null;
  red_athlete_id: string | null;
  blue_athlete_id: string | null;
}

interface AthleteInfo {
  id: string;
  name: string;
  photo_url?: string | null;
  avatar_url?: string | null;
}

const VideoGallery: React.FC = () => {
  const [videos, setVideos] = useState<MatchVideo[]>([]);
  const [athletes, setAthletes] = useState<Record<string, AthleteInfo>>({});
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("match_videos" as any)
        .select("*")
        .order("match_date", { ascending: false, nullsFirst: false });
      const list = (data || []) as unknown as MatchVideo[];
      setVideos(list);

      const ids = Array.from(new Set(list.flatMap(v => [v.red_athlete_id, v.blue_athlete_id]).filter(Boolean))) as string[];
      if (ids.length) {
        const { data: us } = await supabase
          .from("app_users")
          .select("id,name,photo_url,avatar_url")
          .in("id", ids);
        const map: Record<string, AthleteInfo> = {};
        (us || []).forEach((u: any) => { map[u.id] = u; });
        setAthletes(map);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Group videos by athlete (each video appears under both red & blue athlete)
  const grouped = useMemo(() => {
    const m: Record<string, MatchVideo[]> = {};
    videos.forEach(v => {
      [v.red_athlete_id, v.blue_athlete_id].forEach((aid) => {
        if (!aid) return;
        if (!m[aid]) m[aid] = [];
        m[aid].push(v);
      });
    });
    return m;
  }, [videos]);

  const athleteList = useMemo(() => {
    return Object.keys(grouped)
      .map(id => athletes[id])
      .filter(Boolean)
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "el"));
  }, [grouped, athletes]);

  const visibleAthletes = selectedAthleteId === "all"
    ? athleteList
    : athleteList.filter(a => a.id === selectedAthleteId);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-black sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Αρχική
          </Link>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            <h1 className="text-xl font-bold">Video Gallery Αγώνων</h1>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Athlete filter */}
        {athleteList.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Button
              variant={selectedAthleteId === "all" ? "default" : "outline"}
              className="rounded-none"
              onClick={() => setSelectedAthleteId("all")}
            >
              Όλοι ({athleteList.length})
            </Button>
            {athleteList.map(a => (
              <Button
                key={a.id}
                variant={selectedAthleteId === a.id ? "default" : "outline"}
                className="rounded-none flex items-center gap-2"
                onClick={() => setSelectedAthleteId(a.id)}
              >
                <img
                  src={a.photo_url || a.avatar_url || "/placeholder.svg"}
                  alt={a.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
                {a.name} ({grouped[a.id]?.length || 0})
              </Button>
            ))}
          </div>
        )}

        {loading && <p className="text-center text-white/60">Φόρτωση...</p>}
        {!loading && athleteList.length === 0 && (
          <p className="text-center text-white/60 py-20">Δεν υπάρχουν βίντεο ακόμη.</p>
        )}

        {visibleAthletes.map(athlete => {
          const list = grouped[athlete.id] || [];
          return (
            <section key={athlete.id} className="mb-12">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                <img
                  src={athlete.photo_url || athlete.avatar_url || "/placeholder.svg"}
                  alt={athlete.name}
                  className="w-12 h-12 rounded-full object-cover border border-white/20"
                />
                <div>
                  <h2 className="text-2xl font-bold">{athlete.name}</h2>
                  <p className="text-sm text-white/60">{list.length} βίντεο αγώνων</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {list.map(v => {
                  const isRed = v.red_athlete_id === athlete.id;
                  const opponent = isRed ? v.blue_athlete_id : v.red_athlete_id;
                  const opponentName = opponent ? (athletes[opponent]?.name || "—") : "—";
                  return (
                    <article key={v.id} className="bg-gray-900 border border-white/10">
                      <div className="px-3 py-2 bg-white text-black flex items-center justify-between">
                        <span className="font-semibold text-sm truncate">{v.title}</span>
                        <Radio className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                        <iframe
                          src={buildEmbedUrl(v.youtube_url, v.start_seconds, v.end_seconds)}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={v.title}
                          loading="lazy"
                        />
                      </div>
                      <div className="p-3 text-sm space-y-1">
                        <div className="flex items-center gap-2 text-white/80">
                          <span className={isRed ? "text-red-500 font-semibold" : "text-blue-500 font-semibold"}>
                            {isRed ? "RED" : "BLUE"}
                          </span>
                          <span>vs</span>
                          <span className={isRed ? "text-blue-500" : "text-red-500"}>{opponentName}</span>
                        </div>
                        {(v.competition_name || v.match_date) && (
                          <div className="flex items-center gap-1 text-xs text-white/60">
                            <Calendar className="w-3 h-3" />
                            {v.match_date && <span>{v.match_date}</span>}
                            {v.competition_name && <span>· {v.competition_name}</span>}
                          </div>
                        )}
                        {(v.age_category || v.weight_category) && (
                          <div className="text-xs text-white/60">
                            {v.age_category}{v.weight_category ? ` · ${v.weight_category}` : ""}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
};

export default VideoGallery;
