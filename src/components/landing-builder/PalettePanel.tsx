import React from 'react';
import {
  LayoutTemplate, Box, Columns as ColumnsIcon, Heading as HeadingIcon,
  Type as TypeIcon, Image as ImageIcon, MousePointerClick, Minus, Video, Puzzle,
} from 'lucide-react';
import type { NodeType } from '@/hooks/useLandingTree';
import { CMS_SECTION_OPTIONS, type CmsSectionKey } from './CmsSectionRenderer';

export const DRAG_MIME_NEW = 'application/x-landing-new-node';
export const DRAG_MIME_MOVE = 'application/x-landing-move-node';
export const DRAG_MIME_CMS = 'application/x-landing-cms-key';

interface Item {
  type: NodeType;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const ITEMS: Item[] = [
  { type: 'section', label: 'Section', Icon: LayoutTemplate },
  { type: 'container', label: 'Container', Icon: Box },
  { type: 'columns', label: 'Columns', Icon: ColumnsIcon },
  { type: 'heading', label: 'Heading', Icon: HeadingIcon },
  { type: 'text', label: 'Text', Icon: TypeIcon },
  { type: 'button', label: 'Button', Icon: MousePointerClick },
  { type: 'image', label: 'Image', Icon: ImageIcon },
  { type: 'video', label: 'Video', Icon: Video },
  { type: 'spacer', label: 'Spacer', Icon: Minus },
];

export const PalettePanel: React.FC = () => {
  return (
    <div className="flex flex-col">
      <div className="p-3 border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
        Components
      </div>
      <div className="grid grid-cols-2 gap-1 p-2">
        {ITEMS.map(({ type, label, Icon }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(DRAG_MIME_NEW, type);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            className="flex flex-col items-center justify-center gap-1 p-2 border border-border bg-background hover:bg-muted cursor-grab active:cursor-grabbing select-none text-[11px]"
            title={`Drag to add ${label}`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-border text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
        <Puzzle className="w-3 h-3" /> CMS Sections
      </div>
      <div className="grid grid-cols-2 gap-1 p-2">
        {CMS_SECTION_OPTIONS.map(({ key, label }) => (
          <div
            key={key}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(DRAG_MIME_NEW, 'cms_section');
              e.dataTransfer.setData(DRAG_MIME_CMS, key as CmsSectionKey);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            className="flex items-center justify-center gap-1 px-1 py-2 border border-border bg-background hover:bg-muted cursor-grab active:cursor-grabbing select-none text-[10px] text-center"
            title={`Drag to add ${label} section`}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PalettePanel;
