
import React from 'react';
import { EnhancedProgressBar } from './EnhancedProgressBar';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCardProgressProps {
  assignment: EnrichedAssignment;
  workoutStats: {
    completed: number;
    total: number;
    missed: number;
    averageRpe?: number;
  };
}

export const ProgramCardProgress: React.FC<ProgramCardProgressProps> = ({ 
  assignment, 
  workoutStats 
}) => {
  // Check if program has test or competition days
  const hasTestDays = assignment.programs?.program_weeks?.some(week =>
    week.program_days?.some(day => day.is_test_day)
  ) || false;
  
  const hasCompetitionDays = assignment.programs?.program_weeks?.some(week =>
    week.program_days?.some(day => day.is_competition_day)
  ) || false;

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
    
    // Δημιουργούμε τα initials με τη σειρά του προγράμματος (χωρίς λεπτά)
    const dayLabels = firstCycleDates.map((dateStr, index) => {
      const date = new Date(dateStr + 'T00:00:00'); // Προσθέτουμε time για να αποφύγουμε timezone issues
      const dayIndex = date.getDay();
      return dayInitials[dayIndex];
    });

    return dayLabels.join(' - ');
  };

  const progressPercentage = workoutStats.total > 0 ? Math.round((workoutStats.completed / workoutStats.total) * 100) : 0;

  const getRpeColor = (rpe: number) => {
    if (rpe <= 6) return 'bg-green-500';
    if (rpe <= 8) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
      {/* Test/Competition Day Indicators - Κίτρινη γραμμή για ΤΕΣΤ, Μοβ για ΑΓΩΝΕΣ */}
      {hasTestDays && (
        <div className="w-4 h-2 bg-yellow-500" title="Περιέχει τεστ" />
      )}
      {hasCompetitionDays && (
        <div className="w-4 h-2 bg-purple-600" title="Περιέχει αγώνα" />
      )}
      
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
        {workoutStats.averageRpe && (
          <div className={`text-[10px] text-white px-1 rounded-none font-bold ${getRpeColor(workoutStats.averageRpe)}`}>
            RPE {workoutStats.averageRpe.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
};
