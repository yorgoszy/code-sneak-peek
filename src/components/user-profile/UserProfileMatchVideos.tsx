import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Video } from "lucide-react";

interface MatchVideo {
  id: string;
  title: string;
  competition_name: string | null;
  match_date: string | null;
  youtube_url: string;
  start_seconds: number | null;
  end_seconds: number | null;
  red_athlete_id: string | null;
  blue_athlete_id: string | null;
}

interface AppUserLite {
  id: string;
  name: string | null;
  avatar_url: string | null;
  photo_url: string | null;
}

const parseYouTubeId = (url: string): string | null => {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  return m ? m[1] : null;
};

const getYouTubeThumb = (url: string): string | null => {
  const id = parseYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

const buildEmbedUrl = (url: string, start?: number | null, end?: number | null): string => {
  const id = parseYouTubeId(url);
  if (!id) return url;
  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  if (typeof start === "number" && start > 0) params.set("start", String(start));
  if (typeof end === "number" && end > 0) params.set("end", String(end));
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
};

const initials = (u?: AppUserLite | null) => {
  if (!u) return "?";
  const parts = (u.name || "").trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
};

const getAvatar = (u?: AppUserLite | null) => u?.avatar_url || u?.photo_url || undefined;

interface Props {
  userId: string;
}

export const UserProfileMatchVideos: React.FC<Props> = ({ userId }) => {
  const [videos, setVideos] = useState<MatchVideo[]>([]);
  const [users, setUsers] = useState<Record<string, AppUserLite>>({});
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setLoading(true);
      const { data } = await supabase
        .from("match_videos")
        .select("id,title,competition_name,match_date,youtube_url,start_seconds,end_seconds,red_athlete_id,blue_athlete_id")
        .or(`red_athlete_id.eq.${userId},blue_athlete_id.eq.${userId}`)
        .order("match_date", { ascending: false, nullsFirst: false });
      const list = (data as MatchVideo[]) || [];
      setVideos(list);

      const ids = Array.from(
        new Set(list.flatMap(v => [v.red_athlete_id, v.blue_athlete_id]).filter(Boolean) as string[])
      );
      if (ids.length > 0) {
        const { data: usersData } = await (supabase as any)
          .from("app_users")
          .select("id,name,avatar_url,photo_url")
          .in("id", ids);
        const map: Record<string, AppUserLite> = {};
        (usersData || []).forEach((u: any) => { map[u.id] = u; });
        setUsers(map);
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) {
    return <div className="text-sm text-gray-500">Φόρτωση...</div>;
  }

  if (videos.length === 0) {
    return (
      <div className="border border-gray-200 p-8 text-center text-gray-500 rounded-none">
        <Video className="h-10 w-10 mx-auto mb-2 opacity-40" />
        <p>Δεν υπάρχουν βίντεο αγώνων για τον χρήστη.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((v) => {
        const red = v.red_athlete_id ? users[v.red_athlete_id] : null;
        const blue = v.blue_athlete_id ? users[v.blue_athlete_id] : null;
        const thumb = getYouTubeThumb(v.youtube_url);
        const isPlaying = playingId === v.id;

        return (
          <div key={v.id} className="border border-gray-200 bg-white rounded-none overflow-hidden">
            <div className="relative aspect-video bg-black">
              {isPlaying ? (
                <iframe
                  src={buildEmbedUrl(v.youtube_url, v.start_seconds, v.end_seconds)}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  title={v.title}
                />
              ) : (
                <button
                  onClick={() => setPlayingId(v.id)}
                  className="absolute inset-0 w-full h-full group"
                >
                  {thumb && (
                    <img src={thumb} alt={v.title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 flex items-center justify-center transition-colors">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="h-6 w-6 text-black ml-1" />
                    </div>
                  </div>
                </button>
              )}
            </div>
            <div className="p-3 space-y-2">
              <h3 className="font-semibold text-sm truncate">{v.title}</h3>
              {v.competition_name && (
                <p className="text-xs text-gray-500 truncate">{v.competition_name}</p>
              )}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-7 w-7 ring-2 ring-red-500">
                    <AvatarImage src={getAvatar(red)} />
                    <AvatarFallback className="text-[10px]">{initials(red)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate">{red?.name || "—"}</span>
                </div>
                <span className="text-xs text-gray-400">vs</span>
                <div className="flex items-center gap-2 min-w-0 justify-end">
                  <span className="text-xs truncate">{blue?.name || "—"}</span>
                  <Avatar className="h-7 w-7 ring-2 ring-blue-500">
                    <AvatarImage src={getAvatar(blue)} />
                    <AvatarFallback className="text-[10px]">{initials(blue)}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
