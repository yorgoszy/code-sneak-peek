import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Trash2, Copy, Eye } from 'lucide-react';
import { type PageNode, getLocalized, type Locale } from '@/hooks/useLandingTree';

interface Props {
  root: PageNode;
  locale: Locale;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const nodeLabel = (n: PageNode, locale: Locale): string => {
  if (n.type === 'page') return 'Page';
  const txt = (n.props as any)?.text;
  const localized = txt ? getLocalized(txt, locale) : '';
  if (localized) return `${n.type} · ${localized.slice(0, 22)}`;
  if (n.props?.sectionKey) return `${n.type} · ${n.props.sectionKey}`;
  return n.type;
};

const Row: React.FC<Props & { node: PageNode; depth: number }> = ({
  node, depth, locale, selectedId, onSelect, onDelete, onDuplicate, root,
}) => {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 px-2 py-1 text-xs cursor-pointer hover:bg-muted ${
          isSelected ? 'bg-foreground text-background hover:bg-foreground' : ''
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <span className="w-3" />
        )}
        <span className="truncate flex-1">{nodeLabel(node, locale)}</span>
        {node.type !== 'page' && (
          <div className={`flex items-center gap-1 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDuplicate(node.id); }}
              title="Duplicate"
              className="p-0.5 hover:bg-background/20"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
              title="Delete"
              className="p-0.5 hover:bg-background/20"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      {hasChildren && open && (
        <div>
          {node.children.map((c) => (
            <Row
              key={c.id}
              node={c}
              depth={depth + 1}
              root={root}
              locale={locale}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const LayersPanel: React.FC<Props> = (props) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-border text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
        <Eye className="w-3 h-3" /> Layers
      </div>
      <div className="flex-1 overflow-auto py-1">
        <Row {...props} node={props.root} depth={0} />
      </div>
    </div>
  );
};

export default LayersPanel;
