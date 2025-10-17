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
    console.info('[ExerciseInput] velocity change raw:', raw);
    onUpdate('velocity_ms', display);

    if (raw && raw.trim() !== '') {
      const calculated = calculateFromVelocity(raw);
      console.info('[ExerciseInput] velocity -> calc:', calculated);
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
    const raw = e.target.value;
    // Normalize decimal separator for parsing
    const sanitized = raw.replace('%', '').replace(',', '.');

    if (!raw || raw.trim() === '') {
      onUpdate('percentage_1rm', '');
      return;
    }

    const percentValue = parseFloat(sanitized);
    if (isNaN(percentValue)) {
      onUpdate('percentage_1rm', raw.replace('.', ','));
      return;
    }

    // Store as number (0-100), display stays controlled by value prop
    const clamped = Math.max(0, Math.min(100, percentValue));
    onUpdate('percentage_1rm', clamped);

    const calculated = calculateFromPercentage(clamped.toString());
    if (calculated) {
      onUpdate('kg', calculated.kg);
      onUpdate('velocity_ms', calculated.velocity);
    }
  };

  return {
    handleVelocityChange,
    handleKgChange,
    handlePercentageChange
  };
};
