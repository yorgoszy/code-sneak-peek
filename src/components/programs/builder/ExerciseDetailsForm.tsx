
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { ProgramExercise } from '../types';
import { formatTimeInput } from '@/utils/timeFormatting';

interface ExerciseDetailsFormProps {
  exercise: ProgramExercise;
  onUpdate: (field: string, value: any) => void;
  onVelocityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKgChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPercentageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ExerciseDetailsForm: React.FC<ExerciseDetailsFormProps> = ({
  exercise,
  onUpdate,
  onVelocityChange,
  onKgChange,
  onPercentageChange
}) => {
  const [isTimeMode, setIsTimeMode] = useState(false);
  const [repsMode, setRepsMode] = useState<'reps' | 'time' | 'meter'>(exercise.reps_mode || 'reps');
  const [kgMode, setKgMode] = useState<'kg' | 'rpm' | 'meter' | 's/m' | 'km/h'>(exercise.kg_mode || 'kg');

  // Sync local state with exercise props when they change
  React.useEffect(() => {
    if (exercise.reps_mode && exercise.reps_mode !== repsMode) {
      setRepsMode(exercise.reps_mode);
    }
    if (exercise.kg_mode && exercise.kg_mode !== kgMode) {
      setKgMode(exercise.kg_mode);
    }
  }, [exercise.reps_mode, exercise.kg_mode]);

  const handleSetsLabelClick = () => {
    setIsTimeMode(!isTimeMode);
  };

  const handleRepsLabelClick = () => {
    setRepsMode((prev) => {
      let newMode: 'reps' | 'time' | 'meter';
      if (prev === 'reps') newMode = 'time';
      else if (prev === 'time') newMode = 'meter';
      else newMode = 'reps';
      
      // Save the mode to the exercise
      onUpdate('reps_mode', newMode);
      return newMode;
    });
  };

  const handleKgLabelClick = () => {
    setKgMode((prev) => {
      let newMode: 'kg' | 'rpm' | 'meter' | 's/m' | 'km/h';
      if (prev === 'kg') newMode = 'rpm';
      else if (prev === 'rpm') newMode = 'meter';
      else if (prev === 'meter') newMode = 's/m';
      else if (prev === 's/m') newMode = 'km/h';
      else newMode = 'kg';
      
      // Save the mode to the exercise
      onUpdate('kg_mode', newMode);
      return newMode;
    });
  };

  return (
    <div className="flex p-2 gap-0 w-full" style={{ minHeight: '28px' }}>
      <div className="flex flex-col items-center" style={{ width: '60px' }}>
        <label 
          className="block mb-1 text-center w-full cursor-pointer hover:text-[#00ffba]" 
          style={{ fontSize: '10px', color: '#666' }}
          onClick={handleSetsLabelClick}
        >
          {isTimeMode ? 'Time' : 'Sets'}
        </label>
        <Input
          type="text"
          value={isTimeMode ? formatTimeInput(String(exercise.sets || '')) : (exercise.sets || '')}
          onChange={(e) => {
            if (isTimeMode) {
              const formatted = formatTimeInput(e.target.value);
              onUpdate('sets', formatted);
            } else {
              onUpdate('sets', parseInt(e.target.value) || '');
            }
          }}
          className="text-center w-full"
          style={{ 
            borderRadius: '0px', 
            fontSize: '12px', 
            height: '22px', 
            padding: '0 4px'
          }}
          placeholder={isTimeMode ? '00:00' : ''}
        />
      </div>
      
      <div className="flex flex-col items-center" style={{ width: '60px' }}>
        <label 
          className="block mb-1 text-center w-full cursor-pointer hover:text-[#00ffba]" 
          style={{ fontSize: '10px', color: '#666' }}
          onClick={handleRepsLabelClick}
        >
          {repsMode === 'reps' ? 'Reps' : repsMode === 'time' ? 'Time' : 'Meter'}
        </label>
        <Input
          value={repsMode === 'time' ? formatTimeInput(String(exercise.reps || '')) : (exercise.reps || '')}
          onChange={(e) => {
            if (repsMode === 'time') {
              const formatted = formatTimeInput(e.target.value);
              onUpdate('reps', formatted);
            } else {
              onUpdate('reps', e.target.value);
            }
          }}
          className="text-center w-full"
          style={{ 
            borderRadius: '0px', 
            fontSize: '12px', 
            height: '22px', 
            padding: '0 4px'
          }}
          placeholder={repsMode === 'time' ? '00:00' : ''}
        />
      </div>
      
      <div className="flex flex-col items-center" style={{ width: '60px' }}>
        <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>%1RM</label>
        <Input
          type="text"
          inputMode="decimal"
          value={exercise.percentage_1rm || ''}
          onChange={onPercentageChange}
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
        <label 
          className="block mb-1 text-center w-full cursor-pointer hover:text-[#00ffba]" 
          style={{ fontSize: '10px', color: '#666' }}
          onClick={handleKgLabelClick}
        >
          {kgMode === 'kg' ? 'Kg' : kgMode === 'rpm' ? 'rpm' : kgMode === 'meter' ? 'meter' : kgMode === 's/m' ? 's/m' : 'km/h'}
        </label>
        <Input
          type="text"
          inputMode="decimal"
          value={exercise.kg || ''}
          onChange={onKgChange}
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
          inputMode="decimal"
          value={exercise.velocity_ms?.toString() || ''}
          onChange={onVelocityChange}
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
      
      <div className="flex flex-col items-center" style={{ width: '51px' }}>
        <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Rest</label>
        <Input
          value={formatTimeInput(String(exercise.rest || ''))}
          onChange={(e) => {
            const formatted = formatTimeInput(e.target.value);
            onUpdate('rest', formatted);
          }}
          className="text-center w-full"
          style={{ 
            borderRadius: '0px', 
            fontSize: '12px', 
            height: '22px', 
            padding: '0 4px'
          }}
          placeholder="00:00"
        />
      </div>
    </div>
  );
};
