
import React, { useState, useEffect } from 'react';
import { Exercise, ProgramExercise } from '../types';
import { ExerciseSelectionDialog } from './ExerciseSelectionDialog';
import { ExerciseSelectionButton } from './ExerciseSelectionButton';
import { ExerciseDetailsForm } from './ExerciseDetailsForm';
import { useExerciseInputHandlers } from './hooks/useExerciseInputHandlers';
import { calculateExerciseNumber } from './utils/exerciseNumberCalculator';
import { useExercise1RM } from '@/hooks/useExercise1RM';

interface ExerciseRowProps {
  exercise: ProgramExercise;
  exercises: Exercise[];
  allBlockExercises: ProgramExercise[];
  selectedUserId?: string;
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onExercisesUpdate?: (exercises: Exercise[]) => void;
}

export const ExerciseRow: React.FC<ExerciseRowProps> = ({
  exercise,
  exercises,
  allBlockExercises,
  selectedUserId,
  onUpdate,
  onRemove,
  onDuplicate,
  onExercisesUpdate
}) => {
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  
  const { handleVelocityChange, handleKgChange, handlePercentageChange } = useExerciseInputHandlers({ onUpdate });

  // Fetch 1RM for selected user and exercise
  const { oneRM, loading: oneRMLoading } = useExercise1RM({
    userId: selectedUserId || null,
    exerciseId: exercise.exercise_id || null
  });

  console.log('🎯 ExerciseRow - selectedUserId:', selectedUserId, 'exercise_id:', exercise.exercise_id, 'oneRM:', oneRM, 'loading:', oneRMLoading, 'current kg:', exercise.kg);

  // Auto-fill kg field with 1RM when exercise is selected and kg is empty
  // ΔΕΝ τρέχει αν υπάρχει percentage_1rm (θα υπολογιστεί από το δεύτερο useEffect)
  useEffect(() => {
    // Αν υπάρχει percentage_1rm, αφήνουμε το δεύτερο useEffect να κάνει τον υπολογισμό
    const hasPercentage = exercise.percentage_1rm && 
      parseFloat(exercise.percentage_1rm.toString().replace(',', '.')) > 0;
    
    if (oneRM && exercise.exercise_id && !exercise.kg && !hasPercentage) {
      console.log('🏋️ Auto-filling 1RM:', oneRM, 'kg for exercise:', exercise.exercise_id);
      onUpdate('kg', oneRM.toString().replace('.', ','));
    }
  }, [oneRM, exercise.exercise_id, exercise.kg, exercise.percentage_1rm]);

  // Auto-calculate kg based on %1RM - ALWAYS recalculate when user changes or 1RM changes
  // Περιμένουμε το loading να ολοκληρωθεί για να έχουμε σωστό 1RM
  useEffect(() => {
    // Δεν κάνουμε τίποτα όσο το 1RM φορτώνει
    if (oneRMLoading) {
      console.log('⏳ Waiting for 1RM to load for user:', selectedUserId);
      return;
    }
    
    if (exercise.percentage_1rm) {
      const percentage = parseFloat(exercise.percentage_1rm.toString().replace(',', '.'));
      if (!isNaN(percentage) && percentage > 0) {
        if (oneRM) {
          const calculatedKg = (oneRM * percentage) / 100;
          
          // Κλασική στρογγυλοποίηση (0.5+ πάνω, <0.5 κάτω)
          let roundedWeight = Math.round(calculatedKg);
          
          // Διασφάλιση ότι είναι άρτιος αριθμός
          if (roundedWeight % 2 !== 0) {
            const lowerEven = roundedWeight - 1;
            const upperEven = roundedWeight + 1;
            if (Math.abs(calculatedKg - lowerEven) < Math.abs(calculatedKg - upperEven)) {
              roundedWeight = lowerEven;
            } else {
              roundedWeight = upperEven;
            }
          }
          
          console.log('📊 Auto-calculating kg from %1RM:', percentage, '% of', oneRM, '=', calculatedKg, 'kg → rounded to', roundedWeight, 'kg (user:', selectedUserId, ')');
          onUpdate('kg', roundedWeight.toString().replace('.', ','));
        } else {
          // Αν δεν υπάρχει 1RM για τον νέο χρήστη, καθαρίζουμε το kg
          console.log('📊 No 1RM found for user:', selectedUserId, '- clearing kg');
          onUpdate('kg', '');
        }
      }
    }
  }, [oneRM, oneRMLoading, exercise.percentage_1rm, selectedUserId]);

  const handleExerciseSelect = (exerciseId: string) => {
    onUpdate('exercise_id', exerciseId);
    setShowExerciseDialog(false);
  };

  const selectedExercise = exercises.find(ex => ex.id === exercise.exercise_id);
  const exerciseNumber = calculateExerciseNumber(exercise, allBlockExercises);

  return (
    <>
      <div className="bg-white border-0 border-b w-full" style={{ fontSize: '12px' }}>
        <ExerciseSelectionButton
          selectedExercise={selectedExercise}
          exerciseNumber={exerciseNumber}
          allExercises={exercises}
          onSelectExercise={() => setShowExerciseDialog(true)}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
          onReplaceExercise={(newExerciseId) => onUpdate('exercise_id', newExerciseId)}
        />
        
        <ExerciseDetailsForm
          exercise={exercise}
          onUpdate={onUpdate}
          onVelocityChange={handleVelocityChange}
          onKgChange={handleKgChange}
          onPercentageChange={handlePercentageChange}
        />
      </div>

      <ExerciseSelectionDialog
        open={showExerciseDialog}
        onOpenChange={setShowExerciseDialog}
        exercises={exercises}
        onSelectExercise={handleExerciseSelect}
        onExercisesUpdate={onExercisesUpdate}
      />
    </>
  );
};
