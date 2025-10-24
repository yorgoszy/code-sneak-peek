
import React from 'react';
import { EnhancedProgressBar } from './EnhancedProgressBar';
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
  const getTrainingDaysWithDuration = () => {
    if (!assignment.training_dates || assignment.training_dates.length === 0) {
      return '';
    }

    const dayInitials = ['Κ', 'Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ']; // Κυριακή, Δευτέρα, Τρίτη, Τετάρτη, Πέμπτη, Παρασκευή, Σάββατο
    
    // Βρίσκουμε πόσες ημέρες έχει μια εβδομάδα του προγράμματος
    const programDays = assignment.programs?.program_weeks?.[0]?.program_days || [];
    const daysPerWeek = programDays.length || assignment.training_dates.length;
    
    // Παίρνουμε τις πρώτες ημέρες του προγράμματος (ένας κύκλος)
    const firstCycleDates = assignment.training_dates.slice(0, daysPerWeek);
    
    // Δημιουργούμε τα initials με τη σειρά του προγράμματος και τα λεπτά
    const dayLabels = firstCycleDates.map((dateStr, index) => {
      const date = new Date(dateStr + 'T00:00:00'); // Προσθέτουμε time για να αποφύγουμε timezone issues
      const dayIndex = date.getDay();
      const initial = dayInitials[dayIndex];
      
      // Παίρνουμε τα λεπτά από το αντίστοιχο program_day
      const programDay = programDays[index];
      const minutes = programDay?.estimated_duration_minutes;
      
      return minutes ? `${initial} ${minutes}'` : initial;
    });

    return dayLabels.join(' - ');
  };

  const progressPercentage = workoutStats.total > 0 ? Math.round((workoutStats.completed / workoutStats.total) * 100) : 0;

  return (
    <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
      {/* Training Days with Duration */}
      <div className="text-xs text-blue-600 font-medium">
        {getTrainingDaysWithDuration()}
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
          <EnhancedProgressBar 
            completed={workoutStats.completed}
            total={workoutStats.total}
            missed={workoutStats.missed}
          />
        </div>
        <div className="text-xs text-gray-600 font-medium min-w-8">
          {progressPercentage}%
        </div>
      </div>
    </div>
  );
};
