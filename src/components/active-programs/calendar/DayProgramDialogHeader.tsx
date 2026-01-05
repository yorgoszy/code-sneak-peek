
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Play, CheckCircle, X, FlaskConical, Trophy } from "lucide-react";
import { WorkoutTimer } from "./WorkoutTimer";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

const TEST_TYPE_LABELS: Record<string, string> = {
  anthropometric: 'Ανθρωπομετρικά',
  functional: 'Λειτουργικά',
  endurance: 'Αντοχή',
  jump: 'Άλματα',
  strength: 'Δύναμη'
};

interface DayProgramDialogHeaderProps {
  selectedDate: Date;
  workoutInProgress: boolean;
  elapsedTime: number;
  workoutStatus: string;
  rpeScore?: number | null;
  onStartWorkout: () => void;
  onCompleteWorkout: () => void;
  onCancelWorkout: () => void;
  onMinimize?: () => void;
  program: EnrichedAssignment;
  onClose: () => void;
}

const getRpeColor = (rpe: number) => {
  if (rpe <= 6) return 'bg-green-500';
  if (rpe <= 8) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const DayProgramDialogHeader: React.FC<DayProgramDialogHeaderProps> = ({
  selectedDate,
  workoutInProgress,
  elapsedTime,
  workoutStatus,
  rpeScore,
  onStartWorkout,
  onCompleteWorkout,
  onCancelWorkout,
  onMinimize,
  program,
  onClose
}) => {
  const isCompleted = workoutStatus === 'completed';

  // Βρίσκουμε το day program για την επιλεγμένη ημερομηνία
  const getDayProgram = () => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const trainingDates = program.training_dates || [];
    const dateIndex = trainingDates.findIndex(date => date === selectedDateStr);
    
    if (dateIndex === -1) return null;

    const weeks = program.programs?.program_weeks || [];
    const sortedWeeks = [...weeks].sort((a, b) => (a.week_number || 0) - (b.week_number || 0));
    
    let cumulativeDays = 0;
    for (const week of sortedWeeks) {
      const sortedDays = [...(week.program_days || [])].sort((a, b) => (a.day_number || 0) - (b.day_number || 0));
      const daysInWeek = sortedDays.length;
      
      if (dateIndex < cumulativeDays + daysInWeek) {
        const dayIndexInWeek = dateIndex - cumulativeDays;
        return sortedDays[dayIndexInWeek];
      }
      
      cumulativeDays += daysInWeek;
    }

    return null;
  };

  const dayProgram = getDayProgram();
  const isTestDay = dayProgram?.is_test_day || false;
  const isCompetitionDay = dayProgram?.is_competition_day || false;
  const testTypes = dayProgram?.test_types || [];

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 p-2">
      <div className="flex items-center justify-between gap-4">
        {/* Όνομα χρήστη και ημερομηνία */}
        <div className="text-left min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              {program.app_users?.name || 'Άγνωστος Αθλητής'}
            </h2>
            {isTestDay && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 rounded-none text-xs px-1.5 py-0">
                <FlaskConical className="w-3 h-3 mr-1" />
                Τεστ
              </Badge>
            )}
            {isCompetitionDay && (
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 rounded-none text-xs px-1.5 py-0">
                <Trophy className="w-3 h-3 mr-1" />
                Αγώνας
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-600">
              {format(selectedDate, 'EEEE, d/M/yyyy', { locale: el })}
            </p>
            {isTestDay && testTypes.length > 0 && (
              <p className="text-xs text-yellow-600">
                ({testTypes.map(type => TEST_TYPE_LABELS[type] || type).join(', ')})
              </p>
            )}
          </div>
        </div>
        
        {/* Timer */}
        <div className="flex-shrink-0">
          <WorkoutTimer 
            workoutInProgress={workoutInProgress}
            elapsedTime={elapsedTime} 
          />
        </div>

        {/* Κουμπιά ελέγχου */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isCompleted ? (
            <>
              <Badge className="bg-green-100 text-green-800 border-green-200 rounded-none text-xs px-2 py-0.5">
                Ολοκληρωμένη
              </Badge>
              {rpeScore && (
                <span className={`text-[10px] text-white px-1 rounded-none font-bold ${getRpeColor(rpeScore)}`}>
                  RPE {rpeScore}
                </span>
              )}
              <button
                onClick={onClose}
                className="border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-none inline-flex items-center justify-center whitespace-nowrap text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 w-7 p-0"
                title="Κλείσιμο"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : workoutInProgress ? (
            <>
              <button
                onClick={onCompleteWorkout}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none inline-flex items-center justify-center whitespace-nowrap text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 w-7 p-0"
                title="Ολοκλήρωση"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={onCancelWorkout}
                className="border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-none inline-flex items-center justify-center whitespace-nowrap text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 w-7 p-0"
                title="Ακύρωση"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onStartWorkout}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none inline-flex items-center justify-center whitespace-nowrap text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 w-7 p-0"
                title="Έναρξη"
              >
                <Play className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-none inline-flex items-center justify-center whitespace-nowrap text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 w-7 p-0"
                title="Κλείσιμο"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
