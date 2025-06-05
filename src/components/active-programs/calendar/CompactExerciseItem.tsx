
import React, { useState, useEffect } from 'react';
import { getWorkoutData, saveWorkoutData, clearWorkoutData } from '@/hooks/useWorkoutCompletions/workoutDataService';
import { ExerciseHeader } from './ExerciseHeader';
import { ExerciseDetails } from './ExerciseDetails';
import { ExerciseActualValues } from './ExerciseActualValues';
import { ExerciseNotesSection } from './ExerciseNotesSection';

interface CompactExerciseItemProps {
  exercise: any;
  workoutInProgress: boolean;
  isComplete: boolean;
  remainingText: string;
  onExerciseClick: (exercise: any, event: React.MouseEvent) => void;
  onSetClick: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  onVideoClick: (exercise: any) => void;
  getNotes: (exerciseId: string) => string;
  updateNotes: (exerciseId: string, notes: string) => void;
  clearNotes: (exerciseId: string) => void;
  updateKg: (exerciseId: string, kg: string) => void;
  clearKg: (exerciseId: string) => void;
  updateVelocity: (exerciseId: string, velocity: number) => void;
  clearVelocity: (exerciseId: string) => void;
  updateReps: (exerciseId: string, reps: number) => void;
  clearReps: (exerciseId: string) => void;
  selectedDate?: Date;
  program?: any;
}

export const CompactExerciseItem: React.FC<CompactExerciseItemProps> = ({
  exercise,
  workoutInProgress,
  isComplete,
  remainingText,
  onSetClick,
  onVideoClick,
  updateKg,
  updateVelocity,
  updateReps,
  getNotes,
  updateNotes,
  clearNotes,
  selectedDate,
  program
}) => {
  const [actualKg, setActualKg] = useState('');
  const [actualReps, setActualReps] = useState('');
  const [actualVelocity, setActualVelocity] = useState('');
  const notes = getNotes(exercise.id);

  // Load data from previous week
  useEffect(() => {
    if (selectedDate && program) {
      const data = getWorkoutData(selectedDate, program.id, exercise.id);
      if (data.kg) setActualKg(data.kg);
      if (data.reps) setActualReps(data.reps);
      if (data.velocity) setActualVelocity(data.velocity);
    }
  }, [selectedDate, program, exercise.id]);

  const handleSetClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSetClick(exercise.id, exercise.sets, event);
  };

  const handleVideoClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onVideoClick(exercise);
  };

  const handleNotesChange = (value: string) => {
    updateNotes(exercise.id, value);
    
    if (selectedDate && program) {
      saveWorkoutData(selectedDate, program.id, exercise.id, { notes: value });
    }
  };

  const handleClearData = () => {
    setActualKg('');
    setActualReps('');
    setActualVelocity('');
    clearNotes(exercise.id);
    
    if (selectedDate && program) {
      clearWorkoutData(selectedDate, program.id, exercise.id);
    }
  };

  return (
    <div 
      className={`border border-gray-200 rounded-none transition-colors ${
        workoutInProgress ? 'hover:bg-gray-50' : 'bg-gray-100'
      } ${isComplete ? 'bg-green-50 border-green-200' : ''}`}
    >
      <ExerciseHeader
        exercise={exercise}
        isComplete={isComplete}
        remainingText={remainingText}
        workoutInProgress={workoutInProgress}
        onVideoClick={handleVideoClick}
        onSetClick={handleSetClick}
      />

      <div className="p-2 space-y-2">
        {/* Planned Values */}
        <ExerciseDetails exercise={exercise} />

        {/* Actual Values */}
        <ExerciseActualValues
          exercise={exercise}
          workoutInProgress={workoutInProgress}
          updateReps={updateReps}
          updateKg={updateKg}
          updateVelocity={updateVelocity}
          selectedDate={selectedDate}
          program={program}
        />

        {/* Notes Section */}
        <ExerciseNotesSection
          notes={notes}
          workoutInProgress={workoutInProgress}
          onNotesChange={handleNotesChange}
          onClearData={handleClearData}
          hasData={!!(notes || actualKg || actualReps || actualVelocity)}
          exercise={exercise}
        />
      </div>
    </div>
  );
};
