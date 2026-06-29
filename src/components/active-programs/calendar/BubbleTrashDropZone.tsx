import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    const onStart = () => setActive(true);
    const onEnd = () => {
      setActive(false);
      setOver(false);
    };
    window.addEventListener('bubble-drag-start', onStart);
    window.addEventListener('bubble-drag-end', onEnd);
    return () => {
      window.removeEventListener('bubble-drag-start', onStart);
      window.removeEventListener('bubble-drag-end', onEnd);
    };
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/x-bubble');
    setActive(false);
    setOver(false);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as PendingDrop;
      onHide?.(data);
    } catch {
      // ignore
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      className={`fixed z-[9999] flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-all duration-200 ${
        active
          ? over
            ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-black/90 border-white text-white scale-110'
            : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-black/85 border-white text-white'
          : 'bottom-6 right-6 w-16 h-16 bg-black/70 border-white/70 text-white hover:bg-black/90'
      }`}
      title="Σύρε εδώ ένα bubble για απόκρυψη"
    >
      <EyeOff className={active ? 'w-12 h-12' : 'w-6 h-6'} />
      {active && (
        <span className="text-sm font-semibold text-center px-2">
          Σύρε εδώ για απόκρυψη
        </span>
      )}
    </div>
  );
};
