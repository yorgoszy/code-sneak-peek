
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
      <div className="bg-white border" style={{ fontSize: '9px' }}>
        {/* Exercise Name Row with Actions */}
        <div className="p-1 border-b bg-gray-50 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-5 justify-start px-2"
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
              className="p-1 h-5 w-5"
              style={{ borderRadius: '0px' }}
            >
              <Copy className="w-2 h-2" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="p-1 h-5 w-5"
              style={{ borderRadius: '0px' }}
            >
              <Trash2 className="w-2 h-2" />
            </Button>
          </div>
        </div>
        
        {/* Exercise Details Row */}
        <div className="p-1">
          {/* Headers */}
          <div className="grid grid-cols-12 gap-1 mb-1">
            <div className="col-span-2 text-center" style={{ fontSize: '8px', color: '#666' }}>Sets</div>
            <div className="col-span-2 text-center" style={{ fontSize: '8px', color: '#666' }}>Reps</div>
            <div className="col-span-2 text-center" style={{ fontSize: '8px', color: '#666' }}>%1RM</div>
            <div className="col-span-2 text-center" style={{ fontSize: '8px', color: '#666' }}>Kg</div>
            <div className="col-span-2 text-center" style={{ fontSize: '8px', color: '#666' }}>m/s</div>
            <div className="col-span-1 text-center" style={{ fontSize: '8px', color: '#666' }}>Tempo</div>
            <div className="col-span-1 text-center" style={{ fontSize: '8px', color: '#666' }}>Rest</div>
          </div>
          
          {/* Input Fields */}
          <div className="grid grid-cols-12 gap-1">
            <div className="col-span-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={exercise.sets}
                onChange={(e) => onUpdate('sets', parseInt(e.target.value) || 1)}
                className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                style={{ 
                  borderRadius: '0px', 
                  fontSize: '8px', 
                  height: '20px', 
                  padding: '0 2px',
                  width: '100%'
                }}
                placeholder="3"
              />
            </div>
            
            <div className="col-span-2">
              <Input
                value={exercise.reps}
                onChange={(e) => onUpdate('reps', e.target.value)}
                className="text-center"
                style={{ 
                  borderRadius: '0px', 
                  fontSize: '8px', 
                  height: '20px', 
                  padding: '0 2px',
                  width: '100%'
                }}
                placeholder="8.5.3"
              />
            </div>
            
            <div className="col-span-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={exercise.percentage_1rm}
                onChange={(e) => onUpdate('percentage_1rm', parseFloat(e.target.value) || 0)}
                className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                style={{ 
                  borderRadius: '0px', 
                  fontSize: '8px', 
                  height: '20px', 
                  padding: '0 2px',
                  width: '100%'
                }}
                placeholder="80"
              />
            </div>
            
            <div className="col-span-2">
              <Input
                value={exercise.kg}
                onChange={(e) => onUpdate('kg', e.target.value)}
                className="text-center"
                style={{ 
                  borderRadius: '0px', 
                  fontSize: '8px', 
                  height: '20px', 
                  padding: '0 2px',
                  width: '100%'
                }}
                placeholder="80"
              />
            </div>
            
            <div className="col-span-2">
              <Input
                value={exercise.velocity_ms}
                onChange={(e) => onUpdate('velocity_ms', e.target.value)}
                className="text-center"
                style={{ 
                  borderRadius: '0px', 
                  fontSize: '8px', 
                  height: '20px', 
                  padding: '0 2px',
                  width: '100%'
                }}
                placeholder="0.6"
              />
            </div>
            
            <div className="col-span-1">
              <Input
                value={exercise.tempo}
                onChange={(e) => onUpdate('tempo', e.target.value)}
                className="text-center"
                style={{ 
                  borderRadius: '0px', 
                  fontSize: '8px', 
                  height: '20px', 
                  padding: '0 1px',
                  width: '100%'
                }}
                placeholder="3.1.1"
              />
            </div>
            
            <div className="col-span-1">
              <Input
                value={exercise.rest}
                onChange={(e) => onUpdate('rest', e.target.value)}
                className="text-center"
                style={{ 
                  borderRadius: '0px', 
                  fontSize: '8px', 
                  height: '20px', 
                  padding: '0 1px',
                  width: '100%'
                }}
                placeholder="2:00"
              />
            </div>
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
