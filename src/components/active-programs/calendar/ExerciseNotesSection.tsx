
import React, { useRef, useEffect, useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from 'lucide-react';

interface ExerciseNotesSectionProps {
  notes: string;
  workoutInProgress: boolean;
  onNotesChange: (value: string) => void;
  onClearData: () => void;
  hasData: boolean;
  exercise: any;
}

export const ExerciseNotesSection: React.FC<ExerciseNotesSectionProps> = ({
  notes,
  workoutInProgress,
  onNotesChange,
  onClearData,
  hasData,
  exercise
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState('auto');
  
  useEffect(() => {
    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        // Reset height to auto to properly calculate the new height
        textarea.style.height = 'auto';
        // Set the new height based on scrollHeight
        const newHeight = Math.max(20, textarea.scrollHeight); // minimum 20px
        textarea.style.height = `${newHeight}px`;
        setTextareaHeight(`${newHeight}px`);
        
        // Find all divider cells and set their height to match
        const gridCells = textarea.closest('.grid')?.querySelectorAll('.flex.items-stretch');
        if (gridCells) {
          gridCells.forEach(cell => {
            (cell as HTMLElement).style.height = `${newHeight}px`;
          });
        }
      }
    };
    
    adjustHeight();
    
    // Re-adjust when notes change
    if (textareaRef.current) {
      textareaRef.current.addEventListener('input', adjustHeight);
    }
    
    return () => {
      if (textareaRef.current) {
        textareaRef.current.removeEventListener('input', adjustHeight);
      }
    };
  }, [notes]);

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-600">Notes</label>
            {hasData && (
              <button
                onClick={onClearData}
                className="text-red-500 hover:text-red-700 p-0.5"
                disabled={!workoutInProgress}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <Textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={workoutInProgress ? "Προσθήκη σημειώσεων..." : "Πάτησε έναρξη για σημειώσεις"}
            className="min-h-[20px] text-xs rounded-none resize-none flex-1"
            disabled={!workoutInProgress}
            rows={1}
            style={{ height: textareaHeight }}
          />
        </div>
      </div>

      {exercise.notes && (
        <div className="p-1 bg-blue-50 border border-blue-200 rounded-none">
          <p className="text-xs text-blue-800 font-medium">Program Notes:</p>
          <p className="text-xs text-blue-700">{exercise.notes}</p>
        </div>
      )}
    </div>
  );
};
