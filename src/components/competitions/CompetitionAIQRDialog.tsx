import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Download, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  competitionId?: string;
  competitionName?: string;
  triggerLabel?: string;
}

export const CompetitionAIQRDialog: React.FC<Props> = ({
  competitionId,
  competitionName,
  triggerLabel = "QR Hyper AI",
}) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const url = `${window.location.origin}/competition-ai${competitionId ? `?c=${competitionId}` : ""}`;

  const downloadQR = () => {
    const svg = document.getElementById("competition-ai-qr");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const img = new Image();
    const size = 1024;
    canvas.width = size;
    canvas.height = size;
    img.onload = () => {
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement("a");
      link.download = `hyper-ai-qr${competitionId ? `-${competitionId}` : ""}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Αντιγράφηκε" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="rounded-none gap-2">
        <QrCode className="w-4 h-4" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle>Hyper AI για τη Διοργάνωση</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Σκαναρε για να ρωτήσεις τον AI για αγώνες, ρινγκ, ζυγίσεις και live links
              {competitionName ? ` του "${competitionName}"` : ""}.
            </p>

            <div className="flex justify-center bg-white p-6 border border-border">
              <QRCodeSVG
                id="competition-ai-qr"
                value={url}
                size={256}
                level="H"
                includeMargin
              />
            </div>

            <div className="flex items-center justify-between gap-2 p-2 bg-muted text-xs font-mono break-all">
              <span className="truncate">{url}</span>
              <Button size="sm" variant="ghost" onClick={copyUrl} className="rounded-none shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <Button onClick={downloadQR} className="w-full rounded-none gap-2">
              <Download className="w-4 h-4" />
              Κατέβασμα QR (PNG)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
