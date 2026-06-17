import React from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SECTION_LABELS, type LandingSection, type Lang } from '@/hooks/useLandingConfig';
import { cn } from '@/lib/utils';

interface Props {
  sections: LandingSection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: () => void;
  lang: Lang;
}

const Row: React.FC<{
  s: LandingSection; selected: boolean; lang: Lang;
  onSelect: () => void; onToggle: () => void;
}> = ({ s, selected, onSelect, onToggle, lang }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const label = SECTION_LABELS[s.section_key]?.[lang] ?? s.section_key;
  return (
    <div ref={setNodeRef} style={style}
      className={cn(
        'flex items-center gap-2 px-2 py-2 border border-border bg-background cursor-pointer',
        selected && 'ring-2 ring-foreground',
        !s.is_visible && 'opacity-50'
      )}
      onClick={onSelect}
    >
      <button {...attributes} {...listeners} className="cursor-grab p-1" onClick={(e) => e.stopPropagation()}>
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      <span className="text-xs text-muted-foreground w-6">{s.display_order}</span>
      <span className="text-sm flex-1 truncate">{label}</span>
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-1">
        {s.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
      </button>
    </div>
  );
};

export const SectionsList: React.FC<Props> = ({ sections, selectedId, onSelect, onChange, lang }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex((s) => s.id === active.id);
    const newIdx = sections.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(sections, oldIdx, newIdx);
    await Promise.all(
      reordered.map((s, i) =>
        supabase.from('landing_sections' as any).update({ display_order: i + 1 }).eq('id', s.id),
      ),
    );
    onChange();
  };

  const toggleVisible = async (s: LandingSection) => {
    await supabase.from('landing_sections' as any)
      .update({ is_visible: !s.is_visible }).eq('id', s.id);
    onChange();
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {sections.map((s) => (
            <Row key={s.id} s={s} selected={s.id === selectedId}
              lang={lang}
              onSelect={() => onSelect(s.id)}
              onToggle={() => toggleVisible(s)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
