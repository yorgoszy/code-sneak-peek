
import React from 'react';
import { MinimizedProgramBubble } from './MinimizedProgramBubble';
import { useMinimizedPrograms } from '@/hooks/useMinimizedPrograms';

interface MinimizedProgramsSidebarProps {
  onRestoreProgram: (programId: string) => void;
}

export const MinimizedProgramsSidebar: React.FC<MinimizedProgramsSidebarProps> = ({
  onRestoreProgram
}) => {
  const { minimizedPrograms, removeMinimizedProgram } = useMinimizedPrograms();

  if (minimizedPrograms.length === 0) {
    return null;
  }

  return (
    <div className="w-64 bg-gray-50 border-l border-gray-200 p-3">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
        Ελαχιστοποιημένα Προγράμματα
      </h3>
      
      <div className="space-y-2">
        {minimizedPrograms.map((minimizedProgram) => (
          <MinimizedProgramBubble
            key={minimizedProgram.id}
            program={minimizedProgram.program}
            selectedDate={minimizedProgram.selectedDate}
            workoutStatus={minimizedProgram.workoutStatus}
            onRestore={() => onRestoreProgram(minimizedProgram.id)}
            onClose={() => removeMinimizedProgram(minimizedProgram.id)}
          />
        ))}
      </div>
    </div>
  );
};
