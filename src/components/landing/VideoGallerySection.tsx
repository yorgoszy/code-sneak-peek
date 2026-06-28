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
  athlete_name: string | null;
  athlete_avatar_url: string | null;
  opponent_name: string | null;
  fight_date: string;
  competition_name: string | null;
  location: string | null;
  video_url: string;
  our_corner: string | null;
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

const splitName = (name?: string | null): { first: string; last: string } => {
  if (!name) return { first: "", last: "" };
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
};

interface Props {
  translations?: any;
}

const VideoGallerySection: React.FC<Props> = ({ translations }) => {
  const navigate = useNavigate();
  const [fights, setFights] = useState<FightRow[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await (supabase as any).rpc("get_public_fight_gallery", { _limit: 12 });
      if (error) {
        console.error("Error loading public fight gallery", error);
        return;
      }
      setFights(((data as any[]) || []) as FightRow[]);
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
        </div>

        <div className="max-w-6xl mx-auto mb-8">
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent>
              {fights.map((f) => {
                const thumb = getYouTubeThumb(f.video_url);
                const isPlaying = playingId === f.id;
                const athleteIsRed = (f.our_corner || "red") === "red";
                const athleteName = f.athlete_name || "";
                const opponentName = f.opponent_name || "";
                const a = splitName(athleteName);
                const o = splitName(opponentName);
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
                            title={`${athleteName || "Fight"} vs ${opponentName}`}
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
                                alt={`${athleteName} fight`}
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
                      <div className="p-3 bg-[#ffffff]">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Avatar className={`w-8 h-8 border-2 ${athleteIsRed ? "border-red-500" : "border-blue-500"} shrink-0`}>
                              <AvatarImage src={f.athlete_avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {initials(athleteName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 leading-tight">
                              <div className="text-[10px] font-semibold text-black truncate uppercase">{a.first || "—"}</div>
                              <div className="text-[10px] font-semibold text-black truncate uppercase">{a.last}</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold shrink-0">{vsLabel}</span>
                          <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                            <div className="min-w-0 leading-tight text-right">
                              <div className="text-[10px] font-semibold text-black truncate uppercase">{o.first || "—"}</div>
                              <div className="text-[10px] font-semibold text-black truncate uppercase">{o.last}</div>
                            </div>
                            <Avatar className={`w-8 h-8 border-2 ${athleteIsRed ? "border-blue-500" : "border-red-500"} shrink-0`}>
                              <AvatarFallback className="text-[10px]">
                                {initials(opponentName)}
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
            className="bg-white text-black border border-black px-8 py-4 text-lg font-semibold hover:bg-black hover:text-white transition-colors rounded-none"
          >
            {viewAll}
          </button>
        </div>
      </div>
    </section>
  );
};

export default VideoGallerySection;
