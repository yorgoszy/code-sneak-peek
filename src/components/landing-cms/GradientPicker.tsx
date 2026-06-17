import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export interface BackgroundValue {
  type: 'none' | 'solid' | 'gradient';
  color?: string;
  from?: string;
  to?: string;
  angle?: number;
}

interface Props {
  value: BackgroundValue | undefined;
  onChange: (v: BackgroundValue) => void;
}

export const GradientPicker: React.FC<Props> = ({ value, onChange }) => {
  const v: BackgroundValue = value ?? { type: 'none' };
  const setType = (type: BackgroundValue['type']) => {
    if (type === 'solid') onChange({ type, color: v.color ?? '#000000' });
    else if (type === 'gradient')
      onChange({ type, from: v.from ?? '#00ffba', to: v.to ?? '#cb8954', angle: v.angle ?? 135 });
    else onChange({ type: 'none' });
  };

  const preview =
    v.type === 'solid' ? v.color :
    v.type === 'gradient' ? `linear-gradient(${v.angle ?? 135}deg, ${v.from}, ${v.to})` :
    'transparent';

  return (
    <div className="space-y-2 border border-border p-3">
      <div className="flex items-center gap-2">
        {(['none','solid','gradient'] as const).map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            variant={v.type === t ? 'default' : 'outline'}
            className="rounded-none"
            onClick={() => setType(t)}
          >
            {t === 'none' ? 'Κανένα' : t === 'solid' ? 'Χρώμα' : 'Gradient'}
          </Button>
        ))}
        <div className="flex-1" />
        <div className="w-16 h-8 border border-border" style={{ background: preview }} />
      </div>

      {v.type === 'solid' && (
        <div className="flex items-center gap-2">
          <input type="color" value={v.color ?? '#000000'}
            onChange={(e) => onChange({ ...v, color: e.target.value })}
            className="w-12 h-9 border border-border" />
          <Input value={v.color ?? ''} onChange={(e) => onChange({ ...v, color: e.target.value })}
            className="rounded-none font-mono" />
        </div>
      )}

      {v.type === 'gradient' && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">From</Label>
            <input type="color" value={v.from ?? '#000000'}
              onChange={(e) => onChange({ ...v, from: e.target.value })}
              className="w-full h-9 border border-border" />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <input type="color" value={v.to ?? '#000000'}
              onChange={(e) => onChange({ ...v, to: e.target.value })}
              className="w-full h-9 border border-border" />
          </div>
          <div>
            <Label className="text-xs">Angle</Label>
            <Input type="number" value={v.angle ?? 135}
              onChange={(e) => onChange({ ...v, angle: Number(e.target.value) })}
              className="rounded-none" />
          </div>
        </div>
      )}
    </div>
  );
};
