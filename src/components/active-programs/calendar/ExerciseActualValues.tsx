
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getWorkoutData, saveWorkoutData } from '@/hooks/useWorkoutCompletions/workoutDataService';

interface ExerciseActualValuesProps {
  exercise: any;
  workoutInProgress: boolean;
  updateReps: (exerciseId: string, reps: number) => void;
  updateKg: (exerciseId: string, kg: string) => void;
  updateVelocity: (exerciseId: string, velocity: number) => void;
  getNotes: (exerciseId: string) => string;
  updateNotes: (exerciseId: string, notes: string) => void;
  selectedDate?: Date;
  program?: any;
  onSetClick?: (exerciseId: string, totalSets: number) => void;
  getRemainingText?: (exerciseId: string, totalSets: number) => string;
  isExerciseComplete?: (exerciseId: string, totalSets: number) => boolean;
}

export const ExerciseActualValues: React.FC<ExerciseActualValuesProps> = ({
  exercise,
  workoutInProgress,
  updateReps,
  updateKg,
  updateVelocity,
  getNotes,
  updateNotes,
  selectedDate,
  program,
  onSetClick,
  getRemainingText,
  isExerciseComplete
}) => {
  const [actualKg, setActualKg] = useState('');
  const [actualReps, setActualReps] = useState('');
  const [actualVelocity, setActualVelocity] = useState('');
  const [calculatedPercentage, setCalculatedPercentage] = useState('');
  const notes = getNotes(exercise.id);
  const [textareaHeight, setTextareaHeight] = useState('auto');
  
  // Get the remaining sets text if function is provided
  const remainingText = getRemainingText ? getRemainingText(exercise.id, exercise.sets) : '';
  const isComplete = isExerciseComplete ? isExerciseComplete(exercise.id, exercise.sets) : false;
  
  // Function to update textarea height
  const updateTextareaHeight = (height: string) => {
    setTextareaHeight(height);
  };

  // Load data from previous week
  useEffect(() => {
    if (selectedDate && program) {
      const data = getWorkoutData(selectedDate, program.id, exercise.id);
      if (data.kg) setActualKg(data.kg);
      if (data.reps) setActualReps(data.reps);
      if (data.velocity) setActualVelocity(data.velocity);
    }
  }, [selectedDate, program, exercise.id]);

  // Calculate percentage when actual kg changes
  useEffect(() => {
    if (actualKg && exercise.kg) {
      const plannedKg = parseFloat(exercise.kg);
      const actualKgNum = parseFloat(actualKg);
      const plannedPercentage = exercise.percentage_1rm || 0;
      
      if (plannedKg > 0 && actualKgNum > 0 && plannedPercentage > 0) {
        // Calculate new percentage based on the ratio
        const newPercentage = (actualKgNum / plannedKg) * plannedPercentage;
        setCalculatedPercentage(Math.round(newPercentage).toString());
      } else {
        setCalculatedPercentage('');
      }
    } else {
      setCalculatedPercentage('');
    }
  }, [actualKg, exercise.kg, exercise.percentage_1rm]);

  const handleKgChange = (value: string) => {
    setActualKg(value);
    if (workoutInProgress) {
      updateKg(exercise.id, value);
    }
    
    if (selectedDate && program) {
      saveWorkoutData(selectedDate, program.id, exercise.id, { kg: value });
    }
  };

  const handleRepsChange = (value: string) => {
    setActualReps(value);
    if (workoutInProgress) {
      updateReps(exercise.id, parseInt(value) || 0);
    }
    
    if (selectedDate && program) {
      saveWorkoutData(selectedDate, program.id, exercise.id, { reps: value });
    }
  };

  const handleVelocityChange = (value: string) => {
    setActualVelocity(value);
    if (workoutInProgress) {
      updateVelocity(exercise.id, parseFloat(value) || 0);
    }
    
    if (selectedDate && program) {
      saveWorkoutData(selectedDate, program.id, exercise.id, { velocity: value });
    }
  };

  const handleNotesChange = (value: string) => {
    updateNotes(exercise.id, value);
    
    if (selectedDate && program) {
      saveWorkoutData(selectedDate, program.id, exercise.id, { notes: value });
    }
  };

  const handleSetClick = () => {
    if (onSetClick && workoutInProgress) {
      onSetClick(exercise.id, exercise.sets);
    }
  };

  return (
    <div className="grid grid-cols-8 gap-0.5 text-xs">
      <div 
        onClick={handleSetClick}
        className={`text-center flex items-stretch h-full cursor-pointer ${
          workoutInProgress ? 'bg-[#00ffba]/20 hover:bg-[#00ffba]/30' : 'bg-gray-200'
        } ${isComplete ? 'bg-[#00ffba]/50' : ''} rounded-none`}
      >
        <div className="px-1 py-0.5 text-xs flex-1 flex items-center justify-center">
          {isComplete ? '✓' : remainingText.replace(' sets remaining', '')}
        </div>
      </div>
      <div className="text-center">
        <Input
          type="number"
          value={actualReps}
          onChange={(e) => handleRepsChange(e.target.value)}
          className="h-5 text-xs rounded-none text-center p-0 text-red-600 font-medium no-spinners"
          placeholder={exercise.reps || ''}
          disabled={!workoutInProgress}
        />
      </div>
      <div className="text-center">
        {calculatedPercentage ? (
          <div className="bg-red-50 px-1 py-0.5 rounded-none text-xs text-red-600 font-medium">
            {calculatedPercentage}%
          </div>
        ) : (
          <div className="bg-gray-200 px-1 py-0.5 rounded-none text-xs">-</div>
        )}
      </div>
      <div className="text-center">
        <Input
          type="number"
          step="0.5"
          value={actualKg}
          onChange={(e) => handleKgChange(e.target.value)}
          className="h-5 text-xs rounded-none text-center p-0 text-red-600 font-medium no-spinners"
          placeholder={exercise.kg || ''}
          disabled={!workoutInProgress}
        />
      </div>
      <div className="text-center">
        <Input
          type="number"
          step="0.01"
          value={actualVelocity}
          onChange={(e) => handleVelocityChange(e.target.value)}
          className="h-5 text-xs rounded-none text-center p-0 text-red-600 font-medium no-spinners"
          placeholder={exercise.velocity_ms || ''}
          disabled={!workoutInProgress}
        />
      </div>
      <div className="text-center flex items-stretch h-full">
        <div className="bg-gray-200 px-1 py-0.5 rounded-none text-xs flex-1 flex items-center justify-center">-</div>
      </div>
      <div className="text-center flex items-stretch h-full">
        <div className="bg-gray-200 px-1 py-0.5 rounded-none text-xs flex-1 flex items-center justify-center">-</div>
      </div>
      <div className="col-span-1 text-center flex items-stretch h-full">
        <Textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder={workoutInProgress ? "Notes..." : ""}
          className="h-full min-h-0 text-xs rounded-none resize-none p-0.5 text-red-600 font-medium text-center"
          disabled={!workoutInProgress}
          rows={1}
          style={{ height: textareaHeight }}
        />
      </div>
    </div>
  );
};
