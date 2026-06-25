import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CustomFont } from '@/hooks/useLandingConfig';

// Fonts loaded statically by the project (index.html / src/index.css)
export const PROJECT_FONTS = [
  'Roobert Pro', 'Fugaz One', 'UnifrakturMaguntia', 'Bebas Neue',
];

export const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Roboto Condensed', 'Roboto Slab', 'Open Sans', 'Lato',
  'Montserrat', 'Poppins', 'Raleway', 'Oswald', 'Bebas Neue', 'Playfair Display',
  'Source Sans 3', 'Source Serif 4', 'Nunito', 'Nunito Sans', 'Work Sans',
  'DM Sans', 'DM Serif Display', 'Manrope', 'Space Grotesk', 'Space Mono',
  'Archivo', 'Archivo Black', 'Outfit', 'Figtree', 'Plus Jakarta Sans',
  'Sora', 'Syne', 'Urbanist', 'Epilogue', 'Lora', 'Merriweather', 'Karla',
  'IBM Plex Sans', 'IBM Plex Serif', 'IBM Plex Mono', 'JetBrains Mono',
  'Fira Sans', 'Fira Code', 'Cormorant Garamond', 'Libre Baskerville',
  'Libre Franklin', 'Crimson Pro', 'EB Garamond', 'Anton', 'Barlow',
  'Barlow Condensed', 'Hind', 'Cabin', 'Quicksand', 'Rubik', 'Mulish',
  'Josefin Sans', 'Comfortaa', 'Abril Fatface', 'Caveat', 'Pacifico',
  'Dancing Script', 'Permanent Marker', 'Instrument Serif', 'Instrument Sans',
  'Fugaz One',
];

export const ColorField: React.FC<{
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  onClear?: () => void;
}> = ({ label, value, onChange, onClear }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      {onClear && value ? (
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          reset
        </button>
      ) : null}
    </div>
    <div className="flex gap-2">
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-10 border border-border cursor-pointer"
      />
      <Input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-none font-mono"
        placeholder="#000000"
      />
    </div>
  </div>
);

export const FontSelect: React.FC<{
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  customFonts: CustomFont[];
  allowEmpty?: boolean;
  emptyLabel?: string;
}> = ({ label, value, onChange, customFonts, allowEmpty, emptyLabel = '— Default —' }) => (
  <div className="space-y-1">
    <Label className="text-sm">{label}</Label>
    <select
      className="w-full h-10 border border-border bg-background px-3 rounded-none"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={{ fontFamily: value || undefined }}
    >
      {allowEmpty && <option value="">{emptyLabel}</option>}
      {customFonts.length > 0 && (
        <optgroup label="Custom (uploaded)">
          {customFonts.map((f) => (
            <option key={`c-${f.name}`} value={f.name} style={{ fontFamily: f.name }}>{f.name}</option>
          ))}
        </optgroup>
      )}
      <optgroup label="Project">
        {PROJECT_FONTS.map((f) => (
          <option key={`p-${f}`} value={f} style={{ fontFamily: f }}>{f}</option>
        ))}
      </optgroup>
      <optgroup label="Google Fonts">
        {GOOGLE_FONTS.map((f) => (
          <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
        ))}
      </optgroup>
    </select>
  </div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
    {children}
  </h3>
);
