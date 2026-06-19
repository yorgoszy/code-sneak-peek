import React from 'react';
import { type PageNode, type Locale, type NodeStyle } from '@/hooks/useLandingTree';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CMS_SECTION_OPTIONS } from './CmsSectionRenderer';

interface Props {
  node: PageNode | null;
  locale: Locale;
  onChange: (updater: (n: PageNode) => PageNode) => void;
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1">
    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const StyleInput: React.FC<{
  label: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <Field label={label}>
    <Input
      className="rounded-none h-8 text-xs"
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  </Field>
);

export const InspectorPanel: React.FC<Props> = ({ node, locale, onChange }) => {
  if (!node) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
          Inspector
        </div>
        <div className="p-4 text-xs text-muted-foreground">
          Επίλεξε ένα στοιχείο στο canvas ή στα Layers.
        </div>
      </div>
    );
  }

  const setProp = (key: string, value: any) => {
    onChange((n) => ({ ...n, props: { ...n.props, [key]: value } }));
  };

  const setLocalizedProp = (key: string, value: string) => {
    onChange((n) => {
      const cur = (n.props as any)[key];
      const next = typeof cur === 'object' && cur !== null
        ? { ...cur, [locale]: value }
        : { el: locale === 'el' ? value : (cur ?? ''), en: locale === 'en' ? value : (cur ?? '') };
      return { ...n, props: { ...n.props, [key]: next } };
    });
  };

  const setStyle = (key: keyof NodeStyle, value: any) => {
    onChange((n) => ({
      ...n,
      style: { ...n.style, [key]: value === '' ? undefined : value },
    }));
  };

  const txt = (node.props as any)?.text;
  const textValue =
    typeof txt === 'string' ? txt : txt?.[locale] ?? '';

  const hasText = ['heading', 'text', 'button'].includes(node.type);
  const hasMedia = ['image', 'video'].includes(node.type);
  const hasLink = node.type === 'button';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-border text-xs uppercase tracking-wide text-muted-foreground flex items-center justify-between">
        <span>Inspector</span>
        <code className="text-[9px] normal-case text-muted-foreground/70">{node.type}</code>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {/* CONTENT */}
        {(hasText || hasMedia || hasLink) && (
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-wide font-semibold">Content ({locale.toUpperCase()})</div>
            {hasText && (
              <Field label="Text">
                <Textarea
                  className="rounded-none text-xs min-h-[60px]"
                  value={textValue}
                  onChange={(e) => setLocalizedProp('text', e.target.value)}
                />
              </Field>
            )}
            {node.type === 'heading' && (
              <Field label="Level">
                <select
                  className="w-full h-8 border border-input bg-background text-xs rounded-none px-2"
                  value={node.props.level ?? 1}
                  onChange={(e) => setProp('level', Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6].map((l) => (
                    <option key={l} value={l}>H{l}</option>
                  ))}
                </select>
              </Field>
            )}
            {hasLink && (
              <>
                <StyleInput label="Href" value={node.props.href} onChange={(v) => setProp('href', v)} placeholder="/auth" />
                <Field label="Target">
                  <select
                    className="w-full h-8 border border-input bg-background text-xs rounded-none px-2"
                    value={node.props.target ?? '_self'}
                    onChange={(e) => setProp('target', e.target.value)}
                  >
                    <option value="_self">Same tab</option>
                    <option value="_blank">New tab</option>
                  </select>
                </Field>
              </>
            )}
            {hasMedia && (
              <>
                <StyleInput label="Src" value={node.props.src} onChange={(v) => setProp('src', v)} placeholder="https://…" />
                {node.type === 'image' && (
                  <StyleInput
                    label="Alt"
                    value={typeof node.props.alt === 'string' ? node.props.alt : (node.props.alt as any)?.[locale] ?? ''}
                    onChange={(v) => setLocalizedProp('alt', v)}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* STYLE */}
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="text-[10px] uppercase tracking-wide font-semibold">Style</div>
          <div className="grid grid-cols-2 gap-2">
            <StyleInput label="BG" value={node.style.background as any} onChange={(v) => setStyle('background', v)} placeholder="#fff or hsl(...)" />
            <StyleInput label="Color" value={node.style.color} onChange={(v) => setStyle('color', v)} placeholder="#000" />
            <StyleInput label="Padding" value={node.style.padding} onChange={(v) => setStyle('padding', v)} placeholder="2rem 1rem" />
            <StyleInput label="Margin" value={node.style.margin} onChange={(v) => setStyle('margin', v)} />
            <StyleInput label="Font size" value={node.style.fontSize} onChange={(v) => setStyle('fontSize', v)} placeholder="1rem" />
            <StyleInput label="Font weight" value={node.style.fontWeight as any} onChange={(v) => setStyle('fontWeight', v)} placeholder="700" />
            <StyleInput label="Width" value={node.style.width} onChange={(v) => setStyle('width', v)} />
            <StyleInput label="Height" value={node.style.height} onChange={(v) => setStyle('height', v)} />
            <StyleInput label="Border" value={node.style.border} onChange={(v) => setStyle('border', v)} />
            <StyleInput label="Radius" value={node.style.borderRadius} onChange={(v) => setStyle('borderRadius', v)} />
          </div>

          <Field label="Text align">
            <div className="flex border border-border">
              {(['left', 'center', 'right'] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setStyle('textAlign', a)}
                  className={`flex-1 px-2 py-1 text-xs ${node.style.textAlign === a ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Display">
            <select
              className="w-full h-8 border border-input bg-background text-xs rounded-none px-2"
              value={node.style.display ?? ''}
              onChange={(e) => setStyle('display', e.target.value || undefined)}
            >
              <option value="">default</option>
              <option value="block">block</option>
              <option value="flex">flex</option>
              <option value="grid">grid</option>
              <option value="inline-block">inline-block</option>
              <option value="none">none</option>
            </select>
          </Field>

          {node.style.display === 'flex' && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Direction">
                <select
                  className="w-full h-8 border border-input bg-background text-xs rounded-none px-2"
                  value={node.style.flexDirection ?? 'row'}
                  onChange={(e) => setStyle('flexDirection', e.target.value)}
                >
                  <option value="row">row</option>
                  <option value="column">column</option>
                </select>
              </Field>
              <StyleInput label="Gap" value={node.style.gap} onChange={(v) => setStyle('gap', v)} />
              <StyleInput label="Justify" value={node.style.justifyContent} onChange={(v) => setStyle('justifyContent', v)} placeholder="center" />
              <StyleInput label="Align" value={node.style.alignItems} onChange={(v) => setStyle('alignItems', v)} placeholder="center" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InspectorPanel;
