import React from 'react';

interface ProgramBubbleData {
  date: string;
  status: string;
  assignmentId: string;
  userName: string;
  rpeScore?: number | null;
}

interface ProgramBubbleItemProps {
  program: ProgramBubbleData;
  label: string;
  nameClassName: string;
  containerClassName?: string;
  rpeClassName?: string;
  rpePrefix?: string;
  onNameClick: (event: React.MouseEvent) => void;
}

const getBubbleColor = (status: string, workoutDate: string) => {
  const today = new Date();
  const workoutDateObj = new Date(workoutDate);
  const isPast = workoutDateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (status === 'completed') return 'bg-[#00ffba] border-[#00ffba]';
  if (status === 'missed' || isPast) return 'bg-red-500 border-red-500';
  return 'bg-blue-500 border-blue-500';
};

export const ProgramBubbleItem: React.FC<ProgramBubbleItemProps> = ({
  program,
  label,
  nameClassName,
  containerClassName = '',
  rpeClassName = '',
  rpePrefix = '',
  onNameClick,
}) => {
  const startBubbleDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const payload = {
      assignmentId: program.assignmentId,
      date: program.date,
      userName: program.userName,
    };
    const startX = e.clientX;
    const startY = e.clientY;
    let lastX = e.clientX;
    let lastY = e.clientY;
    let moved = false;

    window.dispatchEvent(new CustomEvent('bubble-drag-start', { detail: payload }));

    const cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    const handlePointerMove = (event: PointerEvent) => {
      lastX = event.clientX;
      lastY = event.clientY;
      const distance = Math.abs(lastX - startX) + Math.abs(lastY - startY);
      if (distance > 4) moved = true;
      if (!moved) return;

      window.dispatchEvent(new CustomEvent('bubble-drag-move', {
        detail: { ...payload, clientX: lastX, clientY: lastY },
      }));
    };

    const handlePointerUp = (event: PointerEvent) => {
      lastX = event.clientX;
      lastY = event.clientY;
      window.dispatchEvent(new CustomEvent('bubble-drag-end', {
        detail: { ...payload, clientX: lastX, clientY: lastY },
      }));
      cleanup();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  return (
    <div className={`flex min-w-0 items-center gap-1 ${containerClassName}`}>
      <button
        type="button"
        aria-label={`Μετακίνηση bubble ${program.userName}`}
        className={`h-3.5 w-3.5 flex-shrink-0 cursor-grab rounded-full border-2 active:cursor-grabbing touch-none ${getBubbleColor(program.status, program.date)}`}
        onPointerDown={startBubbleDrag}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      <button
        type="button"
        className={`min-w-0 truncate text-left hover:underline ${nameClassName}`}
        onClick={(e) => {
          e.stopPropagation();
          onNameClick(e);
        }}
      >
        {label}
      </button>

      {program.status === 'completed' && program.rpeScore && (
        <span className={rpeClassName}>
          {rpePrefix}{program.rpeScore}
        </span>
      )}
    </div>
  );
};