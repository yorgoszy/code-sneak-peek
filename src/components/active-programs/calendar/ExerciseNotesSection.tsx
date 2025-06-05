
import React from 'react';
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
  return (
    <div className="space-y-2">
      {/* Notes */}
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
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={workoutInProgress ? "Προσθήκη σημειώσεων..." : "Πάτησε έναρξη για σημειώσεις"}
            className="min-h-[24px] text-xs rounded-none resize-none"
            disabled={!workoutInProgress}
            rows={1}
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
