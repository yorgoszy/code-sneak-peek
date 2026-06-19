import React, { CSSProperties, useState } from 'react';
import {
  PageNode, NodeStyle, Locale, getLocalized, isContainerType,
} from '@/hooks/useLandingTree';
import { DRAG_MIME_NEW, DRAG_MIME_MOVE, DRAG_MIME_CMS } from './PalettePanel';
import type { DropTarget, DropExtra } from './LayersPanel';
import { CmsSectionRenderer, type CmsSectionKey } from './CmsSectionRenderer';

// ============================================================================
// NodeRenderer — turns a PageNode tree into actual DOM.
// In editor mode, container nodes accept drops from the palette and from
// other layer rows for free-form composition.
// ============================================================================

export interface NodeRendererProps {
  node: PageNode;
  locale: Locale;
  editorMode?: boolean;
  selectedId?: string | null;
  hoveredId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  breakpoint?: 'desktop' | 'tablet' | 'mobile';
  onDropNew?: (type: string, target: DropTarget) => void;
  onDropMove?: (id: string, target: DropTarget) => void;
}

const RESPONSIVE_KEY: Record<NonNullable<NodeRendererProps['breakpoint']>, 'sm' | 'md' | null> = {
  desktop: null,
  tablet: 'md',
  mobile: 'sm',
};

export function nodeStyleToCss(
  style: NodeStyle,
  breakpoint: NodeRendererProps['breakpoint'] = 'desktop',
): CSSProperties {
  const { md, sm, ...base } = style;
  const key = RESPONSIVE_KEY[breakpoint];
  const override =
    key === 'sm' ? { ...(md ?? {}), ...(sm ?? {}) }
    : key === 'md' ? (md ?? {})
    : {};
  return { ...(base as CSSProperties), ...(override as CSSProperties) };
}

const renderChildren = (p: NodeRendererProps) =>
  p.node.children.map((c) => <NodeRenderer key={c.id} {...p} node={c} />);

const Page: React.FC<NodeRendererProps> = (p) => (
  <div style={nodeStyleToCss(p.node.style, p.breakpoint)} data-node-id={p.node.id}>
    {renderChildren(p)}
  </div>
);

const Section: React.FC<NodeRendererProps> = (p) => (
  <section
    id={p.node.props.htmlId ?? p.node.props.sectionKey ?? undefined}
    style={{ width: '100%', position: 'relative', ...nodeStyleToCss(p.node.style, p.breakpoint) }}
    data-node-id={p.node.id}
  >
    {renderChildren(p)}
  </section>
);

const Container: React.FC<NodeRendererProps> = (p) => (
  <div style={nodeStyleToCss(p.node.style, p.breakpoint)} data-node-id={p.node.id}>
    {renderChildren(p)}
  </div>
);

const Columns: React.FC<NodeRendererProps> = (p) => {
  const css: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${p.node.children.length || 1}, minmax(0,1fr))`,
    gap: '1rem',
    ...nodeStyleToCss(p.node.style, p.breakpoint),
  };
  return <div style={css} data-node-id={p.node.id}>{renderChildren(p)}</div>;
};

const Heading: React.FC<NodeRendererProps> = (p) => {
  const level = p.node.props.level ?? 2;
  const text = getLocalized(p.node.props.text, p.locale);
  const content = text || (p.editorMode ? '(empty heading)' : '');
  const style = nodeStyleToCss(p.node.style, p.breakpoint);
  return React.createElement(`h${level}`, { style, 'data-node-id': p.node.id, children: content });
};

const Text: React.FC<NodeRendererProps> = (p) => {
  const text = getLocalized(p.node.props.text, p.locale);
  return (
    <p style={nodeStyleToCss(p.node.style, p.breakpoint)} data-node-id={p.node.id}>
      {text || (p.editorMode ? '(empty text)' : '')}
    </p>
  );
};

const ImageNode: React.FC<NodeRendererProps> = (p) => {
  const src = p.node.props.src;
  const alt = getLocalized(p.node.props.alt, p.locale);
  if (!src) {
    return (
      <div
        style={{
          minHeight: 120, background: 'hsl(var(--muted))',
          color: 'hsl(var(--muted-foreground))', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 12,
          ...nodeStyleToCss(p.node.style, p.breakpoint),
        }}
        data-node-id={p.node.id}
      >
        {p.editorMode ? '(no image)' : ''}
      </div>
    );
  }
  return (
    <img src={src} alt={alt}
      style={{ maxWidth: '100%', ...nodeStyleToCss(p.node.style, p.breakpoint) }}
      data-node-id={p.node.id} />
  );
};

const ButtonNode: React.FC<NodeRendererProps> = (p) => {
  const text = getLocalized(p.node.props.text, p.locale);
  const href = p.node.props.href;
  const css: CSSProperties = {
    display: 'inline-block', padding: '0.75rem 1.5rem',
    background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))',
    textDecoration: 'none', cursor: 'pointer', border: 'none',
    ...nodeStyleToCss(p.node.style, p.breakpoint),
  };
  if (href && !p.editorMode) {
    return (
      <a href={href} target={p.node.props.target ?? '_self'} style={css} data-node-id={p.node.id}>
        {text || 'Button'}
      </a>
    );
  }
  return <button type="button" style={css} data-node-id={p.node.id}>{text || 'Button'}</button>;
};

const Spacer: React.FC<NodeRendererProps> = (p) => (
  <div style={{ height: 40, width: '100%', ...nodeStyleToCss(p.node.style, p.breakpoint) }}
    data-node-id={p.node.id} />
);

const VideoNode: React.FC<NodeRendererProps> = (p) => {
  const { src, poster, autoplay, loop, muted = true, controls = true } = p.node.props;
  if (!src) {
    return (
      <div
        style={{
          minHeight: 200, background: '#000', color: '#666',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
          ...nodeStyleToCss(p.node.style, p.breakpoint),
        }}
        data-node-id={p.node.id}
      >
        {p.editorMode ? '(no video src)' : ''}
      </div>
    );
  }
  return (
    <video src={src} poster={poster} autoPlay={autoplay} loop={loop} muted={muted}
      controls={controls} playsInline
      style={{ width: '100%', ...nodeStyleToCss(p.node.style, p.breakpoint) }}
      data-node-id={p.node.id} />
  );
};

const PlaceholderComponent: React.FC<NodeRendererProps & { label: string }> = (p) => (
  <div
    style={{
      padding: '2rem', border: '1px dashed hsl(var(--border))',
      background: 'hsl(var(--muted) / 0.3)', color: 'hsl(var(--muted-foreground))',
      textAlign: 'center', fontSize: 13,
      ...nodeStyleToCss(p.node.style, p.breakpoint),
    }}
    data-node-id={p.node.id}
  >
    {p.label} — full component coming in next phase
  </div>
);

const CmsSection: React.FC<NodeRendererProps> = (p) => {
  const key = p.node.props.sectionKey as CmsSectionKey | undefined;
  return (
    <div
      style={nodeStyleToCss(p.node.style, p.breakpoint)}
      data-node-id={p.node.id}
      // Block clicks inside CMS sections in editor mode so they don't navigate
      onClick={p.editorMode ? (e) => e.preventDefault() : undefined}
    >
      <div style={p.editorMode ? { pointerEvents: 'none' } : undefined}>
        <CmsSectionRenderer sectionKey={key} editorMode={p.editorMode} />
      </div>
    </div>
  );
};

const RENDERERS: Record<string, React.FC<NodeRendererProps>> = {
  page: Page,
  section: Section,
  container: Container,
  columns: Columns,
  column: Container,
  heading: Heading,
  text: Text,
  image: ImageNode,
  button: ButtonNode,
  spacer: Spacer,
  video: VideoNode,
  cms_section: CmsSection,
  carousel: (p) => <PlaceholderComponent {...p} label="Carousel" />,
  accordion: (p) => <PlaceholderComponent {...p} label="Accordion" />,
  tabs: (p) => <PlaceholderComponent {...p} label="Tabs" />,
  form: (p) => <PlaceholderComponent {...p} label="Form" />,
  icon: (p) => <PlaceholderComponent {...p} label="Icon" />,
};

export const NodeRenderer: React.FC<NodeRendererProps> = (props) => {
  const Cmp = RENDERERS[props.node.type] ?? Container;
  const inner = <Cmp {...props} />;

  if (!props.editorMode) return inner;

  const isSelected = props.selectedId === props.node.id;
  const isHovered = props.hoveredId === props.node.id;
  const [dropZone, setDropZone] = useState<'before' | 'inside' | 'after' | null>(null);
  const isContainer = isContainerType(props.node.type);

  const computeZone = (e: React.DragEvent): 'before' | 'inside' | 'after' => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - r.top;
    const h = r.height;
    if (!isContainer || props.node.type === 'page') return y < h / 2 ? 'before' : 'after';
    if (y < h * 0.2) return 'before';
    if (y > h * 0.8) return 'after';
    return 'inside';
  };

  const onDragOver = (e: React.DragEvent) => {
    if (!props.onDropNew && !props.onDropMove) return;
    const types = e.dataTransfer.types;
    if (!types.includes(DRAG_MIME_NEW) && !types.includes(DRAG_MIME_MOVE)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = types.includes(DRAG_MIME_NEW) ? 'copy' : 'move';
    setDropZone(props.node.type === 'page' ? 'inside' : computeZone(e));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const z = dropZone ?? computeZone(e);
    setDropZone(null);

    // For "before"/"after" we need parent context; we approximate by treating
    // "before"/"after" on a non-container as drop into its visual neighbor.
    // The Layers panel handles precise sibling drops; here we keep it simple:
    // any drop on a node lands inside if container, else inside its parent at end.
    let target: DropTarget;
    if (z === 'inside' && isContainer) {
      target = { parentId: props.node.id, index: props.node.children.length };
    } else {
      // fallback: append into nearest container ancestor isn't available here,
      // so for non-containers we just treat as inside the page-level concept.
      // Better UX is via Layers; on canvas we accept inside-only drops.
      if (!isContainer) return;
      target = { parentId: props.node.id, index: props.node.children.length };
    }

    const newType = e.dataTransfer.getData(DRAG_MIME_NEW);
    if (newType && props.onDropNew) {
      const cmsKey = e.dataTransfer.getData(DRAG_MIME_CMS) || undefined;
      props.onDropNew(newType, target, cmsKey ? { cmsKey } : undefined);
      return;
    }
    const moveId = e.dataTransfer.getData(DRAG_MIME_MOVE);
    if (moveId && moveId !== props.node.id && props.onDropMove) {
      props.onDropMove(moveId, target);
    }
  };

  const outlineColor = isSelected
    ? 'hsl(var(--primary))'
    : isHovered
    ? 'hsl(var(--primary) / 0.5)'
    : 'transparent';

  return (
    <div
      draggable={props.node.type !== 'page'}
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData(DRAG_MIME_MOVE, props.node.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={onDragOver}
      onDragLeave={() => setDropZone(null)}
      onDrop={onDrop}
      style={{
        position: 'relative',
        outline: dropZone === 'inside' ? '2px solid hsl(var(--primary))' : `2px solid ${outlineColor}`,
        outlineOffset: -2,
      }}
      onClick={(e) => { e.stopPropagation(); props.onSelect?.(props.node.id); }}
      onMouseEnter={(e) => { e.stopPropagation(); props.onHover?.(props.node.id); }}
      onMouseLeave={(e) => { e.stopPropagation(); props.onHover?.(null); }}
    >
      {inner}
    </div>
  );
};
