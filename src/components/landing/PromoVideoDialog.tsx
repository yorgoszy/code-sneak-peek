import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface PromoVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl?: string;
}

// Placeholder — αντικατέστησε με το CDN URL του promo βίντεο μόλις ανέβει.
const DEFAULT_PROMO_VIDEO = "";

export const PromoVideoDialog: React.FC<PromoVideoDialogProps> = ({
  open,
  onOpenChange,
  videoUrl = DEFAULT_PROMO_VIDEO,
}) => {
  const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
  const ytId = isYouTube
    ? videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/)?.[1]
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 rounded-none bg-black border-0 overflow-hidden">
        <DialogTitle className="sr-only">Promo Video</DialogTitle>
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          {videoUrl ? (
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
