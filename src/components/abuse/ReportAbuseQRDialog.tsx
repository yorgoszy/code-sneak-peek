import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Printer, QrCode } from "lucide-react";

const PUBLIC_URL = "https://hyperkids.gr/report-abuse";

export const ReportAbuseQRDialog = () => {
  const svgRef = useRef<HTMLDivElement>(null);

  const downloadPNG = () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const blob = new Blob([xml], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.drawImage(img, 0, 0, 1024, 1024);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "report-abuse-qr.png";
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const print = () => {
    const svg = svgRef.current?.querySelector("svg")?.outerHTML;
    if (!svg) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Report Abuse QR</title>
      <style>body{font-family:Arial;text-align:center;padding:40px;}
      h1{font-size:28px;margin-bottom:8px;} p{color:#555;margin:4px 0 24px;}
      .qr{display:inline-block;padding:20px;border:2px solid #000;}
      .url{margin-top:16px;font-size:14px;font-family:monospace;}
      </style></head><body>
      <h1>Καταγγελία Κακοποίησης</h1>
      <p>Σκάναρε τον QR κώδικα ή επισκέψου τη σελίδα</p>
      <div class="qr">${svg}</div>
      <div class="url">${PUBLIC_URL}</div>
      <p style="margin-top:32px;font-size:12px;color:#888;">Hyperkids · Ασφάλεια στον Αθλητισμό</p>
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-none">
          <QrCode className="h-4 w-4 mr-2" /> QR Code Καταγγελίας
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code · Δημόσια Καταγγελία</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div ref={svgRef} className="flex justify-center p-4 bg-white border-2 border-border">
            <QRCodeSVG value={PUBLIC_URL} size={256} level="H" includeMargin />
          </div>
          <p className="text-xs text-center font-mono break-all text-muted-foreground">{PUBLIC_URL}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={downloadPNG} variant="outline" className="rounded-none">
              <Download className="h-4 w-4 mr-2" /> PNG
            </Button>
            <Button onClick={print} variant="outline" className="rounded-none">
              <Printer className="h-4 w-4 mr-2" /> Εκτύπωση
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
