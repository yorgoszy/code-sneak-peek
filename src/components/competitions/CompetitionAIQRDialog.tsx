import React, { useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  Download,
  Copy,
  Check,
  Sparkles,
  Mail,
  MessageCircle,
  ImageIcon,
  Calendar,
  MapPin,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface Props {
  competitionId?: string;
  competitionName?: string;
  competitionDate?: string;
  competitionLocation?: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "ghost";
  triggerSize?: "default" | "sm" | "lg";
  triggerClassName?: string;
  iconOnly?: boolean;
}

const formatDate = (raw?: string) => {
  if (!raw) return null;
  try {
    return new Date(raw).toLocaleDateString("el-GR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return raw;
  }
};

export const CompetitionAIQRDialog: React.FC<Props> = ({
  competitionId,
  competitionName,
  competitionDate,
  competitionLocation,
  triggerLabel = "Hyper AI QR",
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerClassName,
  iconOnly = false,
}) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<"qr" | "poster" | null>(null);
  const { toast } = useToast();
  const posterRef = useRef<HTMLDivElement>(null);

  const url = useMemo(
    () =>
      `${window.location.origin}/competition-ai${competitionId ? `?c=${competitionId}` : ""}`,
    [competitionId]
  );

  const niceDate = formatDate(competitionDate);

  const safeFileSlug = (competitionName || "hyper-ai")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60) || "hyper-ai";

  const downloadQR = async () => {
    const svg = document.getElementById("competition-ai-qr-svg");
    if (!svg) return;
    setDownloading("qr");
    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const img = new Image();
      const size = 1024;
      canvas.width = size;
      canvas.height = size;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const ctx = canvas.getContext("2d")!;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          const link = document.createElement("a");
          link.download = `hyper-ai-qr-${safeFileSlug}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
          resolve();
        };
        img.onerror = reject;
        img.src =
          "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
      });
    } catch (e) {
      console.error("downloadQR failed", e);
      toast({ title: "Σφάλμα στο κατέβασμα", variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  const downloadPoster = async () => {
    if (!posterRef.current) return;
    setDownloading("poster");
    try {
      const canvas = await html2canvas(posterRef.current, {
        backgroundColor: "#000000",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `hyper-ai-poster-${safeFileSlug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("downloadPoster failed", e);
      toast({ title: "Σφάλμα στο poster", variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Αντιγράφηκε" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `Hyper AI – ${competitionName || "Διοργάνωση"}\nΡώτα για αγώνες, ρινγκ & live: ${url}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener"
    );
  };

  const shareEmail = () => {
    const subject = `Hyper AI – ${competitionName || "Διοργάνωση"}`;
    const body = `Ρώτα τον Hyper AI για αγώνες, ρινγκ, ζυγίσεις και live links:\n\n${url}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <>
      <Button
        variant={triggerVariant}
        size={triggerSize}
        onClick={() => setOpen(true)}
        className={`rounded-none gap-2 ${triggerClassName || ""}`}
        aria-label={triggerLabel}
      >
        <QrCode className="w-4 h-4" />
        {!iconOnly && <span>{triggerLabel}</span>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-none max-w-3xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="w-5 h-5" />
              Hyper AI {competitionName ? `– ${competitionName}` : "– Όλες οι Διοργανώσεις"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Σκάναρε ή μοιράσου το link. Ο AI απαντά για αγώνες, ρινγκ, ζυγίσεις και live streams σε πραγματικό χρόνο.
            </p>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-0">
            {/* Poster preview (also used as canvas source for download) */}
            <div className="bg-muted/40 p-4 flex justify-center">
              <div
                ref={posterRef}
                className="relative bg-black text-white w-[280px] aspect-[3/4] flex flex-col"
                style={{ fontFamily: "'Robert Pro','Inter',sans-serif" }}
              >
                <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase">
                    <Sparkles className="w-3 h-3" />
                    <span>Hyper AI</span>
                  </div>
                  <span
                    className="text-[9px] tracking-[0.25em] uppercase border px-1.5 py-0.5"
                    style={{ borderColor: "#00ffba", color: "#00ffba" }}
                  >
                    LIVE
                  </span>
                </div>

                <div className="px-5 pb-3">
                  <p className="text-[18px] leading-tight font-semibold line-clamp-2">
                    {competitionName || "Διοργανώσεις HYPERKIDS"}
                  </p>
                  {(niceDate || competitionLocation) && (
                    <div className="mt-1.5 space-y-0.5 text-[10px] text-white/70">
                      {niceDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{niceDate}</span>
                        </div>
                      )}
                      {competitionLocation && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="line-clamp-1">{competitionLocation}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex items-center justify-center px-5">
                  <div className="bg-white p-3">
                    <QRCodeSVG
                      id="competition-ai-qr-svg"
                      value={url}
                      size={180}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                </div>

                <div className="px-5 pt-3 pb-5 text-center">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-white/60">
                    Σκάναρε για ζωντανές πληροφορίες
                  </p>
                  <p className="text-[11px] mt-1 font-medium" style={{ color: "#00ffba" }}>
                    Αγώνες · Ρινγκ · Ζυγίσεις · Live
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 space-y-4 flex flex-col">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
                  Σύνδεσμος
                </p>
                <div className="flex items-stretch border border-border">
                  <span className="flex-1 px-3 py-2 text-xs font-mono break-all text-foreground bg-muted/50">
                    {url}
                  </span>
                  <button
                    type="button"
                    onClick={copyUrl}
                    className="px-3 border-l border-border hover:bg-foreground hover:text-background transition-colors flex items-center justify-center"
                    aria-label="Αντιγραφή link"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
                  Κατέβασμα
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={downloadQR}
                    disabled={downloading !== null}
                    variant="outline"
                    className="rounded-none gap-2 justify-start"
                  >
                    <QrCode className="w-4 h-4" />
                    {downloading === "qr" ? "..." : "QR PNG"}
                  </Button>
                  <Button
                    onClick={downloadPoster}
                    disabled={downloading !== null}
                    className="rounded-none gap-2 justify-start bg-foreground text-background hover:bg-foreground/90"
                  >
                    <ImageIcon className="w-4 h-4" />
                    {downloading === "poster" ? "..." : "Poster"}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
                  Διαμοιρασμός
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={shareWhatsApp}
                    variant="outline"
                    className="rounded-none gap-2 justify-start"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </Button>
                  <Button
                    onClick={shareEmail}
                    variant="outline"
                    className="rounded-none gap-2 justify-start"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                </div>
              </div>

              <div className="mt-auto text-[10px] text-muted-foreground leading-snug">
                Tip: Τύπωσε το poster και τοποθέτησέ το σε εμφανές σημείο στο χώρο της διοργάνωσης.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
