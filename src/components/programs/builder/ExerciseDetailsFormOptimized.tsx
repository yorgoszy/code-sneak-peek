
import React, { useState, useCallback } from 'react';
import { ProgramExercise } from '../types';
import { DebouncedInput } from './DebouncedInput';
import { RollingTimeInput } from './RollingTimeInput';

interface ExerciseDetailsFormOptimizedProps {
  exercise: ProgramExercise;
  onUpdate: (field: string, value: any) => void;
}

export const ExerciseDetailsFormOptimized: React.FC<ExerciseDetailsFormOptimizedProps> = React.memo(({
  exercise,
  onUpdate
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

  const handleSetsLabelClick = useCallback(() => {
    setIsTimeMode(prev => !prev);
  }, []);

  const handleRepsLabelClick = useCallback(() => {
    setRepsMode((prev) => {
      let newMode: 'reps' | 'time' | 'meter';
      if (prev === 'reps') newMode = 'time';
      else if (prev === 'time') newMode = 'meter';
      else newMode = 'reps';
      onUpdate('reps_mode', newMode);
      return newMode;
    });
  }, [onUpdate]);

  const handleKgLabelClick = useCallback(() => {
    setKgMode((prev) => {
      let newMode: 'kg' | 'rpm' | 'meter' | 's/m' | 'km/h';
      if (prev === 'kg') newMode = 'rpm';
      else if (prev === 'rpm') newMode = 'meter';
      else if (prev === 'meter') newMode = 's/m';
      else if (prev === 's/m') newMode = 'km/h';
      else newMode = 'kg';
      onUpdate('kg_mode', newMode);
      return newMode;
    });
  }, [onUpdate]);

  // Memoized handlers for each field
  const handleSetsChange = useCallback((value: string) => {
    onUpdate('sets', value);
  }, [onUpdate]);

  const handleSetsNumberChange = useCallback((value: string) => {
    onUpdate('sets', parseInt(value) || '');
  }, [onUpdate]);

  const handleRepsChange = useCallback((value: string) => {
    onUpdate('reps', value);
  }, [onUpdate]);

  const handleRepsTextChange = useCallback((value: string) => {
    onUpdate('reps', value);
  }, [onUpdate]);

  const handlePercentageChange = useCallback((value: string) => {
    const cleaned = value.replace('.', ',');
    onUpdate('percentage_1rm', cleaned);
  }, [onUpdate]);

  const handleKgChange = useCallback((value: string) => {
    const cleaned = value.replace('.', ',');
    onUpdate('kg', cleaned);
  }, [onUpdate]);

  const handleVelocityChange = useCallback((value: string) => {
    const cleaned = value.replace('.', ',');
    onUpdate('velocity_ms', cleaned);
  }, [onUpdate]);

  const handleTempoChange = useCallback((value: string) => {
    onUpdate('tempo', value);
  }, [onUpdate]);

  const handleRestChange = useCallback((value: string) => {
    onUpdate('rest', value);
  }, [onUpdate]);

  const inputStyle: React.CSSProperties = { 
    borderRadius: '0px', 
    fontSize: '12px', 
    height: '22px', 
    padding: '0 4px'
  };

  return (
    <div className="flex px-2 py-0 gap-0 w-full" style={{ minHeight: '28px' }}>
      <div className="flex flex-col items-center" style={{ width: '60px' }}>
        <label 
          className="block mb-1 text-center w-full cursor-pointer hover:text-[#00ffba]" 
          style={{ fontSize: '10px', color: '#666' }}
          onClick={handleSetsLabelClick}
        >
          {isTimeMode ? 'Time' : 'Sets'}
        </label>
        {isTimeMode ? (
          <RollingTimeInput
            value={exercise.sets || ''}
            onChange={handleSetsChange}
            className="text-center w-full"
            style={inputStyle}
          />
        ) : (
          <DebouncedInput
            value={exercise.sets || ''}
            onChange={handleSetsNumberChange}
            className="text-center w-full"
            style={inputStyle}
          />
        )}
      </div>
      
      <div className="flex flex-col items-center" style={{ width: '60px' }}>
        <label 
          className="block mb-1 text-center w-full cursor-pointer hover:text-[#00ffba]" 
          style={{ fontSize: '10px', color: '#666' }}
          onClick={handleRepsLabelClick}
        >
          {repsMode === 'reps' ? 'Reps' : repsMode === 'time' ? 'Time' : 'Meter'}
        </label>
        {repsMode === 'time' ? (
          <RollingTimeInput
            value={exercise.reps || ''}
            onChange={handleRepsChange}
            className="text-center w-full"
            style={inputStyle}
          />
        ) : (
          <DebouncedInput
            value={exercise.reps || ''}
            onChange={handleRepsTextChange}
            className="text-center w-full"
            style={inputStyle}
          />
        )}
      </div>
      
      <div className="flex flex-col items-center" style={{ width: '60px' }}>
        <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>%1RM</label>
        <DebouncedInput
          inputMode="decimal"
          value={exercise.percentage_1rm || ''}
          onChange={handlePercentageChange}
          className="text-center w-full"
          style={inputStyle}
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
        <DebouncedInput
          inputMode="decimal"
          value={exercise.kg || ''}
          onChange={handleKgChange}
          className="text-center w-full"
          style={inputStyle}
        />
      </div>
      
      <div className="flex flex-col items-center" style={{ width: '60px' }}>
        <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>m/s</label>
        <DebouncedInput
          inputMode="decimal"
          value={exercise.velocity_ms?.toString() || ''}
          onChange={handleVelocityChange}
          className="text-center w-full"
          style={inputStyle}
        />
      </div>
      
      <div className="flex flex-col items-center" style={{ width: '60px' }}>
        <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Tempo</label>
        <DebouncedInput
          value={exercise.tempo || ''}
          onChange={handleTempoChange}
          className="text-center w-full"
          style={inputStyle}
          placeholder="1.1.1"
        />
      </div>
      
      <div className="flex flex-col items-center" style={{ width: '52px' }}>
        <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Rest</label>
        <RollingTimeInput
          value={exercise.rest || ''}
          onChange={handleRestChange}
          className="text-center w-full"
          style={inputStyle}
        />
      </div>
    </div>
  );
});

ExerciseDetailsFormOptimized.displayName = 'ExerciseDetailsFormOptimized';
