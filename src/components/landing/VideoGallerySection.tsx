import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Play, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

const parseYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  return match ? match[1] : null;
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

const fullName = (u?: AppUserLite | null) => {
  if (!u) return "";
  return `${u.first_name || ""} ${u.last_name || ""}`.trim();
};

const initials = (u?: AppUserLite | null) => {
  if (!u) return "?";
  const f = (u.first_name || "").charAt(0);
  const l = (u.last_name || "").charAt(0);
  return (f + l).toUpperCase() || "?";
};

interface Props {
  translations?: any;
}

const VideoGallerySection: React.FC<Props> = ({ translations }) => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<MatchVideo[]>([]);
  const [users, setUsers] = useState<Record<string, AppUserLite>>({});
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("match_videos")
        .select("id,title,competition_name,match_date,youtube_url,start_seconds,end_seconds,red_athlete_id,blue_athlete_id")
        .order("match_date", { ascending: false, nullsFirst: false })
        .limit(12);
      const list = (data as MatchVideo[]) || [];
      setVideos(list);

      const ids = Array.from(
        new Set(
          list.flatMap(v => [v.red_athlete_id, v.blue_athlete_id]).filter(Boolean) as string[]
        )
      );
      if (ids.length > 0) {
        const { data: usersData } = await (supabase as any)
          .from("app_users")
          .select("user_id,first_name,last_name,avatar_url")
          .in("user_id", ids);
        const map: Record<string, AppUserLite> = {};
        (usersData || []).forEach((u: any) => { map[u.user_id] = u; });
        setUsers(map);
      }
    };
    load();
  }, []);

  if (videos.length === 0) return null;

  const lang = translations?.language || "el";
  const sectionTitle = lang === "en" ? "Match Videos" : "Βίντεο Αγώνων";
  const subtitle = lang === "en"
    ? "Watch our athletes in action"
    : "Δες τους αθλητές μας σε δράση";
  const viewAll = lang === "en" ? "View full gallery" : "Δες όλα τα βίντεο";

  return (
    <section id="video-gallery-section" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-black text-white text-sm font-semibold mb-4">
            <Video className="w-4 h-4" />
            GALLERY
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">{sectionTitle}</h2>
          <p className="text-gray-600">{subtitle}</p>
        </div>

        <div className="max-w-6xl mx-auto mb-8">
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent>
              {videos.map((v) => {
                const thumb = getYouTubeThumb(v.youtube_url);
                const isPlaying = playingId === v.id;
                const red = v.red_athlete_id ? users[v.red_athlete_id] : null;
                const blue = v.blue_athlete_id ? users[v.blue_athlete_id] : null;
                return (
                  <CarouselItem key={v.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="bg-black border border-black overflow-hidden h-full">
                      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                        {isPlaying ? (
                          <iframe
                            src={buildEmbedUrl(v.youtube_url, v.start_seconds, v.end_seconds)}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={v.title}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPlayingId(v.id)}
                            className="absolute inset-0 w-full h-full group"
                            aria-label={`Play ${v.title}`}
                          >
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={v.title}
                                className="absolute inset-0 w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gray-900" />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                              <Play className="w-12 h-12 text-white" fill="white" />
                            </div>
                          </button>
                        )}
                      </div>
                      <div className="p-3 bg-white">
                        <h3 className="font-bold text-black text-sm truncate mb-2">{v.title}</h3>

                        {(red || blue) && (
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {red && (
                                <>
                                  <Avatar className="w-8 h-8 border-2 border-red-500">
                                    <AvatarImage src={red.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs bg-red-50 text-red-700">
                                      {initials(red)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-semibold text-black truncate">
                                    {fullName(red)}
                                  </span>
                                </>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 font-bold">VS</span>
                            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                              {blue && (
                                <>
                                  <span className="text-xs font-semibold text-black truncate text-right">
                                    {fullName(blue)}
                                  </span>
                                  <Avatar className="w-8 h-8 border-2 border-blue-500">
                                    <AvatarImage src={blue.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs bg-blue-50 text-blue-700">
                                      {initials(blue)}
                                    </AvatarFallback>
                                  </Avatar>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-gray-600 truncate">
                          {v.competition_name || ""}
                          {v.match_date ? ` · ${new Date(v.match_date).toLocaleDateString(lang === "en" ? "en-GB" : "el-GR")}` : ""}
                        </p>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="rounded-none" />
            <CarouselNext className="rounded-none" />
          </Carousel>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate("/video-gallery")}
            className="bg-black text-white px-8 py-4 text-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            {viewAll}
          </button>
        </div>
      </div>
    </section>
  );
};

export default VideoGallerySection;
