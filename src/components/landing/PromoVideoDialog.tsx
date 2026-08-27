import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface PromoVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl?: string;
}

// Placeholder — αντικατέστησε με το CDN URL του promo βίντεο μόλις ανέβει.
const DEFAULT_PROMO_VIDEO = "";

// Instagram reel/post/tv URL → embed URL
const parseInstagram = (url: string) => {
  const m = url.match(/instagram\.com\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/i);
  if (!m) return null;
  const kind = m[1] === 'reels' ? 'reel' : m[1];
  return `https://www.instagram.com/${kind}/${m[2]}/embed/captioned/`;
};

export const PromoVideoDialog: React.FC<PromoVideoDialogProps> = ({
  open,
  onOpenChange,
  videoUrl = DEFAULT_PROMO_VIDEO,
}) => {
  const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
  const ytId = isYouTube
    ? videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/)?.[1]
    : null;
  const igEmbed = !isYouTube ? parseInstagram(videoUrl) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 rounded-none bg-black border-0 overflow-hidden w-[min(92vw,420px)] max-w-[420px]">
        <DialogTitle className="sr-only">Promo Video</DialogTitle>
        <div className="relative w-full" style={{ paddingBottom: "177.78%" }}>
          {igEmbed ? (
            <>
              <iframe
                src={igEmbed}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                scrolling="no"
                frameBorder={0}
                title="Instagram promo video"
              />
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 z-10 bg-white/90 text-black text-xs px-2 py-1"
              >
                Άνοιξε στο Instagram
              </a>
            </>
          ) : videoUrl ? (
            ytId ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Promo video"
              />
            ) : (
              <video
                src={videoUrl}
                className="absolute inset-0 w-full h-full object-contain"
                controls
                autoPlay
                muted
                playsInline
              />
            )
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white text-center p-6">
              Δεν έχει οριστεί ακόμη promo βίντεο.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

