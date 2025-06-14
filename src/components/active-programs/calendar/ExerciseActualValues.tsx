import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
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
  onSetClick?: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  getRemainingText?: (exerciseId: string, totalSets: number) => string;
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
  getRemainingText
}) => {
  const [actualKg, setActualKg] = useState('');
  const [actualReps, setActualReps] = useState('');
  const [actualVelocity, setActualVelocity] = useState('');
  const [calculatedPercentage, setCalculatedPercentage] = useState('');
  
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

  const handleSetClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onSetClick) {
      onSetClick(exercise.id, exercise.sets, event);
    }
  };

  const remainingText = getRemainingText ? getRemainingText(exercise.id, exercise.sets) : '';

  return (
    <div className="grid grid-cols-7 gap-0 text-[8px]">
      <div className="text-center">
        {workoutInProgress && onSetClick ? (
          <button
            onClick={handleSetClick}
            className="w-full h-3 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none text-[7px] font-medium cursor-pointer transition-colors px-0"
          >
            {remainingText}
          </button>
        ) : (
          <div className="bg-gray-200 px-0 py-0 rounded-none text-[7px] flex items-center justify-center h-3">-</div>
        )}
      </div>
      <div className="text-center">
        <Input
          type="number"
          value={actualReps}
          onChange={(e) => handleRepsChange(e.target.value)}
          className="h-3 text-[7px] rounded-none text-center p-0 px-0 text-red-600 font-medium no-spinners border-0"
          placeholder={exercise.reps || ''}
          disabled={!workoutInProgress}
        />
      </div>
      <div className="text-center">
        {calculatedPercentage ? (
          <div className="bg-red-50 px-0 py-0 rounded-none text-[7px] text-red-600 font-medium h-3 flex items-center justify-center">
            {calculatedPercentage}%
          </div>
        ) : (
          <div className="bg-gray-200 px-0 py-0 rounded-none text-[7px] h-3 flex items-center justify-center">-</div>
        )}
      </div>
      <div className="text-center">
        <Input
          type="number"
          step="0.5"
          value={actualKg}
          onChange={(e) => handleKgChange(e.target.value)}
          className="h-3 text-[7px] rounded-none text-center p-0 px-0 text-red-600 font-medium no-spinners border-0"
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
          className="h-3 text-[7px] rounded-none text-center p-0 px-0 text-red-600 font-medium no-spinners border-0"
          placeholder={exercise.velocity_ms || ''}
          disabled={!workoutInProgress}
        />
      </div>
      <div className="text-center flex items-stretch h-full">
        <div className="bg-gray-200 px-0 py-0 rounded-none text-[7px] flex-1 flex items-center justify-center">-</div>
      </div>
      <div className="text-center flex items-stretch h-full">
        <div className="bg-gray-200 px-0 py-0 rounded-none text-[7px] flex-1 flex items-center justify-center">-</div>
      </div>
    </div>
  );
};
