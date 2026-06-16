import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLandingTheme, useInvalidateLanding, type LandingTheme } from '@/hooks/useLandingConfig';
import { toast } from 'sonner';

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Raleway', 'Oswald', 'Bebas Neue', 'Playfair Display',
  'Source Sans Pro', 'Nunito', 'Work Sans', 'DM Sans', 'Manrope',
  'Space Grotesk', 'Archivo', 'Outfit',
];

const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({
  label, value, onChange,
}) => (
  <div className="space-y-1">
    <Label className="text-sm">{label}</Label>
    <div className="flex gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-10 border border-border cursor-pointer"
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-none font-mono"
      />
    </div>
  </div>
);

export const ThemeEditor: React.FC = () => {
  const { data: theme } = useLandingTheme();
  const invalidate = useInvalidateLanding();
  const [draft, setDraft] = useState<LandingTheme | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (theme) setDraft(theme);
  }, [theme]);

  if (!draft) return <div className="p-6 text-sm text-muted-foreground">Φόρτωση...</div>;

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
        })
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

  return (
    <Card className="rounded-none p-6 space-y-6">
      <h2 className="text-xl font-semibold">Παγκόσμιο Θέμα</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ColorField label="Primary"
          value={draft.primary_color}
          onChange={(v) => setDraft({ ...draft, primary_color: v })} />
        <ColorField label="Accent"
          value={draft.accent_color}
          onChange={(v) => setDraft({ ...draft, accent_color: v })} />
        <ColorField label="Background"
          value={draft.bg_color}
          onChange={(v) => setDraft({ ...draft, bg_color: v })} />
        <ColorField label="Text"
          value={draft.text_color}
          onChange={(v) => setDraft({ ...draft, text_color: v })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm">Γραμματοσειρά Τίτλων</Label>
          <select
            className="w-full h-10 border border-border bg-background px-3 rounded-none"
            value={draft.heading_font}
            onChange={(e) => setDraft({ ...draft, heading_font: e.target.value })}
            style={{ fontFamily: draft.heading_font }}
          >
            {GOOGLE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Γραμματοσειρά Κειμένου</Label>
          <select
            className="w-full h-10 border border-border bg-background px-3 rounded-none"
            value={draft.body_font}
            onChange={(e) => setDraft({ ...draft, body_font: e.target.value })}
            style={{ fontFamily: draft.body_font }}
          >
            {GOOGLE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div className="border border-border p-4 space-y-2" style={{
        backgroundColor: draft.bg_color,
        color: draft.text_color,
      }}>
        <div className="text-xs uppercase opacity-60">Προεπισκόπηση</div>
        <div style={{ fontFamily: draft.heading_font }} className="text-3xl font-bold">
          Heading sample
        </div>
        <div style={{ fontFamily: draft.body_font }}>
          Body text sample με κείμενο.
        </div>
        <div className="flex gap-2 mt-2">
          <span className="px-3 py-1 text-sm" style={{ background: draft.primary_color, color: '#000' }}>Primary</span>
          <span className="px-3 py-1 text-sm" style={{ background: draft.accent_color, color: '#fff' }}>Accent</span>
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="rounded-none">
        <Save className="w-4 h-4 mr-2" />
        {saving ? 'Αποθήκευση...' : 'Αποθήκευση Θέματος'}
      </Button>
    </Card>
  );
};
