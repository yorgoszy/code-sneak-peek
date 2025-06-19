import React, { useState } from 'react';
import { CheckCircle, Dumbbell } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ExerciseDetails } from './ExerciseDetails';
import { VideoThumbnail } from '@/components/user-profile/daily-program/VideoThumbnail';

interface Exercise {
  id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  kg?: string;
  percentage_1rm?: number;
  velocity_ms?: number;
  tempo?: string;
  rest?: string;
  notes?: string;
  exercise_order: number;
  exercises?: {
    id: string;
    name: string;
    description?: string;
    video_url?: string | any;
  };
}

interface ExerciseItemProps {
  exercise: Exercise;
  workoutInProgress: boolean;
  isComplete: boolean;
  remainingText: string;
  onExerciseClick: (exercise: Exercise, event: React.MouseEvent) => void;
  onSetClick: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  onVideoClick: (exercise: Exercise) => void;
  getNotes: (exerciseId: string) => string;
  updateNotes: (exerciseId: string, notes: string) => void;
  clearNotes: (exerciseId: string) => void;
  updateKg: (exerciseId: string, kg: string) => void;
  clearKg: (exerciseId: string) => void;
  updateVelocity: (exerciseId: string, velocity: number) => void;
  clearVelocity: (exerciseId: string) => void;
  updateReps: (exerciseId: string, reps: number) => void;
  clearReps: (exerciseId: string) => void;
  selectedDate?: Date;
  program?: any;
  getRemainingText: (exerciseId: string, totalSets: number) => string;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  workoutInProgress,
  isComplete,
  remainingText,
  onExerciseClick,
  onSetClick,
  onVideoClick,
  getNotes,
  updateNotes,
  clearNotes,
  updateKg,
  clearKg,
  updateVelocity,
  clearVelocity,
  updateReps,
  clearReps,
  selectedDate,
  program,
  getRemainingText
}) => {
  const [notes, setNotes] = useState(getNotes(exercise.id) || '');
  const [kgValue, setKgValue] = useState(exercise.kg || '');
  const [velocityValue, setVelocityValue] = useState(exercise.velocity_ms?.toString() || '');
  const [repsValue, setRepsValue] = useState(exercise.reps?.toString() || '');

  const handleExerciseClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onExerciseClick(exercise, event);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    updateNotes(exercise.id, newNotes);
  };

  const handleClearNotes = () => {
    clearNotes(exercise.id);
    setNotes('');
  };

  const handleKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKg = e.target.value;
    setKgValue(newKg);
    updateKg(exercise.id, newKg);
  };

  const handleClearKg = () => {
    clearKg(exercise.id);
    setKgValue('');
  };

  const handleVelocityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVelocity = parseFloat(e.target.value);
    setVelocityValue(e.target.value);
    updateVelocity(exercise.id, newVelocity);
  };

  const handleClearVelocity = () => {
    clearVelocity(exercise.id);
    setVelocityValue('');
  };

  const handleRepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newReps = parseInt(e.target.value);
    setRepsValue(e.target.value);
    updateReps(exercise.id, newReps);
  };

  const handleClearReps = () => {
    clearReps(exercise.id);
    setRepsValue('');
  };

  return (
    <div 
      className={`border border-gray-200 rounded-none overflow-hidden cursor-pointer transition-all duration-200 ${
        isComplete ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'
      }`}
      onClick={handleExerciseClick}
    >
      {/* Exercise Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <div className="flex items-center space-x-2">
              <Dumbbell className="h-4 w-4 text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-900">
                {exercise.exercises?.name || 'Άγνωστη άσκηση'}
              </h4>
              <VideoThumbnail exercise={exercise} onVideoClick={onVideoClick} />
            </div>
            {isComplete && <CheckCircle className="h-4 w-4 text-green-600" />}
          </div>
          
          {workoutInProgress && !isComplete && (
            <Badge variant="outline" className="text-xs bg-[#00ffba] text-black border-[#00ffba] rounded-none">
              {remainingText}
            </Badge>
          )}
        </div>
      </div>

      {/* Exercise Details */}
      <div className="p-3">
        <ExerciseDetails
          exercise={exercise}
          onVideoClick={onVideoClick}
          onSetClick={(event) => onSetClick && onSetClick(exercise.id, exercise.sets, event)}
          workoutInProgress={workoutInProgress}
          getRemainingText={getRemainingText}
        />

        {/* Notes Section */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor={`notes-${exercise.id}`} className="text-xs font-medium text-gray-700">
              Σημειώσεις:
            </label>
            {notes && (
              <Button variant="ghost" size="sm" onClick={handleClearNotes} className="rounded-none">
                Clear
              </Button>
            )}
          </div>
          <Textarea
            id={`notes-${exercise.id}`}
            placeholder="Προσθέστε σημειώσεις για την άσκηση..."
            value={notes}
            onChange={handleNotesChange}
            className="text-xs rounded-none"
          />
        </div>

        {/* Actual Values Section */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          {/* Kg Input */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor={`kg-${exercise.id}`} className="block text-xs font-medium text-gray-700">
                Kg:
              </label>
              {kgValue && (
                <Button variant="ghost" size="sm" onClick={handleClearKg} className="rounded-none">
                  Clear
                </Button>
              )}
            </div>
            <Input
              type="number"
              id={`kg-${exercise.id}`}
              placeholder="Kg"
              value={kgValue}
              onChange={handleKgChange}
              className="text-xs rounded-none"
            />
          </div>

          {/* Velocity Input */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor={`velocity-${exercise.id}`} className="block text-xs font-medium text-gray-700">
                m/s:
              </label>
              {velocityValue && (
                <Button variant="ghost" size="sm" onClick={handleClearVelocity} className="rounded-none">
                  Clear
                </Button>
              )}
            </div>
            <Input
              type="number"
              id={`velocity-${exercise.id}`}
              placeholder="m/s"
              value={velocityValue}
              onChange={handleVelocityChange}
              className="text-xs rounded-none"
            />
          </div>

          {/* Reps Input */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor={`reps-${exercise.id}`} className="block text-xs font-medium text-gray-700">
                Reps:
              </label>
              {repsValue && (
                <Button variant="ghost" size="sm" onClick={handleClearReps} className="rounded-none">
                  Clear
                </Button>
              )}
            </div>
            <Input
              type="number"
              id={`reps-${exercise.id}`}
              placeholder="Reps"
              value={repsValue}
              onChange={handleRepsChange}
              className="text-xs rounded-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
