
import React, { useState, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from 'lucide-react';
import { format, subDays } from "date-fns";

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
      const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Ελέγχουμε αν υπάρχουν notes από την προηγούμενη εβδομάδα
      const previousWeekDate = subDays(selectedDate, 7);
      const previousWeekDateStr = format(previousWeekDate, 'yyyy-MM-dd');
      const previousWeekKey = `${previousWeekDateStr}-${exerciseId}`;
      
      // Προσπαθούμε να βρούμε τα notes στο localStorage ή στο state
      const savedNotes = localStorage.getItem(`exercise-notes-${previousWeekKey}`);
      if (savedNotes && savedNotes.trim()) {
        console.log(`📝 Φόρτωση notes από προηγούμενη εβδομάδα για άσκηση ${exerciseId}:`, savedNotes);
        setNotes(savedNotes);
        onNotesChange(exerciseId, savedNotes);
      }
    }
  }, [selectedDate, program, exerciseId, initialNotes, onNotesChange]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    onNotesChange(exerciseId, value);
    
    // Αποθηκεύουμε τα notes και στο localStorage για backup
    if (selectedDate) {
      const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
      const storageKey = `exercise-notes-${currentDateStr}-${exerciseId}`;
      localStorage.setItem(storageKey, value);
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
                
                // Καθαρισμός και από το localStorage
                if (selectedDate) {
                  const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
                  const storageKey = `exercise-notes-${currentDateStr}-${exerciseId}`;
                  localStorage.removeItem(storageKey);
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
