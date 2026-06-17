import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SECTION_LABELS, type LandingSection, type Lang } from '@/hooks/useLandingConfig';
import { LandingImageUploader } from './LandingImageUploader';
import { GradientPicker, type BackgroundValue } from './GradientPicker';

interface Props {
  section: LandingSection;
  lang: Lang;
  onSaved: () => void;
}

export const SectionEditPanel: React.FC<Props> = ({ section, lang, onSaved }) => {
  const [draft, setDraft] = useState<LandingSection>(section);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(section); }, [section.id]);

  const setExtra = (patch: Record<string, any>) =>
    setDraft({ ...draft, extra_data: { ...(draft.extra_data ?? {}), ...patch } });

  const background: BackgroundValue | undefined = draft.extra_data?.background;

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('landing_sections' as any).update({
        is_visible: draft.is_visible,
        title: draft.title,
        subtitle: draft.subtitle,
        description: draft.description,
        cta_label: draft.cta_label,
        title_en: draft.title_en,
        subtitle_en: draft.subtitle_en,
        description_en: draft.description_en,
        cta_label_en: draft.cta_label_en,
        cta_url: draft.cta_url,
        image_url: draft.image_url,
        bg_color: draft.bg_color,
        text_color: draft.text_color,
        extra_data: draft.extra_data ?? {},
      }).eq('id', draft.id);
      if (error) throw error;
      toast.success(lang === 'en' ? 'Saved' : 'Αποθηκεύτηκε');
      onSaved();
    } catch (e: any) {
      toast.error('Error: ' + (e?.message ?? String(e)));
    } finally { setSaving(false); }
  };

  const sectionLabel = SECTION_LABELS[draft.section_key]?.[lang] ?? draft.section_key;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{sectionLabel}</h3>
          <p className="text-xs text-muted-foreground">{draft.section_key}</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={draft.is_visible}
            onCheckedChange={(v) => setDraft({ ...draft, is_visible: v })} />
          <span className="text-xs">{draft.is_visible ? (lang==='en'?'Visible':'Ορατό') : (lang==='en'?'Hidden':'Κρυφό')}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Tabs defaultValue={lang} value={lang} className="w-full">
          <TabsList className="rounded-none">
            <TabsTrigger value="el" className="rounded-none">Ελληνικά</TabsTrigger>
            <TabsTrigger value="en" className="rounded-none">English</TabsTrigger>
          </TabsList>

          <TabsContent value="el" className="space-y-3 mt-3">
            <Field label="Τίτλος" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
            <Field label="Υπότιτλος" value={draft.subtitle} onChange={(v) => setDraft({ ...draft, subtitle: v })} />
            <Field label="Περιγραφή" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} multiline />
            <Field label="CTA Label" value={draft.cta_label} onChange={(v) => setDraft({ ...draft, cta_label: v })} />
          </TabsContent>

          <TabsContent value="en" className="space-y-3 mt-3">
            <Field label="Title" value={draft.title_en} onChange={(v) => setDraft({ ...draft, title_en: v })} />
            <Field label="Subtitle" value={draft.subtitle_en} onChange={(v) => setDraft({ ...draft, subtitle_en: v })} />
            <Field label="Description" value={draft.description_en} onChange={(v) => setDraft({ ...draft, description_en: v })} multiline />
            <Field label="CTA Label" value={draft.cta_label_en} onChange={(v) => setDraft({ ...draft, cta_label_en: v })} />
          </TabsContent>
        </Tabs>

        <div>
          <Label className="text-sm">CTA URL</Label>
          <Input value={draft.cta_url ?? ''} onChange={(e) => setDraft({ ...draft, cta_url: e.target.value })}
            placeholder="/auth ή #footer" className="rounded-none" />
        </div>

        <LandingImageUploader
          value={draft.image_url}
          onChange={(url) => setDraft({ ...draft, image_url: url })}
          label={lang === 'en' ? 'Main image' : 'Κύρια εικόνα'}
          pathPrefix={`landing/${draft.section_key}`}
        />

        {(draft.section_key === 'navigation' || draft.section_key === 'footer') && (
          <LandingImageUploader
            value={draft.extra_data?.logo_url ?? null}
            onChange={(url) => setExtra({ logo_url: url })}
            label="Logo"
            pathPrefix={`landing/${draft.section_key}/logo`}
          />
        )}

        <div>
          <Label className="text-sm">{lang === 'en' ? 'Background' : 'Φόντο'}</Label>
          <GradientPicker value={background} onChange={(bg) => setExtra({ background: bg })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Bg color (fallback)</Label>
            <Input value={draft.bg_color ?? ''} onChange={(e) => setDraft({ ...draft, bg_color: e.target.value || null })}
              className="rounded-none font-mono" placeholder="#ffffff" />
          </div>
          <div>
            <Label className="text-xs">Text color</Label>
            <Input value={draft.text_color ?? ''} onChange={(e) => setDraft({ ...draft, text_color: e.target.value || null })}
              className="rounded-none font-mono" placeholder="#000000" />
          </div>
        </div>

        <details>
          <summary className="text-xs text-muted-foreground cursor-pointer">Extra data (JSON)</summary>
          <Textarea
            rows={6}
            value={JSON.stringify(draft.extra_data ?? {}, null, 2)}
            onChange={(e) => {
              try { setDraft({ ...draft, extra_data: JSON.parse(e.target.value || '{}') }); }
              catch { /* ignore */ }
            }}
            className="rounded-none font-mono text-xs mt-2"
          />
        </details>
      </div>

      <div className="p-3 border-t border-border">
        <Button onClick={save} disabled={saving} className="rounded-none w-full">
          <Save className="w-4 h-4 mr-2" />
          {saving ? (lang === 'en' ? 'Saving...' : 'Αποθήκευση...') : (lang === 'en' ? 'Save' : 'Αποθήκευση')}
        </Button>
      </div>
    </div>
  );
};

const Field: React.FC<{
  label: string; value: string | null; onChange: (v: string) => void; multiline?: boolean;
}> = ({ label, value, onChange, multiline }) => (
  <div>
    <Label className="text-sm">{label}</Label>
    {multiline
      ? <Textarea rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="rounded-none" />
      : <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="rounded-none" />}
  </div>
);
