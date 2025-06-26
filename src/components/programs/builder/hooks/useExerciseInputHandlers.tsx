
import { useState } from 'react';

interface UseExerciseInputHandlersProps {
  onUpdate: (field: string, value: any) => void;
  latest1RM?: number | null;
}

export const useExerciseInputHandlers = ({ onUpdate, latest1RM }: UseExerciseInputHandlersProps) => {
  const parseNumberWithComma = (value: string): number => {
    return parseFloat(value.replace(',', '.')) || 0;
  };

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
    
    const percentage = parseNumberWithComma(value);
    onUpdate('percentage_1rm', value);

    // Αυτόματος υπολογισμός των kg αν υπάρχει 1RM
    if (latest1RM && percentage > 0) {
      const calculatedKg = (latest1RM * percentage) / 100;
      // Στρογγυλοποίηση στα 2.5kg (συνηθισμένο στη βαρυατλητική)
      const roundedKg = Math.round(calculatedKg / 2.5) * 2.5;
      onUpdate('kg', roundedKg.toString().replace('.', ','));
    }
  };

  return {
    handleVelocityChange,
    handleKgChange,
    handlePercentageChange
  };
};
