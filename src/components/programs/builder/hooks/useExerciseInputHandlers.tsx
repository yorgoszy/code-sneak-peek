import { use1RMCalculation } from './use1RMCalculation';

interface UseExerciseInputHandlersProps {
  onUpdate: (field: string, value: any) => void;
  userId?: string;
  exerciseId?: string;
}

export const useExerciseInputHandlers = ({ onUpdate, userId, exerciseId }: UseExerciseInputHandlersProps) => {
  const { calculateFromPercentage } = use1RMCalculation(userId, exerciseId);

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

    // Αν το value περιέχει ποσοστό, υπολογίζουμε αυτόματα kg και velocity
    if (value && value.trim() !== '') {
      const calculated = calculateFromPercentage(value);
      if (calculated) {
        onUpdate('kg', calculated.kg);
        onUpdate('velocity_ms', calculated.velocity);
      }
    }
  };

  return {
    handleVelocityChange,
    handleKgChange,
    handlePercentageChange
  };
};
