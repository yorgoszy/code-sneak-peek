import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Play, Video } from "lucide-react";

interface MatchVideo {
  id: string;
  title: string;
  competition_name: string | null;
  match_date: string | null;
  youtube_url: string;
  red_athlete_id: string | null;
  blue_athlete_id: string | null;
}

const getYouTubeThumb = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
};

interface Props {
  translations?: any;
}

const VideoGallerySection: React.FC<Props> = ({ translations }) => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<MatchVideo[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("match_videos")
        .select("id,title,competition_name,match_date,youtube_url,red_athlete_id,blue_athlete_id")
        .order("match_date", { ascending: false, nullsFirst: false })
        .limit(6);
      setVideos(data || []);
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {videos.map((v) => {
            const thumb = getYouTubeThumb(v.youtube_url);
            return (
              <button
                key={v.id}
                onClick={() => navigate("/video-gallery")}
                className="group text-left bg-black border border-black overflow-hidden hover:opacity-90 transition-opacity"
              >
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
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
                </div>
                <div className="p-3 bg-white">
                  <h3 className="font-bold text-black text-sm truncate">{v.title}</h3>
                  <p className="text-xs text-gray-600 truncate">
                    {v.competition_name || ""}
                    {v.match_date ? ` · ${new Date(v.match_date).toLocaleDateString(lang === "en" ? "en-GB" : "el-GR")}` : ""}
                  </p>
                </div>
              </button>
            );
          })}
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
