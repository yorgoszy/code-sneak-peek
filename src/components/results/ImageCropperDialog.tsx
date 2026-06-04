import React, { useState, useCallback } from 'react';
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

async function getCroppedImg(imageSrc: string, crop: Area, fileName: string): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Canvas empty'));
      const name = fileName.replace(/\.[^.]+$/, '') + '-cropped.jpg';
      resolve(new File([blob], name, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
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

  const onCropChangeComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedArea) return;
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
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropChangeComplete}
            showGrid
          />
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
          <Button type="button" className="rounded-none" onClick={handleSave} disabled={saving}>
            {saving ? 'Αποθήκευση...' : 'Εφαρμογή'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
