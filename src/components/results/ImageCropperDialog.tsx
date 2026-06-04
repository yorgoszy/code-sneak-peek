import React, { useState, useCallback, useEffect } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ImageCropperDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  aspect?: number;
  onCropComplete: (file: File) => void;
  originalFileName?: string;
}

const PREVIEW_MAX = 1280; // fast preview
const OUTPUT_MAX = 1600;  // final output cap

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function downscaleSource(src: string, max: number): Promise<{ url: string; scale: number }> {
  const img = await loadImage(src);
  const longest = Math.max(img.width, img.height);
  if (longest <= max) return { url: src, scale: 1 };
  const scale = max / longest;
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  const url = canvas.toDataURL('image/jpeg', 0.9);
  return { url, scale };
}

async function getCroppedImg(imageSrc: string, crop: Area, fileName: string): Promise<File> {
  const image = await loadImage(imageSrc);

  // cap output
  let outW = crop.width;
  let outH = crop.height;
  const longest = Math.max(outW, outH);
  if (longest > OUTPUT_MAX) {
    const s = OUTPUT_MAX / longest;
    outW = Math.round(outW * s);
    outH = Math.round(outH * s);
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, outW, outH);

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Canvas empty'));
      const name = fileName.replace(/\.[^.]+$/, '') + '-cropped.jpg';
      resolve(new File([blob], name, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.88);
  });
}

export const ImageCropperDialog: React.FC<ImageCropperDialogProps> = ({
  isOpen,
  onClose,
  imageSrc,
  aspect = 16 / 9,
  onCropComplete,
  originalFileName = 'image.jpg',
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [preparing, setPreparing] = useState(false);

  // downscale source for fast preview when dialog opens
  useEffect(() => {
    let cancelled = false;
    if (!isOpen || !imageSrc) {
      setPreviewSrc('');
      return;
    }
    setPreparing(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
    downscaleSource(imageSrc, PREVIEW_MAX)
      .then(({ url }) => {
        if (!cancelled) setPreviewSrc(url);
      })
      .catch(() => {
        if (!cancelled) setPreviewSrc(imageSrc);
      })
      .finally(() => {
        if (!cancelled) setPreparing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, imageSrc]);

  const onCropChangeComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedArea || !previewSrc) return;
    try {
      setSaving(true);
      const file = await getCroppedImg(previewSrc, croppedArea, originalFileName);
      onCropComplete(file);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl rounded-none">
        <DialogHeader>
          <DialogTitle>Προσαρμογή Φωτογραφίας</DialogTitle>
        </DialogHeader>

        <div className="relative w-full h-[400px] bg-black">
          {preparing || !previewSrc ? (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
              Προετοιμασία...
            </div>
          ) : (
            <Cropper
              image={previewSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropChangeComplete}
              objectFit="contain"
              showGrid
              zoomSpeed={0.5}
            />
          )}
        </div>

        <div className="space-y-2 pt-2">
          <Label className="text-sm">Ζουμ</Label>
          <Slider
            value={[zoom]}
            min={1}
            max={4}
            step={0.05}
            onValueChange={(v) => setZoom(v[0])}
          />
          <p className="text-xs text-muted-foreground">
            Σύρε για μετακίνηση, χρησιμοποίησε το ζουμ ή το scroll για μεγέθυνση.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-none" onClick={onClose}>
            Ακύρωση
          </Button>
          <Button
            type="button"
            className="rounded-none"
            onClick={handleSave}
            disabled={saving || preparing || !croppedArea}
          >
            {saving ? 'Αποθήκευση...' : 'Εφαρμογή'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
