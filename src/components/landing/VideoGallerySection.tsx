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

interface FightRow {
  id: string;
  user_id: string;
  opponent_name: string | null;
  fight_date: string;
  competition_name: string | null;
  location: string | null;
  video_url: string;
  our_corner: string | null;
}

interface AppUserLite {
  id: string;
  name: string | null;
  avatar_url: string | null;
  photo_url: string | null;
}

const parseYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  return match ? match[1] : null;
};

const getYouTubeThumb = (url: string): string | null => {
  const id = parseYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

const buildEmbedUrl = (url: string): string => {
  const id = parseYouTubeId(url);
  if (!id) return url;
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
};

const initials = (name?: string | null) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
};

const getAvatar = (u?: AppUserLite | null) => u?.avatar_url || u?.photo_url || undefined;

interface Props {
  translations?: any;
}

const VideoGallerySection: React.FC<Props> = ({ translations }) => {
  const navigate = useNavigate();
  const [fights, setFights] = useState<FightRow[]>([]);
  const [users, setUsers] = useState<Record<string, AppUserLite>>({});
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("muaythai_fights")
        .select("id,user_id,opponent_name,fight_date,competition_name,location,video_url,our_corner")
        .not("video_url", "is", null)
        .eq("is_public", true)
        .order("fight_date", { ascending: false })
        .limit(12);

      const list = ((data as any[]) || []).filter(f => !!f.video_url) as FightRow[];
      setFights(list);

      const ids = Array.from(new Set(list.map(f => f.user_id).filter(Boolean)));
      if (ids.length) {
        const { data: usersData } = await supabase
          .from("app_users")
          .select("id,name,avatar_url,photo_url")
          .in("id", ids);
        const map: Record<string, AppUserLite> = {};
        (usersData || []).forEach((u: any) => { map[u.id] = u; });
        setUsers(map);
      }
    };
    load();
  }, []);

  if (fights.length === 0) return null;

  const lang = translations?.language || "el";
  const sectionTitle = lang === "en" ? "Match Videos" : "Βίντεο Αγώνων";
  const subtitle = lang === "en"
    ? "Watch our athletes in action"
    : "Δες τους αθλητές μας σε δράση";
  const viewAll = lang === "en" ? "View full gallery" : "Δες όλα τα βίντεο";
  const vsLabel = "VS";

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
              {fights.map((f) => {
                const thumb = getYouTubeThumb(f.video_url);
                const isPlaying = playingId === f.id;
                const athlete = users[f.user_id];
                const athleteIsRed = (f.our_corner || "red") === "red";
                return (
                  <CarouselItem key={f.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="bg-black border border-black overflow-hidden h-full">
                      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                        {isPlaying ? (
                          <iframe
                            src={buildEmbedUrl(f.video_url)}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={`${athlete?.name || "Fight"} vs ${f.opponent_name || ""}`}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPlayingId(f.id)}
                            className="absolute inset-0 w-full h-full group"
                            aria-label={`Play fight`}
                          >
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={`${athlete?.name || ""} fight`}
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
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Avatar className={`w-8 h-8 border-2 ${athleteIsRed ? "border-red-500" : "border-blue-500"}`}>
                              <AvatarImage src={getAvatar(athlete)} />
                              <AvatarFallback className="text-xs">
                                {initials(athlete?.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-semibold text-black truncate">
                              {athlete?.name || "—"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 font-bold">{vsLabel}</span>
                          <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                            <span className="text-xs font-semibold text-black truncate text-right">
                              {f.opponent_name || "—"}
                            </span>
                            <Avatar className={`w-8 h-8 border-2 ${athleteIsRed ? "border-blue-500" : "border-red-500"}`}>
                              <AvatarFallback className="text-xs">
                                {initials(f.opponent_name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 truncate">
                          {f.competition_name || f.location || ""}
                          {f.fight_date ? ` · ${new Date(f.fight_date).toLocaleDateString(lang === "en" ? "en-GB" : "el-GR")}` : ""}
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
