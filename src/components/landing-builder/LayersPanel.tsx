import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Trash2, Copy, Eye } from 'lucide-react';
import {
  type PageNode, getLocalized, type Locale, isContainerType,
} from '@/hooks/useLandingTree';
import { DRAG_MIME_NEW, DRAG_MIME_MOVE } from './PalettePanel';

export interface DropTarget {
  parentId: string;
  index: number;
}

interface Props {
  root: PageNode;
  locale: Locale;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDropNew: (type: string, target: DropTarget) => void;
  onDropMove: (id: string, target: DropTarget) => void;
}

const nodeLabel = (n: PageNode, locale: Locale): string => {
  if (n.type === 'page') return 'Page';
  const txt = (n.props as any)?.text;
  const localized = txt ? getLocalized(txt, locale) : '';
  if (localized) return `${n.type} · ${localized.slice(0, 22)}`;
  if (n.props?.sectionKey) return `${n.type} · ${n.props.sectionKey}`;
  return n.type;
};

type Zone = 'before' | 'inside' | 'after';

const Row: React.FC<Props & { node: PageNode; depth: number; parentId: string | null; index: number }> = ({
  node, depth, parentId, index, locale, selectedId,
  onSelect, onDelete, onDuplicate, onDropNew, onDropMove, root,
}) => {
  const [open, setOpen] = useState(true);
  const [zone, setZone] = useState<Zone | null>(null);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const isContainer = isContainerType(node.type);

  const computeZone = (e: React.DragEvent<HTMLDivElement>): Zone => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - r.top;
    const h = r.height;
    if (!isContainer) return y < h / 2 ? 'before' : 'after';
    if (y < h * 0.25) return 'before';
    if (y > h * 0.75) return 'after';
    return 'inside';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (node.type === 'page') {
      // page: only "inside"
      e.preventDefault();
      e.dataTransfer.dropEffect = e.dataTransfer.types.includes(DRAG_MIME_NEW) ? 'copy' : 'move';
      setZone('inside');
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes(DRAG_MIME_NEW) ? 'copy' : 'move';
    setZone(computeZone(e));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const z = node.type === 'page' ? 'inside' : (zone ?? computeZone(e));
    setZone(null);

    let target: DropTarget;
    if (z === 'inside') {
      target = { parentId: node.id, index: node.children.length };
    } else if (parentId) {
      target = { parentId, index: z === 'before' ? index : index + 1 };
    } else {
      return;
    }

    const newType = e.dataTransfer.getData(DRAG_MIME_NEW);
    if (newType) {
      onDropNew(newType, target);
      return;
    }
    const moveId = e.dataTransfer.getData(DRAG_MIME_MOVE);
    if (moveId && moveId !== node.id) {
      onDropMove(moveId, target);
    }
  };

  return (
    <div>
      <div
        draggable={node.type !== 'page'}
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData(DRAG_MIME_MOVE, node.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragOver={handleDragOver}
        onDragLeave={() => setZone(null)}
        onDrop={handleDrop}
        className={`group relative flex items-center gap-1 px-2 py-1 text-xs cursor-pointer hover:bg-muted ${
          isSelected ? 'bg-foreground text-background hover:bg-foreground' : ''
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
        onClick={() => onSelect(node.id)}
      >
        {/* Drop indicators */}
        {zone === 'before' && <div className="absolute left-0 right-0 top-0 h-0.5 bg-primary pointer-events-none" />}
        {zone === 'after' && <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary pointer-events-none" />}
        {zone === 'inside' && <div className="absolute inset-0 outline outline-2 outline-primary -outline-offset-2 pointer-events-none" />}

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
          {node.children.map((c, i) => (
            <Row
              key={c.id}
              node={c}
              depth={depth + 1}
              parentId={node.id}
              index={i}
              root={root}
              locale={locale}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onDropNew={onDropNew}
              onDropMove={onDropMove}
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
        <Row {...props} node={props.root} depth={0} parentId={null} index={0} />
      </div>
    </div>
  );
};

export default LayersPanel;
