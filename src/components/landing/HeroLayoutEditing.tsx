import React from 'react';
import { GOOGLE_FONTS } from '@/components/landing-cms/shared';

export const isHeroEditorMode = () =>
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('editor') === '1';

const postPatch = (patch: any, final = false) => {
  window.parent?.postMessage({ type: 'landing-editor-hero', patch, final }, '*');
};

interface HeroEditableTextProps {
  kind: 'title' | 'subtitle';
  font?: string;
  size?: number; // px
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  active: boolean;
  onActivate: () => void;
}

/**
 * Wraps title/subtitle. When active in editor: outline, vertical resize handle on right edge
 * (drag = font-size), and a font selector popover at top-right.
 */
export const HeroEditableText: React.FC<HeroEditableTextProps> = ({
  kind, font, size, children, className, style, active, onActivate,
}) => {
  const editor = isHeroEditorMode();
  const ref = React.useRef<HTMLDivElement>(null);

  const onResizeDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startSize = size ?? (ref.current?.getBoundingClientRect().height ?? 64);
    const move = (ev: MouseEvent) => {
      const delta = ev.clientY - startY;
      const next = Math.max(12, Math.min(240, Math.round(startSize + delta * 0.6)));
      postPatch({ [kind]: { size: next } });
    };
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      const delta = ev.clientY - startY;
      const next = Math.max(12, Math.min(240, Math.round(startSize + delta * 0.6)));
      postPatch({ [kind]: { size: next } }, true);
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
    outline: editor && active ? '2px dashed #00ffba' : undefined,
    outlineOffset: 6,
    cursor: editor ? 'pointer' : undefined,
  };

  return (
    <div
      ref={ref}
      data-hero-edit-root
      data-hero-edit-kind={kind}
      className={className}
      style={styleMerged}
      onClick={(e) => {
        if (!editor) return;
        e.stopPropagation();
        onActivate();
      }}
    >
      {children}

      {editor && active && (
        <>
          {/* Vertical resize handle — drag down to enlarge */}
          <div
            onMouseDown={onResizeDown}
            title="Drag to resize"
            style={{
              position: 'absolute',
              right: -14,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 10,
              height: 32,
              background: '#00ffba',
              cursor: 'ns-resize',
              zIndex: 60,
            }}
          />
          {/* Font picker */}
          <select
            value={font ?? ''}
            onChange={(e) => postPatch({ [kind]: { font: e.target.value } }, true)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: -36,
              right: 0,
              background: '#000',
              color: '#00ffba',
              border: '1px solid #00ffba',
              fontFamily: 'monospace',
              fontSize: 11,
              padding: '2px 4px',
              zIndex: 60,
            }}
          >
            <option value="">— font —</option>
            {GOOGLE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </>
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

/**
 * Wraps a CTA button. Free drag to translate(x,y); corner handle to scale.
 */
export const HeroDraggableButton: React.FC<HeroDraggableButtonProps> = ({
  id, pos, active, onActivate, children,
}) => {
  const editor = isHeroEditorMode();
  const x = pos?.x ?? 0;
  const y = pos?.y ?? 0;
  const scale = pos?.scale ?? 1;

  const onDragDown = (e: React.MouseEvent) => {
    if (!editor || !active) return;
    if ((e.target as HTMLElement).closest('[data-btn-handle]')) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const sx = x, sy = y;
    const move = (ev: MouseEvent) => {
      postPatch({ buttons: { [id]: { x: sx + (ev.clientX - startX), y: sy + (ev.clientY - startY), scale } } });
    };
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      postPatch({ buttons: { [id]: { x: sx + (ev.clientX - startX), y: sy + (ev.clientY - startY), scale } } }, true);
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
      postPatch({ buttons: { [id]: { x, y, scale: next } } });
    };
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      const next = Math.max(0.5, Math.min(3, startScale + (ev.clientX - startX) / 120));
      postPatch({ buttons: { [id]: { x, y, scale: next } } }, true);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <div
      data-hero-edit-root
      data-hero-edit-button={id}
      onClick={(e) => {
        if (!editor) return;
        e.stopPropagation();
        onActivate();
      }}
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
