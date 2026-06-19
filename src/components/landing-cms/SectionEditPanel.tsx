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
import { SECTION_LABELS, useLandingTheme, type LandingSection, type Lang } from '@/hooks/useLandingConfig';
import { LandingImageUploader } from './LandingImageUploader';
import { GradientPicker, type BackgroundValue } from './GradientPicker';
import { ColorField, FontSelect, SectionTitle } from './shared';
import { LucideIconPicker } from './LucideIconPicker';


interface Props {
  section: LandingSection;
  lang: Lang;
  onSaved: () => void;
}

export const SectionEditPanel: React.FC<Props> = ({ section, lang, onSaved }) => {
  const [draft, setDraft] = useState<LandingSection>(section);
  const [saving, setSaving] = useState(false);
  const { data: theme } = useLandingTheme();
  const customFonts = theme?.custom_fonts ?? [];
  const style: Record<string, any> = (draft.extra_data?.style ?? {}) as Record<string, any>;
  const setStyle = (patch: Record<string, any>) => {
    const next = { ...style, ...patch };
    // Strip empty strings/null
    Object.keys(next).forEach((k) => { if (next[k] === '' || next[k] == null) delete next[k]; });
    setDraft({ ...draft, extra_data: { ...(draft.extra_data ?? {}), style: next } });
  };


  useEffect(() => { setDraft(section); }, [section.id]);

  // Live-preview: broadcast the draft style to the preview iframe(s) on every change
  useEffect(() => {
    const payload = {
      type: 'landing-editor-draft',
      sectionKey: draft.section_key,
      style: (draft.extra_data?.style ?? {}) as Record<string, any>,
    };
    document.querySelectorAll('iframe').forEach((f) => {
      try { (f as HTMLIFrameElement).contentWindow?.postMessage(payload, '*'); } catch { /* ignore */ }
    });
  }, [draft.section_key, draft.extra_data]);

  // Replay current draft when an iframe signals ready (e.g. after reload)
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type !== 'landing-editor-ready') return;
      const payload = {
        type: 'landing-editor-draft',
        sectionKey: draft.section_key,
        style: (draft.extra_data?.style ?? {}) as Record<string, any>,
      };
      (e.source as Window | null)?.postMessage(payload, '*');
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [draft.section_key, draft.extra_data]);

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

        {/* PER-SECTION STYLE OVERRIDES */}
        <div className="space-y-3 pt-2">
          <SectionTitle>{lang === 'en' ? 'Section Style (overrides theme)' : 'Στυλ Section (πάνω από το θέμα)'}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FontSelect
              label={lang === 'en' ? 'Heading Font' : 'Γραμματοσειρά Τίτλων'}
              value={style.heading_font ?? ''}
              onChange={(v) => setStyle({ heading_font: v })}
              customFonts={customFonts}
              allowEmpty
            />
            <FontSelect
              label={lang === 'en' ? 'Body Font' : 'Γραμματοσειρά Κειμένου'}
              value={style.body_font ?? ''}
              onChange={(v) => setStyle({ body_font: v })}
              customFonts={customFonts}
              allowEmpty
            />
            <ColorField
              label={lang === 'en' ? 'Background' : 'Φόντο'}
              value={style.bg_color}
              onChange={(v) => setStyle({ bg_color: v })}
              onClear={() => setStyle({ bg_color: '' })}
            />
            <ColorField
              label={lang === 'en' ? 'Text' : 'Κείμενο'}
              value={style.text_color}
              onChange={(v) => setStyle({ text_color: v })}
              onClear={() => setStyle({ text_color: '' })}
            />
            <ColorField
              label={lang === 'en' ? 'Link' : 'Σύνδεσμος'}
              value={style.link_color}
              onChange={(v) => setStyle({ link_color: v })}
              onClear={() => setStyle({ link_color: '' })}
            />
            <ColorField
              label={lang === 'en' ? 'Link Hover' : 'Hover Συνδέσμου'}
              value={style.link_hover_color}
              onChange={(v) => setStyle({ link_hover_color: v })}
              onClear={() => setStyle({ link_hover_color: '' })}
            />
            <ColorField
              label={lang === 'en' ? 'Button Bg' : 'Φόντο Κουμπιού'}
              value={style.button_bg_color}
              onChange={(v) => setStyle({ button_bg_color: v })}
              onClear={() => setStyle({ button_bg_color: '' })}
            />
            <ColorField
              label={lang === 'en' ? 'Button Text' : 'Κείμενο Κουμπιού'}
              value={style.button_text_color}
              onChange={(v) => setStyle({ button_text_color: v })}
              onClear={() => setStyle({ button_text_color: '' })}
            />
            <ColorField
              label={lang === 'en' ? 'Button Hover Bg' : 'Hover Φόντο Κουμπιού'}
              value={style.button_hover_bg_color}
              onChange={(v) => setStyle({ button_hover_bg_color: v })}
              onClear={() => setStyle({ button_hover_bg_color: '' })}
            />
            <ColorField
              label={lang === 'en' ? 'Button Hover Text' : 'Hover Κείμενο Κουμπιού'}
              value={style.button_hover_text_color}
              onChange={(v) => setStyle({ button_hover_text_color: v })}
              onClear={() => setStyle({ button_hover_text_color: '' })}
            />
            {draft.section_key === 'navigation' && (
              <ColorField
                label={lang === 'en' ? 'Icons Color' : 'Χρώμα Εικονιδίων'}
                value={style.icon_color}
                onChange={(v) => setStyle({ icon_color: v })}
                onClear={() => setStyle({ icon_color: '' })}
              />
            )}
          </div>
        </div>

        {/* SECTION ICON */}
        <div className="space-y-3 pt-2">
          <SectionTitle>{lang === 'en' ? 'Section Icon' : 'Εικονίδιο Section'}</SectionTitle>
          <LucideIconPicker
            value={(draft.extra_data?.icon as string) ?? null}
            onChange={(name) => setExtra({ icon: name })}
            label={lang === 'en' ? 'Pick a Lucide icon' : 'Διάλεξε Lucide εικονίδιο'}
            color={style.icon_color || draft.text_color || undefined}
          />
          <ColorField
            label={lang === 'en' ? 'Icon Color' : 'Χρώμα Εικονιδίου'}
            value={style.section_icon_color}
            onChange={(v) => setStyle({ section_icon_color: v })}
            onClear={() => setStyle({ section_icon_color: '' })}
          />
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
