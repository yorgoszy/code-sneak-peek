
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ExerciseHeader } from './ExerciseHeader';
import { ExerciseDetails } from './ExerciseDetails';
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from 'lucide-react';

interface ExerciseItemProps {
  exercise: any;
  exerciseNumber: number;
  isComplete?: boolean;
  remainingText?: string;
  onVideoClick: (exercise: any) => void;
  onSetClick: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  onExerciseClick?: (exercise: any, event: React.MouseEvent) => void;
  workoutInProgress: boolean;
  getRemainingText: (exerciseId: string) => string;
  getCompletedSets: (exerciseId: string) => number;
  isExerciseComplete: (exerciseId: string, totalSets: number) => boolean;
  updateReps: (exerciseId: string, value: string) => void;
  updateKg: (exerciseId: string, value: string) => void;
  updateVelocity: (exerciseId: string, value: string) => void;
  updateNotes?: (exerciseId: string, value: string) => void;
  clearReps?: (exerciseId: string) => void;
  clearKg?: (exerciseId: string) => void;
  clearVelocity?: (exerciseId: string) => void;
  clearNotes?: (exerciseId: string) => void;
  getNotes?: (exerciseId: string) => string;
  getKg: (exerciseId: string) => string;
  getReps: (exerciseId: string) => string;
  getVelocity: (exerciseId: string) => string;
  selectedDate?: Date;
  program?: any;
  actualValues?: {
    reps?: string;
    kg?: string;
    velocity?: string;
  };
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  exerciseNumber,
  isComplete: propIsComplete,
  remainingText: propRemainingText,
  onVideoClick,
  onSetClick,
  onExerciseClick,
  workoutInProgress,
  getRemainingText,
  getCompletedSets,
  isExerciseComplete,
  updateReps,
  updateKg,
  updateVelocity,
  updateNotes,
  clearReps,
  clearKg,
  clearVelocity,
  clearNotes,
  getNotes,
  getKg,
  getReps,
  getVelocity,
  selectedDate,
  program,
  actualValues
}) => {
  // Calculate derived values
  const isComplete = propIsComplete ?? isExerciseComplete(exercise.id, exercise.sets);
  const remainingText = propRemainingText ?? getRemainingText(exercise.id);

  // Get notes from state
  const currentNotes = getNotes ? getNotes(exercise.id) : '';

  const handleVideoClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onVideoClick(exercise);
  };

  const handleSetClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSetClick(exercise.id, exercise.sets, event);
  };

  const handleNotesChange = (value: string) => {
    if (updateNotes) updateNotes(exercise.id, value);
  };

  const handleClearNotes = () => {
    if (clearNotes) clearNotes(exercise.id);
  };

  return (
    <Card className="rounded-none border-l-4 border-l-blue-500 mb-2">
      <CardContent className="p-0">
        <ExerciseHeader
          exercise={exercise}
          exerciseNumber={exerciseNumber}
          isComplete={isComplete}
          remainingText={remainingText}
          workoutInProgress={workoutInProgress}
          onVideoClick={handleVideoClick}
          onSetClick={handleSetClick}
        />
        
        <ExerciseDetails
          exercise={exercise}
          onSetClick={onSetClick}
          workoutInProgress={workoutInProgress}
          getRemainingText={getRemainingText}
          getCompletedSets={getCompletedSets}
          updateReps={updateReps}
          updateKg={updateKg}
          updateVelocity={updateVelocity}
          getKg={getKg}
          getReps={getReps}
          getVelocity={getVelocity}
        />

        {/* Notes Section - always visible */}
        <div className="px-2 py-1 border-t border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[9px] font-medium text-gray-500">Notes</label>
            {currentNotes && workoutInProgress && (
              <button
                onClick={handleClearNotes}
                className="text-red-500 hover:text-red-700 p-0.5"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <Textarea
            value={currentNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder={workoutInProgress ? "Σημειώσεις..." : ""}
            className="min-h-[28px] text-[9px] rounded-none resize-none p-1"
            disabled={!workoutInProgress}
          />
        </div>
      </CardContent>
    </Card>
  );
};
