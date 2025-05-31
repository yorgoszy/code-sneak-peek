
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
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export const ExerciseRow: React.FC<ExerciseRowProps> = ({
  exercise,
  exercises,
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

  return (
    <>
      <div className="bg-white border-0 border-b w-full" style={{ fontSize: '9px' }}>
        {/* Exercise Name Row with Actions */}
        <div className="p-1 border-b bg-gray-50 flex items-center gap-1 w-full" style={{ minHeight: '20px' }}>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-4 justify-start px-1"
            style={{ borderRadius: '0px', fontSize: '9px' }}
            onClick={() => setShowExerciseDialog(true)}
          >
            {selectedExercise ? selectedExercise.name : 'Επιλογή...'}
          </Button>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              className="p-1 h-4 w-4"
              style={{ borderRadius: '0px' }}
            >
              <Copy className="w-2 h-2" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="p-1 h-4 w-4"
              style={{ borderRadius: '0px' }}
            >
              <Trash2 className="w-2 h-2" />
            </Button>
          </div>
        </div>
        
        {/* Exercise Details Row - Using flex with fixed widths to align with headers */}
        <div className="flex p-1 gap-1 w-full" style={{ minHeight: '20px' }}>
          <div className="flex flex-col items-center" style={{ width: '50px' }}>
            <label className="block mb-1 text-center w-full" style={{ fontSize: '8px', color: '#666' }}>Sets</label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={exercise.sets || ''}
              onChange={(e) => onUpdate('sets', parseInt(e.target.value) || '')}
              className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full"
              style={{ 
                borderRadius: '0px', 
                fontSize: '9px', 
                height: '18px', 
                padding: '0 2px'
              }}
              placeholder=""
            />
          </div>
          
          <div className="flex flex-col items-center" style={{ width: '50px' }}>
            <label className="block mb-1 text-center w-full" style={{ fontSize: '8px', color: '#666' }}>Reps</label>
            <Input
              value={exercise.reps}
              onChange={(e) => onUpdate('reps', e.target.value)}
              className="text-center w-full"
              style={{ 
                borderRadius: '0px', 
                fontSize: '9px', 
                height: '18px', 
                padding: '0 2px'
              }}
              placeholder=""
            />
          </div>
          
          <div className="flex flex-col items-center" style={{ width: '50px' }}>
            <label className="block mb-1 text-center w-full" style={{ fontSize: '8px', color: '#666' }}>%1RM</label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={exercise.percentage_1rm || ''}
              onChange={(e) => onUpdate('percentage_1rm', parseFloat(e.target.value) || '')}
              className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full"
              style={{ 
                borderRadius: '0px', 
                fontSize: '9px', 
                height: '18px', 
                padding: '0 2px'
              }}
              placeholder=""
            />
          </div>
          
          <div className="flex flex-col items-center" style={{ width: '50px' }}>
            <label className="block mb-1 text-center w-full" style={{ fontSize: '8px', color: '#666' }}>Kg</label>
            <Input
              value={exercise.kg}
              onChange={(e) => onUpdate('kg', e.target.value)}
              className="text-center w-full"
              style={{ 
                borderRadius: '0px', 
                fontSize: '9px', 
                height: '18px', 
                padding: '0 2px'
              }}
              placeholder=""
            />
          </div>
          
          <div className="flex flex-col items-center" style={{ width: '50px' }}>
            <label className="block mb-1 text-center w-full" style={{ fontSize: '8px', color: '#666' }}>m/s</label>
            <Input
              value={exercise.velocity_ms}
              onChange={(e) => onUpdate('velocity_ms', e.target.value)}
              className="text-center w-full"
              style={{ 
                borderRadius: '0px', 
                fontSize: '9px', 
                height: '18px', 
                padding: '0 2px'
              }}
              placeholder=""
            />
          </div>
          
          <div className="flex flex-col items-center" style={{ width: '50px' }}>
            <label className="block mb-1 text-center w-full" style={{ fontSize: '8px', color: '#666' }}>Tempo</label>
            <Input
              value={exercise.tempo}
              onChange={(e) => onUpdate('tempo', e.target.value)}
              className="text-center w-full"
              style={{ 
                borderRadius: '0px', 
                fontSize: '9px', 
                height: '18px', 
                padding: '0 2px'
              }}
              placeholder="1.1.1"
            />
          </div>
          
          <div className="flex flex-col items-center" style={{ width: '40px' }}>
            <label className="block mb-1 text-center w-full" style={{ fontSize: '8px', color: '#666' }}>Rest</label>
            <Input
              value={exercise.rest}
              onChange={(e) => onUpdate('rest', e.target.value)}
              className="text-center w-full"
              style={{ 
                borderRadius: '0px', 
                fontSize: '9px', 
                height: '18px', 
                padding: '0 2px'
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
