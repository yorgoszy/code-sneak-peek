
import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Trash2 } from 'lucide-react';

interface ExerciseNotesProps {
  exerciseId: string;
  initialNotes?: string;
  initialKg?: string;
  initialVelocity?: number;
  percentage1rm?: number;
  workoutInProgress: boolean;
  onNotesChange: (exerciseId: string, notes: string) => void;
  onKgChange: (exerciseId: string, kg: string) => void;
  onVelocityChange: (exerciseId: string, velocity: number) => void;
  onClearNotes: (exerciseId: string) => void;
  onClearKg: (exerciseId: string) => void;
  onClearVelocity: (exerciseId: string) => void;
}

export const ExerciseNotes: React.FC<ExerciseNotesProps> = ({
  exerciseId,
  initialNotes = '',
  initialKg = '',
  initialVelocity,
  percentage1rm,
  workoutInProgress,
  onNotesChange,
  onKgChange,
  onVelocityChange,
  onClearNotes,
  onClearKg,
  onClearVelocity
}) => {
  const [notes, setNotes] = useState(initialNotes);
  const [actualKg, setActualKg] = useState('');
  const [actualVelocity, setActualVelocity] = useState('');

  // Calculate new 1RM percentage based on actual kg
  const calculateNew1RMPercentage = (actualWeight: string) => {
    if (!actualWeight || !initialKg || !percentage1rm) return null;
    
    const actual = parseFloat(actualWeight);
    const original = parseFloat(initialKg);
    
    if (isNaN(actual) || isNaN(original) || original === 0) return null;
    
    // Calculate the new percentage based on actual weight
    const newPercentage = (actual / original) * percentage1rm;
    return Math.round(newPercentage * 10) / 10; // Round to 1 decimal place
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    onNotesChange(exerciseId, value);
  };

  const handleKgChange = (value: string) => {
    setActualKg(value);
    onKgChange(exerciseId, value);
  };

  const handleVelocityChange = (value: string) => {
    setActualVelocity(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onVelocityChange(exerciseId, numValue);
    }
  };

  const newPercentage = calculateNew1RMPercentage(actualKg);

  return (
    <div className="flex-1 p-1 bg-gray-50 border-l border-gray-200">
      {/* Notes Section */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-600">Notes</label>
          {notes && (
            <button
              onClick={() => {
                setNotes('');
                onClearNotes(exerciseId);
              }}
              className="text-red-500 hover:text-red-700 p-0.5"
              disabled={!workoutInProgress}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <Textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder={workoutInProgress ? "Προσθήκη σημειώσεων..." : "Πάτησε έναρξη για σημειώσεις"}
          className="min-h-[60px] text-xs rounded-none resize-none"
          disabled={!workoutInProgress}
        />
      </div>

      {/* Actual Kg Section */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-600">Πραγματικά Kg</label>
          {actualKg && (
            <button
              onClick={() => {
                setActualKg('');
                onClearKg(exerciseId);
              }}
              className="text-red-500 hover:text-red-700 p-0.5"
              disabled={!workoutInProgress}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <Input
          type="number"
          value={actualKg}
          onChange={(e) => handleKgChange(e.target.value)}
          placeholder={workoutInProgress ? "Πραγματικά κιλά..." : "Πάτησε έναρξη"}
          className="text-xs rounded-none h-8"
          disabled={!workoutInProgress}
        />
        {newPercentage && (
          <div className="text-xs text-red-600 font-medium mt-1">
            Νέο %1RM: {newPercentage}%
          </div>
        )}
      </div>

      {/* Actual Velocity Section */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-600">Πραγματικό m/s</label>
          {actualVelocity && (
            <button
              onClick={() => {
                setActualVelocity('');
                onClearVelocity(exerciseId);
              }}
              className="text-red-500 hover:text-red-700 p-0.5"
              disabled={!workoutInProgress}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <Input
          type="number"
          step="0.01"
          value={actualVelocity}
          onChange={(e) => handleVelocityChange(e.target.value)}
          placeholder={workoutInProgress ? "Πραγματική ταχύτητα..." : "Πάτησε έναρξη"}
          className="text-xs rounded-none h-8"
          disabled={!workoutInProgress}
        />
      </div>
    </div>
  );
};
