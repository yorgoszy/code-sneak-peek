import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Save, Undo2 } from 'lucide-react';
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
      extra: (draft.extra_data ?? {}) as Record<string, any>,
      image_url: draft.image_url ?? null,
    };
    document.querySelectorAll('iframe').forEach((f) => {
      try { (f as HTMLIFrameElement).contentWindow?.postMessage(payload, '*'); } catch { /* ignore */ }
    });
  }, [draft.section_key, draft.extra_data, draft.image_url]);

  // Replay current draft when an iframe signals ready (e.g. after reload)
  // Also handle interactive logo resize from inside the iframe
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'landing-editor-ready') {
        const payload = {
          type: 'landing-editor-draft',
          sectionKey: draft.section_key,
          style: (draft.extra_data?.style ?? {}) as Record<string, any>,
          extra: (draft.extra_data ?? {}) as Record<string, any>,
          image_url: draft.image_url ?? null,
        };
        (e.source as Window | null)?.postMessage(payload, '*');
        return;
      }
      if (e.data?.type === 'landing-editor-logo-resize' && draft.section_key === 'navigation') {
        const h = Number(e.data.height);
        if (!Number.isFinite(h)) return;
        setDraft((d) => ({ ...d, extra_data: { ...(d.extra_data ?? {}), logo_height: h } }));
        return;
      }
      if (e.data?.type === 'landing-editor-text' && e.data.sectionKey === draft.section_key) {
        const { field, lang: msgLang, value: v } = e.data as {
          field: 'title' | 'subtitle' | 'description' | 'cta_label' | 'tagline';
          lang: 'el' | 'en';
          value: string;
        };
        if (field === 'tagline') {
          const key = msgLang === 'en' ? 'tagline_en' : 'tagline';
          setDraft((d) => ({
            ...d,
            extra_data: {
              ...(d.extra_data ?? {}),
              [key]: v,
            },
          }));
          return;
        }
        const key =
          msgLang === 'en'
            ? (`${field}_en` as 'title_en' | 'subtitle_en' | 'description_en' | 'cta_label_en')
            : field;
        setDraft((d) => ({ ...d, [key]: v } as LandingSection));
      }
      if (e.data?.type === 'landing-editor-hero' && draft.section_key === 'hero') {
        const patch = (e.data.patch ?? {}) as Record<string, any>;
        const deepMerge = (a: any, b: any): any => {
          if (!b || typeof b !== 'object' || Array.isArray(b)) return b ?? a;
          const out: any = { ...(a ?? {}) };
          for (const k of Object.keys(b)) {
            const av = out[k]; const bv = b[k];
            if (av && bv && typeof av === 'object' && typeof bv === 'object' && !Array.isArray(av) && !Array.isArray(bv)) {
              out[k] = deepMerge(av, bv);
            } else {
              out[k] = bv;
            }
          }
          return out;
        };
        setDraft((d) => {
          const cur = ((d.extra_data?.hero_layout ?? {}) as Record<string, any>);
          const merged = deepMerge(cur, patch);
          return { ...d, extra_data: { ...(d.extra_data ?? {}), hero_layout: merged } };
        });
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [draft.section_key, draft.extra_data, draft.image_url]);


  const setExtra = (patch: Record<string, any>) =>
    setDraft({ ...draft, extra_data: { ...(draft.extra_data ?? {}), ...patch } });

  // ===== Undo history (per section) =====
  const historyRef = React.useRef<LandingSection[]>([]);
  const lastSnapshotRef = React.useRef<LandingSection>(section);
  const skipHistoryRef = React.useRef(true);
  const [historyVersion, setHistoryVersion] = React.useState(0);
  React.useEffect(() => {
    historyRef.current = [];
    lastSnapshotRef.current = section;
    skipHistoryRef.current = true;
    setHistoryVersion((v) => v + 1);
  }, [section.id]);
  React.useEffect(() => {
    if (skipHistoryRef.current) { skipHistoryRef.current = false; return; }
    const t = setTimeout(() => {
      historyRef.current.push(lastSnapshotRef.current);
      if (historyRef.current.length > 100) historyRef.current.shift();
      lastSnapshotRef.current = draft;
      setHistoryVersion((v) => v + 1);
    }, 400);
    return () => clearTimeout(t);
  }, [draft]);
  const canUndo = historyVersion >= 0 && historyRef.current.length > 0;
  const undo = () => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    skipHistoryRef.current = true;
    lastSnapshotRef.current = prev;
    setDraft(prev);
    setHistoryVersion((v) => v + 1);
  };

  const background: BackgroundValue | undefined = draft.extra_data?.background;

  const save = async (silent = false) => {
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
      if (!silent) toast.success(lang === 'en' ? 'Saved' : 'Αποθηκεύτηκε');
      onSaved();
    } catch (e: any) {
      if (!silent) toast.error('Error: ' + (e?.message ?? String(e)));
    } finally { setSaving(false); }
  };

  // Auto-save (live) — debounced. Skip first render after section change.
  const skipAutoSave = React.useRef(true);
  useEffect(() => { skipAutoSave.current = true; }, [section.id]);
  useEffect(() => {
    if (skipAutoSave.current) { skipAutoSave.current = false; return; }
    const t = setTimeout(() => { save(true); }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    draft.is_visible, draft.title, draft.subtitle, draft.description, draft.cta_label,
    draft.title_en, draft.subtitle_en, draft.description_en, draft.cta_label_en,
    draft.cta_url, draft.image_url, draft.bg_color, draft.text_color, draft.extra_data,
  ]);

  const sectionLabel = SECTION_LABELS[draft.section_key]?.[lang] ?? draft.section_key;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{sectionLabel}</h3>
          <p className="text-xs text-muted-foreground truncate">{draft.section_key}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-none h-8 px-2"
            onClick={undo}
            disabled={!canUndo}
            title={lang === 'en' ? 'Undo' : 'Αναίρεση'}
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          {draft.section_key !== 'navigation' && (
            <>
              <Switch checked={draft.is_visible}
                onCheckedChange={(v) => setDraft({ ...draft, is_visible: v })} />
              <span className="text-xs">{draft.is_visible ? (lang==='en'?'Visible':'Ορατό') : (lang==='en'?'Hidden':'Κρυφό')}</span>
            </>
          )}
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

        {draft.section_key === 'navigation' && (
          <div>
            <Label className="text-sm">
              {lang === 'en' ? 'Logo size (px)' : 'Μέγεθος Logo (px)'} — {Number(draft.extra_data?.logo_height) || 40}px
            </Label>
            <input
              type="range"
              min={16}
              max={160}
              step={1}
              value={Number(draft.extra_data?.logo_height) || 40}
              onChange={(e) => setExtra({ logo_height: Number(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'en'
                ? 'Tip: drag the green handle on the logo edge in the preview to resize.'
                : 'Συμβουλή: σύρε τη πράσινη λαβή στην άκρη του logo στην προεπισκόπηση.'}
            </p>
          </div>
        )}

        {draft.section_key === 'hero' && (() => {
          const hl = (draft.extra_data?.hero_layout ?? {}) as any;
          const setHL = (patch: any) => {
            const cur = hl;
            const merged = { ...cur };
            for (const k of Object.keys(patch)) {
              if (k === 'buttons') {
                merged.buttons = { ...(cur.buttons ?? {}) };
                for (const id of Object.keys(patch.buttons)) {
                  merged.buttons[id] = { ...(cur.buttons?.[id] ?? {}), ...patch.buttons[id] };
                }
              } else {
                merged[k] = { ...(cur[k] ?? {}), ...patch[k] };
              }
            }
            setExtra({ hero_layout: merged });
          };
          return (
            <div className="space-y-3 pt-2">
              <SectionTitle>{lang === 'en' ? 'Hero Layout' : 'Διάταξη Hero'}</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FontSelect
                  label={lang === 'en' ? 'Title Font' : 'Γραμματοσειρά Τίτλου'}
                  value={hl.title?.font ?? ''}
                  onChange={(v) => setHL({ title: { font: v } })}
                  customFonts={customFonts}
                  allowEmpty
                />
                <div>
                  <Label className="text-xs">
                    {lang === 'en' ? 'Title size' : 'Μέγεθος Τίτλου'} — {hl.title?.size ?? 'auto'}
                  </Label>
                  <input type="range" min={24} max={200} step={1}
                    value={hl.title?.size ?? 80}
                    onChange={(e) => setHL({ title: { size: Number(e.target.value) } })}
                    className="w-full" />
                </div>
                <FontSelect
                  label={lang === 'en' ? 'Subtitle Font' : 'Γραμματοσειρά Υπότιτλου'}
                  value={hl.subtitle?.font ?? ''}
                  onChange={(v) => setHL({ subtitle: { font: v } })}
                  customFonts={customFonts}
                  allowEmpty
                />
                <div>
                  <Label className="text-xs">
                    {lang === 'en' ? 'Subtitle size' : 'Μέγεθος Υπότιτλου'} — {hl.subtitle?.size ?? 'auto'}
                  </Label>
                  <input type="range" min={20} max={180} step={1}
                    value={hl.subtitle?.size ?? 64}
                    onChange={(e) => setHL({ subtitle: { size: Number(e.target.value) } })}
                    className="w-full" />
                </div>
              </div>

              {(['primary', 'secondary'] as const).map((id) => {
                const b = hl.buttons?.[id] ?? {};
                const label = id === 'primary'
                  ? (lang === 'en' ? 'Primary button' : 'Κύριο κουμπί')
                  : (lang === 'en' ? 'Secondary button' : 'Δευτερεύον κουμπί');
                return (
                  <div key={id} className="border border-border p-2 space-y-2">
                    <div className="text-xs font-semibold">{label}</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px]">X</Label>
                        <Input type="number" value={b.x ?? 0}
                          onChange={(e) => setHL({ buttons: { [id]: { x: Number(e.target.value) } } })}
                          className="rounded-none h-8" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Y</Label>
                        <Input type="number" value={b.y ?? 0}
                          onChange={(e) => setHL({ buttons: { [id]: { y: Number(e.target.value) } } })}
                          className="rounded-none h-8" />
                      </div>
                      <div>
                        <Label className="text-[10px]">{lang === 'en' ? 'Scale' : 'Μέγεθος'}</Label>
                        <Input type="number" step="0.05" value={b.scale ?? 1}
                          onChange={(e) => setHL({ buttons: { [id]: { scale: Number(e.target.value) } } })}
                          className="rounded-none h-8" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHL({ buttons: { [id]: { x: 0, y: 0, scale: 1 } } })}
                      className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    >reset</button>
                  </div>
                );
              })}

              <p className="text-xs text-muted-foreground">
                {lang === 'en'
                  ? 'Tip: click title/subtitle/buttons in the preview to resize & drag.'
                  : 'Συμβουλή: κάνε κλικ σε τίτλο/υπότιτλο/κουμπιά στην προεπισκόπηση για drag & resize.'}
              </p>
            </div>
          );
        })()}



        {/* Content bounds (left/right padding inside the section) */}
        {(() => {
          const cb = (draft.extra_data?.content_bounds ?? {}) as { left?: number; right?: number };
          const setCB = (patch: { left?: number | null; right?: number | null }) => {
            const next: any = { ...cb };
            for (const k of Object.keys(patch) as Array<'left'|'right'>) {
              const v = (patch as any)[k];
              if (v == null || v === '') delete next[k]; else next[k] = Number(v);
            }
            setExtra({ content_bounds: next });
          };
          return (
            <div className="space-y-2 pt-2">
              <SectionTitle>{lang === 'en' ? 'Content bounds (px)' : 'Όρια Περιεχομένου (px)'}</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{lang === 'en' ? 'Start (left)' : 'Αρχή (αριστερά)'}</Label>
                  <Input type="number" value={cb.left ?? ''} placeholder="—"
                    onChange={(e) => setCB({ left: e.target.value === '' ? null : Number(e.target.value) })}
                    className="rounded-none" />
                </div>
                <div>
                  <Label className="text-xs">{lang === 'en' ? 'End (right)' : 'Τέλος (δεξιά)'}</Label>
                  <Input type="number" value={cb.right ?? ''} placeholder="—"
                    onChange={(e) => setCB({ right: e.target.value === '' ? null : Number(e.target.value) })}
                    className="rounded-none" />
                </div>
              </div>
            </div>
          );
        })()}

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

        {/* NAVIGATION ICONS */}
        {draft.section_key === 'navigation' && (
          <div className="space-y-3 pt-2">
            <SectionTitle>{lang === 'en' ? 'Navigation Icons' : 'Εικονίδια Πλοήγησης'}</SectionTitle>
            <LucideIconPicker
              value={(draft.extra_data?.lang_icon as string) ?? null}
              onChange={(name) => setExtra({ lang_icon: name })}
              label={lang === 'en' ? 'Language (EL/EN)' : 'Γλώσσα (EL/EN)'}
              color={style.icon_color || undefined}
            />
            <LucideIconPicker
              value={(draft.extra_data?.dashboard_icon as string) ?? null}
              onChange={(name) => setExtra({ dashboard_icon: name })}
              label="Dashboard"
              color={style.icon_color || undefined}
            />
            <LucideIconPicker
              value={(draft.extra_data?.logout_icon as string) ?? null}
              onChange={(name) => setExtra({ logout_icon: name })}
              label={lang === 'en' ? 'Logout' : 'Αποσύνδεση'}
              color={style.icon_color || undefined}
            />
            <LucideIconPicker
              value={(draft.extra_data?.login_icon as string) ?? null}
              onChange={(name) => setExtra({ login_icon: name })}
              label={lang === 'en' ? 'Login (button)' : 'Σύνδεση (κουμπί)'}
              color={style.button_text_color || undefined}
            />
          </div>
        )}

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
        <Button onClick={() => save(false)} disabled={saving} className="rounded-none w-full">
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
