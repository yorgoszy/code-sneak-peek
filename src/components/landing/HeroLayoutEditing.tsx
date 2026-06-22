import React from 'react';
import { GOOGLE_FONTS, PROJECT_FONTS } from '@/components/landing-cms/shared';
import { useLandingTheme } from '@/hooks/useLandingConfig';

export const isHeroEditorMode = () =>
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('editor') === '1';

export type BP = 'desktop' | 'tablet' | 'mobile';

export const getBP = (): BP => {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w <= 480) return 'mobile';
  if (w <= 820) return 'tablet';
  return 'desktop';
};

export const useBP = (): BP => {
  const [bp, setBP] = React.useState<BP>(() => getBP());
  React.useEffect(() => {
    const onR = () => setBP(getBP());
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  return bp;
};

/** Wrap a patch in the bp namespace (desktop = top-level). */
const wrapForBP = (bp: BP, patch: any) => (bp === 'desktop' ? patch : { [bp]: patch });

/** Magnetic snap: snap to 0 within 8px, otherwise snap to 8px grid when shift held. */
const SNAP_THRESHOLD = 8;
export const snap = (v: number, anchors: number[] = [0]): number => {
  for (const a of anchors) if (Math.abs(v - a) <= SNAP_THRESHOLD) return a;
  return v;
};

const postPatch = (bp: BP, patch: any, final = false) => {
  const wrapped = wrapForBP(bp, patch);
  try {
    window.dispatchEvent(new CustomEvent('hero-layout-local', { detail: wrapped }));
  } catch { /* ignore */ }
  if (final) {
    window.parent?.postMessage({ type: 'landing-editor-hero', patch: wrapped, final: true }, '*');
  }
};

interface HeroEditableTextProps {
  kind: 'title' | 'subtitle';
  font?: string;
  size?: number;
  pos?: { x?: number; y?: number };
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  active: boolean;
  onActivate: () => void;
}

export const HeroEditableText: React.FC<HeroEditableTextProps> = ({
  kind, font, size, pos, children, className, style, active, onActivate,
}) => {
  const editor = isHeroEditorMode();
  const bp = useBP();
  const ref = React.useRef<HTMLDivElement>(null);
  const { data: theme } = useLandingTheme();
  const customFonts = theme?.custom_fonts ?? [];

  const x = pos?.x ?? 0;
  const y = pos?.y ?? 0;

  // Click + drag the text itself (active). We start the drag on mousedown,
  // and only "click" (activate) if there was no movement.
  const onTextMouseDown = (e: React.MouseEvent) => {
    if (!editor) return;
    // Ignore drags initiated from controls inside the toolbar
    if ((e.target as HTMLElement).closest('[data-hero-toolbar]')) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX, startY = e.clientY;
    const sx = x, sy = y;
    let moved = false;

    const move = (ev: MouseEvent) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (!moved && Math.hypot(dx, dy) > 3) moved = true;
      if (active && moved) {
        const nx = snap(sx + dx);
        const ny = snap(sy + dy);
        postPatch(bp, { [kind]: { x: nx, y: ny } });
      }
    };
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (!moved) {
        onActivate();
      } else if (active) {
        postPatch(bp, { [kind]: { x: snap(sx + dx), y: snap(sy + dy) } }, true);
      }
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const styleMerged: React.CSSProperties = {
    ...style,
    fontFamily: font ? `'${font}', sans-serif` : style?.fontFamily,
    fontSize: size ? `${size}px` : style?.fontSize,
    lineHeight: 1.05,
    position: 'relative',
    display: 'inline-block',
    transform: (x || y) ? `translate(${x}px, ${y}px)` : style?.transform,
    outline: editor && active ? '2px dashed #00ffba' : undefined,
    outlineOffset: 6,
    cursor: editor ? (active ? 'move' : 'pointer') : undefined,
    userSelect: editor ? 'none' : undefined,
  };

  const fonts = [
    ...customFonts.map((f) => f.name),
    ...PROJECT_FONTS,
    ...GOOGLE_FONTS,
  ];

  return (
    <div
      ref={ref}
      data-hero-edit-root
      data-hero-edit-kind={kind}
      className={className}
      style={styleMerged}
      onMouseDown={onTextMouseDown}
    >
      {children}

      {editor && active && (
        <div
          data-hero-toolbar
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: -44,
            left: 0,
            display: 'flex',
            gap: 6,
            background: '#000',
            color: '#00ffba',
            border: '1px solid #00ffba',
            padding: '4px 6px',
            zIndex: 60,
            fontFamily: 'monospace',
            fontSize: 11,
            whiteSpace: 'nowrap',
            alignItems: 'center',
          }}
        >
          <span style={{ opacity: 0.7, textTransform: 'uppercase' }}>{bp}</span>
          <select
            value={font ?? ''}
            onChange={(e) => postPatch(bp, { [kind]: { font: e.target.value } }, true)}
            style={{
              background: '#000', color: '#00ffba',
              border: '1px solid #00ffba', padding: '2px 4px',
              fontFamily: 'monospace', fontSize: 11, maxWidth: 160,
            }}
          >
            <option value="">— font —</option>
            {customFonts.length > 0 && (
              <optgroup label="Custom">
                {customFonts.map((f) => <option key={`c-${f.name}`} value={f.name}>{f.name}</option>)}
              </optgroup>
            )}
            <optgroup label="Project">
              {PROJECT_FONTS.map((f) => <option key={`p-${f}`} value={f}>{f}</option>)}
            </optgroup>
            <optgroup label="Google">
              {GOOGLE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            </optgroup>
          </select>
          <input
            type="number"
            min={12}
            max={300}
            value={size ?? ''}
            placeholder="size"
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v) && v > 0) postPatch(bp, { [kind]: { size: v } });
            }}
            onBlur={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v) && v > 0) postPatch(bp, { [kind]: { size: v } }, true);
            }}
            style={{
              width: 56, background: '#000', color: '#00ffba',
              border: '1px solid #00ffba', padding: '2px 4px',
              fontFamily: 'monospace', fontSize: 11,
            }}
          />
          <button
            type="button"
            onClick={() => postPatch(bp, { [kind]: { x: 0, y: 0 } }, true)}
            title="Reset position"
            style={{
              background: '#000', color: '#00ffba',
              border: '1px solid #00ffba', padding: '2px 6px',
              fontFamily: 'monospace', fontSize: 11, cursor: 'pointer',
            }}
          >reset pos</button>
        </div>
      )}
    </div>
  );
};


interface HeroDraggableButtonProps {
  id: 'primary' | 'secondary';
  pos?: { x?: number; y?: number; scale?: number };
  active: boolean;
  onActivate: () => void;
  children: React.ReactNode;
}

export const HeroDraggableButton: React.FC<HeroDraggableButtonProps> = ({
  id, pos, active, onActivate, children,
}) => {
  const editor = isHeroEditorMode();
  const bp = useBP();
  const x = pos?.x ?? 0;
  const y = pos?.y ?? 0;
  const scale = pos?.scale ?? 1;

  const onDragDown = (e: React.MouseEvent) => {
    if (!editor) return;
    if ((e.target as HTMLElement).closest('[data-btn-handle]')) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const sx = x, sy = y;
    let moved = false;
    const move = (ev: MouseEvent) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (!moved && Math.hypot(dx, dy) > 3) moved = true;
      if (active && moved)
        postPatch(bp, { buttons: { [id]: { x: sx + dx, y: sy + dy, scale } } });
    };
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (!moved) onActivate();
      else if (active)
        postPatch(bp, { buttons: { [id]: { x: sx + dx, y: sy + dy, scale } } }, true);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const onScaleDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startScale = scale;
    const move = (ev: MouseEvent) => {
      const next = Math.max(0.5, Math.min(3, startScale + (ev.clientX - startX) / 120));
      postPatch(bp, { buttons: { [id]: { x, y, scale: next } } });
    };
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      const next = Math.max(0.5, Math.min(3, startScale + (ev.clientX - startX) / 120));
      postPatch(bp, { buttons: { [id]: { x, y, scale: next } } }, true);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <div
      data-hero-edit-root
      data-hero-edit-button={id}
      onMouseDown={onDragDown}
      style={{
        position: 'relative',
        display: 'inline-block',
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        transformOrigin: 'top left',
        outline: editor && active ? '2px dashed #00ffba' : undefined,
        outlineOffset: 4,
        cursor: editor ? (active ? 'move' : 'pointer') : undefined,
      }}
    >
      {children}
      {editor && active && (
        <div
          data-btn-handle
          onMouseDown={onScaleDown}
          title="Drag to scale"
          style={{
            position: 'absolute',
            right: -8,
            bottom: -8,
            width: 14,
            height: 14,
            background: '#00ffba',
            border: '1px solid #000',
            cursor: 'nwse-resize',
            zIndex: 60,
          }}
        />
      )}
    </div>
  );
};
