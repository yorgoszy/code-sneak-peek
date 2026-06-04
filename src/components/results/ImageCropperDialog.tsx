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

const OUTPUT_MAX = 1920;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function getCroppedImg(imageSrc: string, crop: Area, fileName: string): Promise<File> {
  const image = await loadImage(imageSrc);

  let outW = Math.round(crop.width);
  let outH = Math.round(crop.height);
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
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, outW, outH);

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Canvas empty'));
      const name = fileName.replace(/\.[^.]+$/, '') + '-cropped.jpg';
      resolve(new File([blob], name, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.95);
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

  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedArea(null);
    }
  }, [isOpen, imageSrc]);

  const onCropChangeComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedArea || !imageSrc) return;
    try {
      setSaving(true);
      const file = await getCroppedImg(imageSrc, croppedArea, originalFileName);
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
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropChangeComplete}
              showGrid
              restrictPosition
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
            disabled={saving || !croppedArea}
          >
            {saving ? 'Αποθήκευση...' : 'Εφαρμογή'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
