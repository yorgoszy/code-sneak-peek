import React from 'react';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface CameraZoomControlProps {
  zoom: number;
  onZoomChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const CameraZoomControl: React.FC<CameraZoomControlProps> = ({
  zoom,
  onZoomChange,
  min = 1,
  max = 3,
  step = 0.1
}) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-black/50 rounded-none">
      <ZoomOut className="w-4 h-4 text-white" />
      <Slider
        value={[zoom]}
        onValueChange={(values) => onZoomChange(values[0])}
        min={min}
        max={max}
        step={step}
        className="w-24 sm:w-32"
      />
      <ZoomIn className="w-4 h-4 text-white" />
      <span className="text-xs text-white min-w-[2rem]">{zoom.toFixed(1)}x</span>
    </div>
  );
};
