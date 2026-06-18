import React, { CSSProperties } from 'react';
import { PageNode, NodeStyle, Locale, getLocalized } from '@/hooks/useLandingTree';

// ============================================================================
// NodeRenderer — turns a PageNode tree into actual DOM.
// Same component is used for both editor preview and production runtime.
// ============================================================================

export interface NodeRendererProps {
  node: PageNode;
  locale: Locale;
  /** When true, every node is wrapped with select / hover affordances. */
  editorMode?: boolean;
  selectedId?: string | null;
  hoveredId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  /** Current responsive breakpoint, used to merge style overrides. */
  breakpoint?: 'desktop' | 'tablet' | 'mobile';
}

// ----- style helpers --------------------------------------------------------

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

// ----- per-type renderers ---------------------------------------------------

const Page: React.FC<NodeRendererProps> = (p) => (
  <div style={nodeStyleToCss(p.node.style, p.breakpoint)} data-node-id={p.node.id}>
    {p.node.children.map((c) => (
      <NodeRenderer key={c.id} {...p} node={c} />
    ))}
  </div>
);

const Section: React.FC<NodeRendererProps> = (p) => {
  const css: CSSProperties = {
    width: '100%',
    position: 'relative',
    ...nodeStyleToCss(p.node.style, p.breakpoint),
  };
  return (
    <section
      id={p.node.props.htmlId ?? p.node.props.sectionKey ?? undefined}
      style={css}
      data-node-id={p.node.id}
    >
      {p.node.children.map((c) => (
        <NodeRenderer key={c.id} {...p} node={c} />
      ))}
    </section>
  );
};

const Container: React.FC<NodeRendererProps> = (p) => (
  <div style={nodeStyleToCss(p.node.style, p.breakpoint)} data-node-id={p.node.id}>
    {p.node.children.map((c) => (
      <NodeRenderer key={c.id} {...p} node={c} />
    ))}
  </div>
);

const Columns: React.FC<NodeRendererProps> = (p) => {
  const css: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${p.node.children.length || 1}, minmax(0,1fr))`,
    gap: '1rem',
    ...nodeStyleToCss(p.node.style, p.breakpoint),
  };
  return (
    <div style={css} data-node-id={p.node.id}>
      {p.node.children.map((c) => (
        <NodeRenderer key={c.id} {...p} node={c} />
      ))}
    </div>
  );
};

const Heading: React.FC<NodeRendererProps> = (p) => {
  const Tag = (`h${p.node.props.level ?? 2}`) as keyof JSX.IntrinsicElements;
  const text = getLocalized(p.node.props.text, p.locale);
  return (
    <Tag style={nodeStyleToCss(p.node.style, p.breakpoint)} data-node-id={p.node.id}>
      {text || (p.editorMode ? '(empty heading)' : '')}
    </Tag>
  );
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
          minHeight: 120,
          background: 'hsl(var(--muted))',
          color: 'hsl(var(--muted-foreground))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          ...nodeStyleToCss(p.node.style, p.breakpoint),
        }}
        data-node-id={p.node.id}
      >
        {p.editorMode ? '(no image)' : ''}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      style={{ maxWidth: '100%', ...nodeStyleToCss(p.node.style, p.breakpoint) }}
      data-node-id={p.node.id}
    />
  );
};

const ButtonNode: React.FC<NodeRendererProps> = (p) => {
  const text = getLocalized(p.node.props.text, p.locale);
  const href = p.node.props.href;
  const css: CSSProperties = {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    background: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
    ...nodeStyleToCss(p.node.style, p.breakpoint),
  };
  if (href && !p.editorMode) {
    return (
      <a href={href} target={p.node.props.target ?? '_self'} style={css} data-node-id={p.node.id}>
        {text || 'Button'}
      </a>
    );
  }
  return (
    <button type="button" style={css} data-node-id={p.node.id}>
      {text || 'Button'}
    </button>
  );
};

const Spacer: React.FC<NodeRendererProps> = (p) => (
  <div
    style={{ height: 40, width: '100%', ...nodeStyleToCss(p.node.style, p.breakpoint) }}
    data-node-id={p.node.id}
  />
);

const VideoNode: React.FC<NodeRendererProps> = (p) => {
  const { src, poster, autoplay, loop, muted = true, controls = true } = p.node.props;
  if (!src) {
    return (
      <div
        style={{
          minHeight: 200,
          background: '#000',
          color: '#666',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          ...nodeStyleToCss(p.node.style, p.breakpoint),
        }}
        data-node-id={p.node.id}
      >
        {p.editorMode ? '(no video src)' : ''}
      </div>
    );
  }
  return (
    <video
      src={src}
      poster={poster}
      autoPlay={autoplay}
      loop={loop}
      muted={muted}
      controls={controls}
      playsInline
      style={{ width: '100%', ...nodeStyleToCss(p.node.style, p.breakpoint) }}
      data-node-id={p.node.id}
    />
  );
};

// Placeholder for complex components — full implementations land in Phase 5
const PlaceholderComponent: React.FC<NodeRendererProps & { label: string }> = (p) => (
  <div
    style={{
      padding: '2rem',
      border: '1px dashed hsl(var(--border))',
      background: 'hsl(var(--muted) / 0.3)',
      color: 'hsl(var(--muted-foreground))',
      textAlign: 'center',
      fontSize: 13,
      ...nodeStyleToCss(p.node.style, p.breakpoint),
    }}
    data-node-id={p.node.id}
  >
    {p.label} — full component coming in next phase
  </div>
);

// ----- dispatcher -----------------------------------------------------------

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
  const outlineColor = isSelected
    ? 'hsl(var(--primary))'
    : isHovered
    ? 'hsl(var(--primary) / 0.5)'
    : 'transparent';

  return (
    <div
      style={{ position: 'relative', outline: `2px solid ${outlineColor}`, outlineOffset: -2 }}
      onClick={(e) => {
        e.stopPropagation();
        props.onSelect?.(props.node.id);
      }}
      onMouseEnter={(e) => {
        e.stopPropagation();
        props.onHover?.(props.node.id);
      }}
      onMouseLeave={(e) => {
        e.stopPropagation();
        props.onHover?.(null);
      }}
    >
      {inner}
    </div>
  );
};
