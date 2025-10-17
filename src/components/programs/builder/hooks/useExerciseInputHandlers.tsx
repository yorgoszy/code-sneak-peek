import { use1RMCalculation } from './use1RMCalculation';

interface UseExerciseInputHandlersProps {
  onUpdate: (field: string, value: any) => void;
  userId?: string;
  exerciseId?: string;
}

export const useExerciseInputHandlers = ({ onUpdate, userId, exerciseId }: UseExerciseInputHandlersProps) => {
  const { calculateFromPercentage, calculateFromKg, calculateFromVelocity } = use1RMCalculation(userId, exerciseId);

  const handleVelocityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const display = raw.replace('.', ',');
    onUpdate('velocity_ms', display);

    if (raw && raw.trim() !== '') {
      const calculated = calculateFromVelocity(raw);
      if (calculated) {
        onUpdate('percentage_1rm', calculated.percentage);
        onUpdate('kg', calculated.kg);
      }
    }
  };

  const handleKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const display = raw.replace('.', ',');
    onUpdate('kg', display);

    if (raw && raw.trim() !== '') {
      const calculated = calculateFromKg(raw);
      if (calculated) {
        onUpdate('percentage_1rm', calculated.percentage);
        onUpdate('velocity_ms', calculated.velocity);
      }
    }
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
