
import { useState } from 'react';

interface UseExerciseInputHandlersProps {
  onUpdate: (field: string, value: any) => void;
}

export const useExerciseInputHandlers = ({ onUpdate }: UseExerciseInputHandlersProps) => {
  const handleVelocityChange = (value: string) => {
    // Replace period with comma for Greek decimal format
    const formattedValue = value.replace('.', ',');
    onUpdate('velocity_ms', formattedValue);
  };

  const handleKgChange = (value: string) => {
    // Replace period with comma for Greek decimal format
    const formattedValue = value.replace('.', ',');
    onUpdate('kg', formattedValue);
  };

  const handlePercentageChange = (value: string) => {
    // Replace period with comma for Greek decimal format
    const formattedValue = value.replace('.', ',');
    onUpdate('percentage_1rm', formattedValue);
  };

  return {
    handleVelocityChange,
    handleKgChange,
    handlePercentageChange
  };
};
