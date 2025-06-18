
import React from 'react';
import { Input } from "@/components/ui/input";
import { ProgramExercise } from '../types';

interface ExerciseRowDetailsProps {
  exercise: ProgramExercise;
  onUpdate: (field: string, value: any) => void;
}

export const ExerciseRowDetails: React.FC<ExerciseRowDetailsProps> = ({
  exercise,
  onUpdate
}) => {
  return (
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
          value={exercise.reps || ''}
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
          value={exercise.kg || ''}
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
          type="text"
          inputMode="numeric"
          value={exercise.velocity_ms?.toString() || ''}
          onChange={(e) => onUpdate('velocity_ms', parseFloat(e.target.value) || 0)}
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
          value={exercise.tempo || ''}
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
          value={exercise.rest || ''}
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
  );
};
