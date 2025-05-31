
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Copy } from "lucide-react";
import { Exercise } from '../types';
import { ExerciseSelectionDialog } from './ExerciseSelectionDialog';

interface ProgramExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  percentage_1rm: number;
  kg: string;
  velocity_ms: string;
  tempo: string;
  rest: string;
  exercise_order: number;
}

interface ExerciseRowProps {
  exercise: ProgramExercise;
  exercises: Exercise[];
  allBlockExercises: ProgramExercise[];
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export const ExerciseRow: React.FC<ExerciseRowProps> = ({
  exercise,
  exercises,
  allBlockExercises,
  onUpdate,
  onRemove,
  onDuplicate
}) => {
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);

  const handleExerciseSelect = (exerciseId: string) => {
    onUpdate('exercise_id', exerciseId);
    setShowExerciseDialog(false);
  };

  const selectedExercise = exercises.find(ex => ex.id === exercise.exercise_id);
  
  // Calculate exercise number for this specific exercise
  const getExerciseNumber = () => {
    const sameExercises = allBlockExercises
      .filter(ex => ex.exercise_id === exercise.exercise_id && ex.exercise_id)
      .sort((a, b) => a.exercise_order - b.exercise_order);
    
    const currentIndex = sameExercises.findIndex(ex => ex.id === exercise.id);
    return sameExercises.length > 1 ? currentIndex + 1 : null;
  };

  const exerciseNumber = getExerciseNumber();

  return (
    <>
      <div className="border-0 border-b w-full" style={{ fontSize: '12px', backgroundColor: '#545454' }}>
        {/* Exercise Name Row with Actions */}
        <div className="p-2 border-b bg-gray-50 flex items-center gap-2 w-full" style={{ minHeight: '28px' }}>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-sm h-6 justify-start px-2"
            style={{ borderRadius: '0px', fontSize: '12px' }}
            onClick={() => setShowExerciseDialog(true)}
          >
            {selectedExercise ? (
              <span className="flex items-center gap-1">
                {exerciseNumber && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded-sm mr-1">
                    {exerciseNumber}
                  </span>
                )}
                {selectedExercise.name}
              </span>
            ) : 'Επιλογή...'}
          </Button>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              className="p-1 h-6 w-6"
              style={{ borderRadius: '0px' }}
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="p-1 h-6 w-6"
              style={{ borderRadius: '0px' }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {/* Exercise Details Row - Using flex with fixed widths to align with headers */}
        <div className="flex p-2 gap-2 w-full" style={{ minHeight: '28px' }}>
          <div className="flex flex-col items-center" style={{ width: '60px' }}>
            <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Sets</label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={exercise.sets || ''}
              onChange={(e) => onUpdate('sets', parseInt(e.target.value) || '')}
              className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full"
              style={{ 
                borderRadius: '0px', 
                fontSize: '12px', 
                height: '22px', 
                padding: '0 4px'
              }}
              placeholder=""
            />
          </div>
          
          <div className="flex flex-col items-center" style={{ width: '60px' }}>
            <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Reps</label>
            <Input
              value={exercise.reps}
              onChange={(e) => onUpdate('reps', e.target.value)}
              className="text-center w-full"
              style={{ 
                borderRadius: '0px', 
                fontSize: '12px', 
                height: '22px', 
                padding: '0 4px'
              }}
              placeholder=""
            />
          </div>
          
          <div className="flex flex-col items-center" style={{ width: '60px' }}>
            <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>%1RM</label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={exercise.percentage_1rm || ''}
              onChange={(e) => onUpdate('percentage_1rm', parseFloat(e.target.value) || '')}
              className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full"
              style={{ 
                borderRadius: '0px', 
                fontSize: '12px', 
                height: '22px', 
                padding: '0 4px'
              }}
              placeholder=""
            />
          </div>
          
          <div className="flex flex-col items-center" style={{ width: '60px' }}>
            <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Kg</label>
            <Input
              value={exercise.kg}
              onChange={(e) => onUpdate('kg', e.target.value)}
              className="text-center w-full"
              style={{ 
                borderRadius: '0px', 
                fontSize: '12px', 
                height: '22px', 
                padding: '0 4px'
              }}
              placeholder=""
            />
          </div>
          
          <div className="flex flex-col items-center" style={{ width: '60px' }}>
            <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>m/s</label>
            <Input
              value={exercise.velocity_ms}
              onChange={(e) => onUpdate('velocity_ms', e.target.value)}
              className="text-center w-full"
              style={{ 
                borderRadius: '0px', 
                fontSize: '12px', 
                height: '22px', 
                padding: '0 4px'
              }}
              placeholder=""
            />
          </div>
          
          <div className="flex flex-col items-center" style={{ width: '60px' }}>
            <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Tempo</label>
            <Input
              value={exercise.tempo}
              onChange={(e) => onUpdate('tempo', e.target.value)}
              className="text-center w-full"
              style={{ 
                borderRadius: '0px', 
                fontSize: '12px', 
                height: '22px', 
                padding: '0 4px'
              }}
              placeholder="1.1.1"
            />
          </div>
          
          <div className="flex flex-col items-center" style={{ width: '50px' }}>
            <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Rest</label>
            <Input
              value={exercise.rest}
              onChange={(e) => onUpdate('rest', e.target.value)}
              className="text-center w-full"
              style={{ 
                borderRadius: '0px', 
                fontSize: '12px', 
                height: '22px', 
                padding: '0 4px'
              }}
              placeholder=""
            />
          </div>
        </div>
      </div>

      <ExerciseSelectionDialog
        open={showExerciseDialog}
        onOpenChange={setShowExerciseDialog}
        exercises={exercises}
        onSelectExercise={handleExerciseSelect}
      />
    </>
  );
};
