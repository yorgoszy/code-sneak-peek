import React, { useEffect, useRef, useState } from 'react';
import { EyeOff } from 'lucide-react';

interface PendingDrop {
  assignmentId: string;
  date: string;
  userName: string;
}

interface Props {
  onHide?: (drop: PendingDrop) => void;
}

export const BubbleTrashDropZone: React.FC<Props> = ({ onHide }) => {
  const [active, setActive] = useState(false);
  const [over, setOver] = useState(false);
  const zoneRef = useRef<HTMLDivElement>(null);
  const currentDropRef = useRef<PendingDrop | null>(null);
  const overRef = useRef(false);

  useEffect(() => {
    const onStart = (e: Event) => {
      setActive(true);
      const detail = (e as CustomEvent).detail as PendingDrop | undefined;
      if (detail) currentDropRef.current = detail;
    };
    const onEnd = () => {
      // If the last dragover was on the trash zone, treat as hide.
      if (overRef.current && currentDropRef.current) {
        onHide?.(currentDropRef.current);
      }
      setActive(false);
      setOver(false);
      overRef.current = false;
      currentDropRef.current = null;
    };

    // Track pointer position globally — needed because native drop fires only
    // if the cursor is exactly over the zone at release time.
    const onDragOverWindow = (e: DragEvent) => {
      e.preventDefault();
      const el = zoneRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const inside =
        e.clientX >= r.left - 20 &&
        e.clientX <= r.right + 20 &&
        e.clientY >= r.top - 20 &&
        e.clientY <= r.bottom + 20;
      overRef.current = inside;
      setOver(inside);
    };

    window.addEventListener('bubble-drag-start', onStart as EventListener);
    window.addEventListener('bubble-drag-end', onEnd);
    window.addEventListener('dragover', onDragOverWindow);
    window.addEventListener('drop', (e) => e.preventDefault());

    return () => {
      window.removeEventListener('bubble-drag-start', onStart as EventListener);
      window.removeEventListener('bubble-drag-end', onEnd);
      window.removeEventListener('dragover', onDragOverWindow);
    };
  }, [onHide]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/x-bubble');
    if (raw) {
      try {
        const data = JSON.parse(raw) as PendingDrop;
        onHide?.(data);
      } catch {
        /* ignore */
      }
    } else if (currentDropRef.current) {
      onHide?.(currentDropRef.current);
    }
    setActive(false);
    setOver(false);
    overRef.current = false;
    currentDropRef.current = null;
  };

  return (
    <div
      ref={zoneRef}
      onDragOver={(e) => {
        e.preventDefault();
        overRef.current = true;
        setOver(true);
      }}
      onDragLeave={() => {
        overRef.current = false;
        setOver(false);
      }}
      onDrop={handleDrop}
      className={`fixed z-[9999] flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-all duration-200 ${
        active
          ? over
            ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-red-600/90 border-white text-white scale-110'
            : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-black/85 border-white text-white'
          : 'bottom-6 right-6 w-16 h-16 bg-black/70 border-white/70 text-white hover:bg-black/90'
      }`}
      title="Σύρε εδώ ένα bubble για απόκρυψη"
    >
      <EyeOff className={active ? 'w-12 h-12' : 'w-6 h-6'} />
      {active && (
        <span className="text-sm font-semibold text-center px-2">
          {over ? 'Άφησε για απόκρυψη' : 'Σύρε εδώ'}
        </span>
      )}
    </div>
  );
};
