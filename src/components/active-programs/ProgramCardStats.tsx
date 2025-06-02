
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock } from "lucide-react";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCardStatsProps {
  assignment: EnrichedAssignment;
}

export const ProgramCardStats: React.FC<ProgramCardStatsProps> = ({ assignment }) => {
  const progress = assignment.progress || 0;

  const getProgramStats = (program: any) => {
    if (!program?.programs?.program_weeks) {
      return { weeksCount: 0, daysCount: 0, trainingDatesCount: 0 };
    }
    
    const weeks = program.programs.program_weeks;
    const weeksCount = weeks.length;
    const daysCount = weeks.reduce((total: number, week: any) => 
      total + (week.program_days?.length || 0), 0);
    const trainingDatesCount = program.training_dates?.length || 0;
    
    return { weeksCount, daysCount, trainingDatesCount };
  };

  const formatTrainingDates = (dates: string[] | undefined) => {
    if (!dates || dates.length === 0) return 'Δεν έχουν οριστεί ημερομηνίες';
    
    const sortedDates = [...dates].sort();
    if (sortedDates.length <= 3) {
      return sortedDates.map(date => new Date(date).toLocaleDateString('el-GR')).join(', ');
    }
    
    const firstTwo = sortedDates.slice(0, 2).map(date => new Date(date).toLocaleDateString('el-GR'));
    return `${firstTwo.join(', ')} και ${sortedDates.length - 2} ακόμη`;
  };

  const { weeksCount, daysCount, trainingDatesCount } = getProgramStats(assignment);

  return (
    <div className="space-y-4">
      {/* Πρόοδος */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Πρόοδος</span>
          <span className="text-gray-600">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Στατιστικά προγράμματος */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-lg font-semibold text-blue-600">{weeksCount}</div>
          <div className="text-xs text-gray-600">Εβδομάδες</div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-lg font-semibold text-green-600">{daysCount}</div>
          <div className="text-xs text-gray-600">Ημέρες</div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-lg font-semibold text-purple-600">{trainingDatesCount}</div>
          <div className="text-xs text-gray-600">Προπονήσεις</div>
        </div>
      </div>
      
      {/* Ημερομηνίες προπόνησης */}
      <div className="text-sm">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="font-medium">Ημερομηνίες προπόνησης:</span>
        </div>
        <div className="text-gray-600 ml-6 bg-gray-50 p-2 rounded">
          {formatTrainingDates(assignment.training_dates)}
        </div>
      </div>
      
      {/* Περίοδος προγράμματος */}
      {(assignment.start_date || assignment.end_date) && (
        <div className="text-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Περίοδος:</span>
          </div>
          <div className="text-gray-600 ml-6">
            {assignment.start_date && (
              <span>Από {new Date(assignment.start_date).toLocaleDateString('el-GR')}</span>
            )}
            {assignment.start_date && assignment.end_date && <span> - </span>}
            {assignment.end_date && (
              <span>Έως {new Date(assignment.end_date).toLocaleDateString('el-GR')}</span>
            )}
          </div>
        </div>
      )}
      
      {/* Σημειώσεις */}
      {assignment.notes && (
        <div className="text-sm">
          <span className="font-medium">Σημειώσεις: </span>
          <span className="text-gray-600">{assignment.notes}</span>
        </div>
      )}
    </div>
  );
};
