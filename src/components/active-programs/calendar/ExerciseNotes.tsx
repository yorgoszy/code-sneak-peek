
import React, { useState, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from 'lucide-react';
import { getWorkoutData, saveWorkoutData, clearWorkoutData } from '@/hooks/useWorkoutCompletions/workoutDataService';

interface ExerciseNotesProps {
  exerciseId: string;
  initialNotes?: string;
  workoutInProgress: boolean;
  onNotesChange: (exerciseId: string, notes: string) => void;
  onClearNotes: (exerciseId: string) => void;
  selectedDate?: Date;
  program?: any;
}

export const ExerciseNotes: React.FC<ExerciseNotesProps> = ({
  exerciseId,
  initialNotes = '',
  workoutInProgress,
  onNotesChange,
  onClearNotes,
  selectedDate,
  program
}) => {
  const [notes, setNotes] = useState(initialNotes);

  // Προσπαθούμε να φορτώσουμε notes από την προηγούμενη εβδομάδα
  useEffect(() => {
    if (selectedDate && program && !initialNotes) {
      const data = getWorkoutData(selectedDate, program.id, exerciseId);
      if (data.notes && data.notes.trim()) {
        console.log(`📝 Φόρτωση notes από προηγούμενη εβδομάδα για άσκηση ${exerciseId}:`, data.notes);
        setNotes(data.notes);
        onNotesChange(exerciseId, data.notes);
      }
    }
  }, [selectedDate, program, exerciseId, initialNotes, onNotesChange]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    onNotesChange(exerciseId, value);
    
    // Αποθηκεύουμε τα notes
    if (selectedDate && program) {
      saveWorkoutData(selectedDate, program.id, exerciseId, { notes: value });
    }
  };

  return (
    <div className="flex-1 p-1 bg-gray-50 border-l border-gray-200">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-600">Notes</label>
          {notes && (
            <button
              onClick={() => {
                setNotes('');
                onClearNotes(exerciseId);
                
                // Καθαρισμός από το storage
                if (selectedDate && program) {
                  clearWorkoutData(selectedDate, program.id, exerciseId);
                }
              }}
              className="text-red-500 hover:text-red-700 p-0.5"
              disabled={!workoutInProgress}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <Textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder={workoutInProgress ? "Προσθήκη σημειώσεων..." : "Πάτησε έναρξη για σημειώσεις"}
          className="min-h-[36px] text-xs rounded-none resize-none"
          disabled={!workoutInProgress}
        />
      </div>
    </div>
  );
};
