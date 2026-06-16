import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  useLandingSections, useInvalidateLanding, SECTION_LABELS,
  type LandingSection,
} from '@/hooks/useLandingConfig';
import { LandingImageUploader } from './LandingImageUploader';

const SectionEditor: React.FC<{
  section: LandingSection;
  onChanged: () => void;
  onMove: (dir: -1 | 1) => void;
}> = ({ section, onChanged, onMove }) => {
  const [draft, setDraft] = useState<LandingSection>(section);
  const [saving, setSaving] = useState(false);
  const [extraText, setExtraText] = useState(JSON.stringify(section.extra_data ?? {}, null, 2));

  useEffect(() => {
    setDraft(section);
    setExtraText(JSON.stringify(section.extra_data ?? {}, null, 2));
  }, [section.id]);

  const save = async () => {
    setSaving(true);
    try {
      let parsedExtra: any = {};
      try { parsedExtra = extraText.trim() ? JSON.parse(extraText) : {}; }
      catch { toast.error('Μη έγκυρο JSON στα extra δεδομένα'); setSaving(false); return; }

      const { error } = await supabase
        .from('landing_sections' as any)
        .update({
          is_visible: draft.is_visible,
          title: draft.title,
          subtitle: draft.subtitle,
          description: draft.description,
          cta_label: draft.cta_label,
          cta_url: draft.cta_url,
          image_url: draft.image_url,
          bg_color: draft.bg_color,
          text_color: draft.text_color,
          extra_data: parsedExtra,
        })
        .eq('id', draft.id);
      if (error) throw error;
      toast.success('Αποθηκεύτηκε');
      onChanged();
    } catch (e: any) {
      toast.error('Σφάλμα: ' + (e?.message ?? String(e)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border-t border-border">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Switch
            checked={draft.is_visible}
            onCheckedChange={(v) => setDraft({ ...draft, is_visible: v })}
          />
          <span className="text-sm">{draft.is_visible ? 'Ορατό' : 'Κρυφό'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="rounded-none" onClick={() => onMove(-1)}>
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" className="rounded-none" onClick={() => onMove(1)}>
            <ChevronDown className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground ml-2">order: {draft.display_order}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Τίτλος</Label>
          <Input value={draft.title ?? ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="rounded-none" />
        </div>
        <div>
          <Label className="text-sm">Υπότιτλος</Label>
          <Input value={draft.subtitle ?? ''} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} className="rounded-none" />
        </div>
      </div>

      <div>
        <Label className="text-sm">Περιγραφή</Label>
        <Textarea
          rows={3}
          value={draft.description ?? ''}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          className="rounded-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">CTA Label</Label>
          <Input value={draft.cta_label ?? ''} onChange={(e) => setDraft({ ...draft, cta_label: e.target.value })} className="rounded-none" />
        </div>
        <div>
          <Label className="text-sm">CTA URL</Label>
          <Input value={draft.cta_url ?? ''} onChange={(e) => setDraft({ ...draft, cta_url: e.target.value })} className="rounded-none" />
        </div>
      </div>

      <LandingImageUploader
        value={draft.image_url}
        onChange={(url) => setDraft({ ...draft, image_url: url })}
        label="Κύρια εικόνα"
        pathPrefix={`landing/${draft.section_key}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Bg color (optional)</Label>
          <Input value={draft.bg_color ?? ''} onChange={(e) => setDraft({ ...draft, bg_color: e.target.value || null })} className="rounded-none font-mono" placeholder="#ffffff" />
        </div>
        <div>
          <Label className="text-sm">Text color (optional)</Label>
          <Input value={draft.text_color ?? ''} onChange={(e) => setDraft({ ...draft, text_color: e.target.value || null })} className="rounded-none font-mono" placeholder="#000000" />
        </div>
      </div>

      <div>
        <Label className="text-sm">Extra Data (JSON)</Label>
        <Textarea
          rows={8}
          value={extraText}
          onChange={(e) => setExtraText(e.target.value)}
          className="rounded-none font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Section-specific πεδία (π.χ. menu_items, social, columns, bullets).
        </p>
      </div>

      <Button onClick={save} disabled={saving} className="rounded-none">
        <Save className="w-4 h-4 mr-2" />
        {saving ? 'Αποθήκευση...' : 'Αποθήκευση Section'}
      </Button>
    </div>
  );
};

export const SectionsEditor: React.FC = () => {
  const { data: sections } = useLandingSections();
  const invalidate = useInvalidateLanding();

  const move = async (s: LandingSection, dir: -1 | 1) => {
    if (!sections) return;
    const sorted = [...sections].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((x) => x.id === s.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await supabase.from('landing_sections' as any).update({ display_order: swap.display_order }).eq('id', s.id);
    await supabase.from('landing_sections' as any).update({ display_order: s.display_order }).eq('id', swap.id);
    invalidate();
  };

  if (!sections) return <div className="p-6 text-sm text-muted-foreground">Φόρτωση...</div>;

  return (
    <div className="space-y-2">
      <Accordion type="multiple" className="space-y-2">
        {sections.map((s) => (
          <AccordionItem
            key={s.id}
            value={s.id}
            className="border border-border bg-background"
          >
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-3 w-full">
                <span className="text-xs text-muted-foreground w-8 text-left">#{s.display_order}</span>
                <span className="font-medium">{SECTION_LABELS[s.section_key] ?? s.section_key}</span>
                <span className="text-xs text-muted-foreground">({s.section_key})</span>
                {!s.is_visible && <span className="text-xs px-2 py-0.5 bg-muted ml-auto mr-4">Κρυφό</span>}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <SectionEditor
                section={s}
                onChanged={invalidate}
                onMove={(dir) => move(s, dir)}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
