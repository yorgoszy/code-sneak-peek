import React, { useCallback, useEffect, useRef, useState } from 'react';
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

  const isPointInsideZone = useCallback((clientX: number, clientY: number) => {
    const el = zoneRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return (
      clientX >= r.left - 28 &&
      clientX <= r.right + 28 &&
      clientY >= r.top - 28 &&
      clientY <= r.bottom + 28
    );
  }, []);

  useEffect(() => {
    const onStart = (e: Event) => {
      setActive(true);
      const detail = (e as CustomEvent).detail as PendingDrop | undefined;
      if (detail) currentDropRef.current = detail;
    };

    const onMove = (e: Event) => {
      const detail = (e as CustomEvent).detail as (PendingDrop & { clientX?: number; clientY?: number }) | undefined;
      if (!detail || typeof detail.clientX !== 'number' || typeof detail.clientY !== 'number') return;

      currentDropRef.current = {
        assignmentId: detail.assignmentId,
        date: detail.date,
        userName: detail.userName,
      };
      const inside = isPointInsideZone(detail.clientX, detail.clientY);
      overRef.current = inside;
      setOver(inside);
    };

    const onEnd = (e: Event) => {
      const detail = (e as CustomEvent).detail as (PendingDrop & { clientX?: number; clientY?: number }) | undefined;
      const drop = detail?.assignmentId
        ? { assignmentId: detail.assignmentId, date: detail.date, userName: detail.userName }
        : currentDropRef.current;
      const insideByPoint =
        detail && typeof detail.clientX === 'number' && typeof detail.clientY === 'number'
          ? isPointInsideZone(detail.clientX, detail.clientY)
          : false;

      if (drop && (overRef.current || insideByPoint)) {
        onHide?.(drop);
      }
      setActive(false);
      setOver(false);
      overRef.current = false;
      currentDropRef.current = null;
    };

    window.addEventListener('bubble-drag-start', onStart as EventListener);
    window.addEventListener('bubble-drag-move', onMove as EventListener);
    window.addEventListener('bubble-drag-end', onEnd as EventListener);

    return () => {
      window.removeEventListener('bubble-drag-start', onStart as EventListener);
      window.removeEventListener('bubble-drag-move', onMove as EventListener);
      window.removeEventListener('bubble-drag-end', onEnd as EventListener);
    };
  }, [isPointInsideZone, onHide]);

  if (!active) return null;

  return (
    <div
      ref={zoneRef}
      className={`fixed left-1/2 top-1/2 z-[9999] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-2 border-2 border-dashed text-white transition-all duration-150 ${
        over
          ? 'h-56 w-56 scale-110 bg-red-600/90 border-white'
          : 'h-44 w-44 bg-black/85 border-white'
      }`}
      title="Σύρε εδώ ένα bubble για απόκρυψη"
    >
      <EyeOff className="h-12 w-12" />
      <span className="px-2 text-center text-sm font-semibold">
        {over ? 'Άφησε για απόκρυψη' : 'Σύρε εδώ'}
      </span>
    </div>
  );
};
