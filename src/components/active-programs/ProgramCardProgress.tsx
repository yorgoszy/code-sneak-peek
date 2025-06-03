
import React from 'react';
import { Progress } from "@/components/ui/progress";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCardProgressProps {
  assignment: EnrichedAssignment;
  workoutStats: {
    completed: number;
    total: number;
    missed: number;
  };
}

export const ProgramCardProgress: React.FC<ProgramCardProgressProps> = ({ 
  assignment, 
  workoutStats 
}) => {
  const getTrainingDaysInitials = () => {
    if (!assignment.training_dates || assignment.training_dates.length === 0) {
      return '';
    }

    const dayInitials = ['Κ', 'Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ']; // Κυριακή, Δευτέρα, Τρίτη, Τετάρτη, Πέμπτη, Παρασκευή, Σάββατο
    
    const uniqueDays = new Set();
    assignment.training_dates.forEach(dateStr => {
      const date = new Date(dateStr);
      const dayIndex = date.getDay();
      uniqueDays.add(dayInitials[dayIndex]);
    });

    return Array.from(uniqueDays).join('-');
  };

  const progressPercentage = workoutStats.total > 0 ? Math.round((workoutStats.completed / workoutStats.total) * 100) : 0;

  return (
    <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
      {/* Training Days */}
      <div className="text-xs text-blue-600 font-medium">
        {getTrainingDaysInitials()}
      </div>
      
      {/* Progress Stats */}
      <div className="flex items-center gap-1">
        <div className="text-xs text-gray-700">
          {workoutStats.completed}/{workoutStats.total}
        </div>
        {workoutStats.missed > 0 && (
          <div className="text-xs text-red-600 font-medium">
            -{workoutStats.missed}
          </div>
        )}
        <div className="w-12">
          <Progress value={progressPercentage} className="h-1" />
        </div>
        <div className="text-xs text-gray-600 font-medium min-w-8">
          {progressPercentage}%
        </div>
      </div>
    </div>
  );
};
