import React from 'react';

interface EditableTextProps {
  as?: string;
  sectionKey: string;
  field: 'title' | 'subtitle' | 'description' | 'cta_label' | 'tagline';
  lang: 'el' | 'en';
  value: string;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({
  as = 'span',
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

  React.useEffect(() => {
    if (!ref.current) return;
    if (!editing) ref.current.innerText = value ?? '';
  }, [value, editing]);

  const commit = React.useCallback(() => {
    const next = ref.current?.innerText ?? '';
    if (next === (value ?? '')) return;
    window.parent?.postMessage(
      { type: 'landing-editor-text', sectionKey, field, lang, value: next },
      '*',
    );
  }, [value, sectionKey, field, lang]);

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
  }, [editing, commit]);

  if (!isEditor) {
    return React.createElement(as, { className, style }, value);
  }

  return React.createElement(as, {
    ref,
    'data-editable': '1',
    className,
    style: {
      ...style,
      outline: editing ? '2px dashed #00ffba' : undefined,
      outlineOffset: 4,
      cursor: editing ? 'text' : 'pointer',
      whiteSpace: multiline ? 'pre-wrap' : undefined,
    },
    contentEditable: editing,
    suppressContentEditableWarning: true,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      window.parent?.postMessage({ type: 'landing-editor-select', key: sectionKey }, '*');
      if (!editing) setEditing(true);
    },
    onBlur: () => {
      commit();
      setEditing(false);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!multiline && e.key === 'Enter') {
        e.preventDefault();
        (ref.current as HTMLElement | null)?.blur();
      }
      if (e.key === 'Escape') {
        if (ref.current) ref.current.innerText = value ?? '';
        setEditing(false);
      }
    },
  });
};
