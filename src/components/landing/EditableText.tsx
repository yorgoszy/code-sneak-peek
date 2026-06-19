import React from 'react';

/**
 * Inline-editable text element used inside landing sections when the page is
 * rendered in editor mode (URL has ?editor=1, i.e. the CMS preview iframe).
 *
 * Behaviour:
 *  - Default render: behaves like the underlying tag (no extra UI).
 *  - In editor mode: a single click toggles edit mode (dashed outline + caret).
 *    Click outside or click again deactivates and pushes the new value to the
 *    parent CMS via postMessage `landing-editor-text`.
 */
interface EditableTextProps {
  as?: keyof JSX.IntrinsicElements;
  sectionKey: string;
  field: 'title' | 'subtitle' | 'description' | 'cta_label';
  lang: 'el' | 'en';
  value: string;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({
  as: Tag = 'span',
  sectionKey,
  field,
  lang,
  value,
  className,
  style,
  multiline,
}) => {
  const isEditor =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('editor') === '1';

  const [editing, setEditing] = React.useState(false);
  const ref = React.useRef<HTMLElement | null>(null);

  // Sync external value into the DOM when not actively editing
  React.useEffect(() => {
    if (!ref.current) return;
    if (!editing) ref.current.innerText = value ?? '';
  }, [value, editing]);

  // Click outside to deactivate
  React.useEffect(() => {
    if (!editing) return;
    const onDown = (ev: MouseEvent) => {
      if (ref.current && !ref.current.contains(ev.target as Node)) {
        commit();
        setEditing(false);
      }
    };
    document.addEventListener('mousedown', onDown, true);
    return () => document.removeEventListener('mousedown', onDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const commit = () => {
    const next = ref.current?.innerText ?? '';
    if (next === (value ?? '')) return;
    window.parent?.postMessage(
      { type: 'landing-editor-text', sectionKey, field, lang, value: next },
      '*',
    );
  };

  if (!isEditor) {
    // Pass-through render
    return (
      <Tag className={className} style={style}>
        {value}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref as any}
      className={className}
      style={{
        ...style,
        outline: editing ? '2px dashed #00ffba' : undefined,
        outlineOffset: 4,
        cursor: editing ? 'text' : 'pointer',
        whiteSpace: multiline ? 'pre-wrap' : undefined,
      }}
      contentEditable={editing}
      suppressContentEditableWarning
      onClick={(e: any) => {
        e.preventDefault();
        e.stopPropagation();
        // Make sure the CMS panel shows this section
        window.parent?.postMessage({ type: 'landing-editor-select', key: sectionKey }, '*');
        if (!editing) setEditing(true);
      }}
      onBlur={() => {
        commit();
        setEditing(false);
      }}
      onKeyDown={(e: any) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          (ref.current as HTMLElement | null)?.blur();
        }
        if (e.key === 'Escape') {
          if (ref.current) ref.current.innerText = value ?? '';
          setEditing(false);
        }
      }}
    />
  );
};
