import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Save, Upload, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLandingTheme, useInvalidateLanding, type LandingTheme, type CustomFont } from '@/hooks/useLandingConfig';
import { toast } from 'sonner';

// Curated set of free Google Fonts
const GOOGLE_FONTS = [
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
];

const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({
  label, value, onChange,
}) => (
  <div className="space-y-1">
    <Label className="text-sm">{label}</Label>
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
      />
    </div>
  </div>
);

const FontSelect: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  customFonts: CustomFont[];
}> = ({ label, value, onChange, customFonts }) => (
  <div className="space-y-1">
    <Label className="text-sm">{label}</Label>
    <select
      className="w-full h-10 border border-border bg-background px-3 rounded-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ fontFamily: value }}
    >
      {customFonts.length > 0 && (
        <optgroup label="Custom (uploaded)">
          {customFonts.map((f) => (
            <option key={`c-${f.name}`} value={f.name} style={{ fontFamily: f.name }}>{f.name}</option>
          ))}
        </optgroup>
      )}
      <optgroup label="Google Fonts">
        {GOOGLE_FONTS.map((f) => (
          <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
        ))}
      </optgroup>
    </select>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
    {children}
  </h3>
);

export const ThemeEditor: React.FC = () => {
  const { data: theme } = useLandingTheme();
  const invalidate = useInvalidateLanding();
  const [draft, setDraft] = useState<LandingTheme | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (theme) setDraft(theme);
  }, [theme]);

  if (!draft) return <div className="p-6 text-sm text-muted-foreground">Φόρτωση...</div>;

  const update = (patch: Partial<LandingTheme>) => setDraft({ ...draft, ...patch });

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('landing_page_config' as any)
        .update({
          primary_color: draft.primary_color,
          accent_color: draft.accent_color,
          bg_color: draft.bg_color,
          text_color: draft.text_color,
          heading_font: draft.heading_font,
          body_font: draft.body_font,
          link_color: draft.link_color,
          link_hover_color: draft.link_hover_color,
          button_bg_color: draft.button_bg_color,
          button_text_color: draft.button_text_color,
          button_hover_bg_color: draft.button_hover_bg_color,
          button_hover_text_color: draft.button_hover_text_color,
          nav_bg_color: draft.nav_bg_color,
          nav_text_color: draft.nav_text_color,
          nav_hover_color: draft.nav_hover_color,
          nav_icon_color: draft.nav_icon_color,
          custom_fonts: draft.custom_fonts,
        } as any)
        .eq('id', draft.id);
      if (error) throw error;
      toast.success('Το θέμα αποθηκεύτηκε');
      invalidate();
    } catch (e: any) {
      toast.error('Σφάλμα: ' + (e?.message ?? String(e)));
    } finally {
      setSaving(false);
    }
  };

  const handleFontFile = async (file: File) => {
    if (!file) return;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!['woff2', 'woff', 'ttf', 'otf'].includes(ext)) {
      toast.error('Δεκτά: .woff2, .woff, .ttf, .otf');
      return;
    }
    setUploading(true);
    try {
      const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || `Font ${Date.now()}`;
      const filename = `landing/fonts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('uploads').upload(filename, file, {
        cacheControl: '31536000',
        upsert: false,
        contentType: ext === 'woff2' ? 'font/woff2' : ext === 'woff' ? 'font/woff' : ext === 'otf' ? 'font/otf' : 'font/ttf',
      });
      if (error) throw error;
      const { data } = supabase.storage.from('uploads').getPublicUrl(filename);
      const fmt = ext === 'woff2' ? 'woff2' : ext === 'woff' ? 'woff' : ext === 'otf' ? 'opentype' : 'truetype';
      const newFont: CustomFont = { name: baseName, url: data.publicUrl, format: fmt };
      update({ custom_fonts: [...draft.custom_fonts, newFont] });
      // Inject font-face immediately for preview
      const style = document.createElement('style');
      style.setAttribute('data-custom-font', newFont.name);
      style.textContent = `@font-face { font-family: '${newFont.name}'; src: url('${newFont.url}') format('${fmt}'); font-display: swap; }`;
      document.head.appendChild(style);
      toast.success(`Ανέβηκε: ${baseName}`);
    } catch (e: any) {
      toast.error('Σφάλμα: ' + (e?.message ?? String(e)));
    } finally {
      setUploading(false);
    }
  };

  const removeCustomFont = (name: string) => {
    update({ custom_fonts: draft.custom_fonts.filter((f) => f.name !== name) });
  };

  return (
    <Card className="rounded-none p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Παγκόσμιο Θέμα</h2>
        <Button onClick={save} disabled={saving} className="rounded-none">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
        </Button>
      </div>

      {/* GENERAL COLORS */}
      <div className="space-y-3">
        <SectionTitle>Γενικά Χρώματα</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorField label="Primary" value={draft.primary_color} onChange={(v) => update({ primary_color: v })} />
          <ColorField label="Accent" value={draft.accent_color} onChange={(v) => update({ accent_color: v })} />
          <ColorField label="Background" value={draft.bg_color} onChange={(v) => update({ bg_color: v })} />
          <ColorField label="Text" value={draft.text_color} onChange={(v) => update({ text_color: v })} />
          <ColorField label="Link" value={draft.link_color} onChange={(v) => update({ link_color: v })} />
          <ColorField label="Link Hover" value={draft.link_hover_color} onChange={(v) => update({ link_hover_color: v })} />
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="space-y-3">
        <SectionTitle>Πλοήγηση (Navigation)</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorField label="Φόντο" value={draft.nav_bg_color} onChange={(v) => update({ nav_bg_color: v })} />
          <ColorField label="Χρώμα Κειμένου" value={draft.nav_text_color} onChange={(v) => update({ nav_text_color: v })} />
          <ColorField label="Hover" value={draft.nav_hover_color} onChange={(v) => update({ nav_hover_color: v })} />
          <ColorField label="Χρώμα Εικονιδίων" value={draft.nav_icon_color} onChange={(v) => update({ nav_icon_color: v })} />
        </div>
      </div>

      {/* BUTTONS */}
      <div className="space-y-3">
        <SectionTitle>Κουμπιά</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorField label="Φόντο" value={draft.button_bg_color} onChange={(v) => update({ button_bg_color: v })} />
          <ColorField label="Κείμενο" value={draft.button_text_color} onChange={(v) => update({ button_text_color: v })} />
          <ColorField label="Hover Φόντο" value={draft.button_hover_bg_color} onChange={(v) => update({ button_hover_bg_color: v })} />
          <ColorField label="Hover Κείμενο" value={draft.button_hover_text_color} onChange={(v) => update({ button_hover_text_color: v })} />
        </div>
        <div className="border border-border p-4 flex gap-3" style={{ background: draft.bg_color }}>
          <button
            type="button"
            className="px-4 py-2 transition-colors"
            style={{
              background: draft.button_bg_color,
              color: draft.button_text_color,
              fontFamily: draft.body_font,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = draft.button_hover_bg_color;
              (e.currentTarget as HTMLElement).style.color = draft.button_hover_text_color;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = draft.button_bg_color;
              (e.currentTarget as HTMLElement).style.color = draft.button_text_color;
            }}
          >
            Preview Button (hover)
          </button>
        </div>
      </div>

      {/* TYPOGRAPHY */}
      <div className="space-y-3">
        <SectionTitle>Γραμματοσειρές</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FontSelect
            label="Τίτλοι"
            value={draft.heading_font}
            onChange={(v) => update({ heading_font: v })}
            customFonts={draft.custom_fonts}
          />
          <FontSelect
            label="Κείμενο"
            value={draft.body_font}
            onChange={(v) => update({ body_font: v })}
            customFonts={draft.custom_fonts}
          />
        </div>
      </div>

      {/* CUSTOM FONTS */}
      <div className="space-y-3">
        <SectionTitle>Custom Γραμματοσειρές</SectionTitle>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-none"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-1" />
            {uploading ? 'Ανέβασμα...' : 'Ανέβασμα Γραμματοσειράς'}
          </Button>
          <span className="text-xs text-muted-foreground">.woff2, .woff, .ttf, .otf</span>
          <input
            ref={fileRef}
            type="file"
            accept=".woff,.woff2,.ttf,.otf,font/woff,font/woff2,font/ttf,font/otf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFontFile(f);
              e.target.value = '';
            }}
          />
        </div>
        {draft.custom_fonts.length > 0 ? (
          <div className="border border-border divide-y divide-border">
            {draft.custom_fonts.map((f) => (
              <div key={f.name + f.url} className="flex items-center justify-between px-3 py-2">
                <div>
                  <div className="font-medium" style={{ fontFamily: f.name }}>{f.name}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-md">{f.url}</div>
                </div>
                <Button variant="ghost" size="sm" className="rounded-none" onClick={() => removeCustomFont(f.name)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">Δεν έχεις ανεβάσει custom γραμματοσειρές.</div>
        )}
      </div>

      {/* PREVIEW */}
      <div className="space-y-3">
        <SectionTitle>Προεπισκόπηση</SectionTitle>
        <div className="border border-border p-6 space-y-3" style={{ backgroundColor: draft.bg_color, color: draft.text_color }}>
          <div style={{ fontFamily: draft.heading_font }} className="text-3xl font-bold">
            Heading sample
          </div>
          <div style={{ fontFamily: draft.body_font }}>
            Body text με κανονικό κείμενο.{' '}
            <a href="#" style={{ color: draft.link_color }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = draft.link_hover_color)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = draft.link_color)}
            >
              hover ένας σύνδεσμος
            </a>.
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 text-sm" style={{ background: draft.primary_color, color: '#000' }}>Primary</span>
            <span className="px-3 py-1 text-sm" style={{ background: draft.accent_color, color: '#fff' }}>Accent</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
