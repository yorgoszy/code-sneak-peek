
import { useState } from 'react';

interface UseExerciseInputHandlersProps {
  onUpdate: (field: string, value: any) => void;
}

export const useExerciseInputHandlers = ({ onUpdate }: UseExerciseInputHandlersProps) => {
  const handleVelocityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Replace period with comma for Greek decimal format
    value = value.replace('.', ',');
    onUpdate('velocity_ms', value);
  };

  const handleKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Replace period with comma for Greek decimal format
    value = value.replace('.', ',');
    onUpdate('kg', value);
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Replace period with comma for Greek decimal format
    value = value.replace('.', ',');
    onUpdate('percentage_1rm', value);
  };

  return {
    handleVelocityChange,
    handleKgChange,
    handlePercentageChange
  };
};
