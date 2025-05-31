
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
      <div className="bg-white border w-full h-full flex flex-col" style={{ fontSize: '8px' }}>
        {/* Exercise Name Row with Actions */}
        <div className="p-0.5 border-b bg-gray-50 flex items-center gap-0.5 flex-shrink-0" style={{ height: '14px' }}>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-full justify-start px-0.5"
            style={{ borderRadius: '0px', fontSize: '7px', minHeight: '12px' }}
            onClick={() => setShowExerciseDialog(true)}
          >
            {selectedExercise ? selectedExercise.name : 'Επιλογή...'}
          </Button>
          
          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              className="p-0 h-full w-3"
              style={{ borderRadius: '0px', minHeight: '12px' }}
            >
              <Copy className="w-1.5 h-1.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="p-0 h-full w-3"
              style={{ borderRadius: '0px', minHeight: '12px' }}
            >
              <Trash2 className="w-1.5 h-1.5" />
            </Button>
          </div>
        </div>
        
        {/* Exercise Details Row */}
        <div className="flex p-0.5 gap-0.5 flex-1 items-stretch">
          <div className="flex flex-col items-center flex-1">
            <label className="block mb-0.5 text-center w-full" style={{ fontSize: '6px', color: '#666', lineHeight: '1' }}>Sets</label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={exercise.sets || ''}
              onChange={(e) => onUpdate('sets', parseInt(e.target.value) || '')}
              className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full flex-1"
              style={{ 
                borderRadius: '0px', 
                fontSize: '7px', 
                height: '100%',
                minHeight: '12px',
                padding: '0 1px'
              }}
              placeholder=""
            />
          </div>
          
          <div className="flex flex-col items-center flex-1">
            <label className="block mb-0.5 text-center w-full" style={{ fontSize: '6px', color: '#666', lineHeight: '1' }}>Reps</label>
            <Input
              value={exercise.reps}
              onChange={(e) => onUpdate('reps', e.target.value)}
              className="text-center w-full flex-1"
              style={{ 
                borderRadius: '0px', 
                fontSize: '7px', 
                height: '100%',
                minHeight: '12px',
                padding: '0 1px'
              }}
              placeholder=""
            />
          </div>
          
          <div className="flex flex-col items-center flex-1">
            <label className="block mb-0.5 text-center w-full" style={{ fontSize: '6px', color: '#666', lineHeight: '1' }}>%1RM</label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={exercise.percentage_1rm || ''}
              onChange={(e) => onUpdate('percentage_1rm', parseFloat(e.target.value) || '')}
              className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full flex-1"
              style={{ 
                borderRadius: '0px', 
                fontSize: '7px', 
                height: '100%',
                minHeight: '12px',
                padding: '0 1px'
              }}
              placeholder=""
            />
          </div>
          
          <div className="flex flex-col items-center flex-1">
            <label className="block mb-0.5 text-center w-full" style={{ fontSize: '6px', color: '#666', lineHeight: '1' }}>Kg</label>
            <Input
              value={exercise.kg}
              onChange={(e) => onUpdate('kg', e.target.value)}
              className="text-center w-full flex-1"
              style={{ 
                borderRadius: '0px', 
                fontSize: '7px', 
                height: '100%',
                minHeight: '12px',
                padding: '0 1px'
              }}
              placeholder=""
            />
          </div>
          
          <div className="flex flex-col items-center flex-1">
            <label className="block mb-0.5 text-center w-full" style={{ fontSize: '6px', color: '#666', lineHeight: '1' }}>m/s</label>
            <Input
              value={exercise.velocity_ms}
              onChange={(e) => onUpdate('velocity_ms', e.target.value)}
              className="text-center w-full flex-1"
              style={{ 
                borderRadius: '0px', 
                fontSize: '7px', 
                height: '100%',
                minHeight: '12px',
                padding: '0 1px'
              }}
              placeholder=""
            />
          </div>
          
          <div className="flex flex-col items-center flex-1">
            <label className="block mb-0.5 text-center w-full" style={{ fontSize: '6px', color: '#666', lineHeight: '1' }}>Tempo</label>
            <Input
              value={exercise.tempo}
              onChange={(e) => onUpdate('tempo', e.target.value)}
              className="text-center w-full flex-1"
              style={{ 
                borderRadius: '0px', 
                fontSize: '7px', 
                height: '100%',
                minHeight: '12px',
                padding: '0 1px'
              }}
              placeholder=""
            />
          </div>
          
          <div className="flex flex-col items-center flex-1">
            <label className="block mb-0.5 text-center w-full" style={{ fontSize: '6px', color: '#666', lineHeight: '1' }}>Rest</label>
            <Input
              value={exercise.rest}
              onChange={(e) => onUpdate('rest', e.target.value)}
              className="text-center w-full flex-1"
              style={{ 
                borderRadius: '0px', 
                fontSize: '7px', 
                height: '100%',
                minHeight: '12px',
                padding: '0 1px'
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
