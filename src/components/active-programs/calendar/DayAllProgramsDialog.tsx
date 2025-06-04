
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { CalendarProgramItem } from './CalendarProgramItem';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface DayAllProgramsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  programs: EnrichedAssignment[];
  allCompletions: any[];
  onProgramClick: (program: EnrichedAssignment) => void;
  containerId?: string;
}

export const DayAllProgramsDialog: React.FC<DayAllProgramsDialogProps> = ({
  isOpen,
  onClose,
  selectedDate,
  programs,
  allCompletions,
  onProgramClick,
  containerId
}) => {
  if (!selectedDate) return null;

  const dayString = format(selectedDate, 'yyyy-MM-dd');
  
  const getDayPrograms = () => {
    return programs.filter(program => {
      if (program.training_dates && Array.isArray(program.training_dates)) {
        return program.training_dates.includes(dayString);
      }
      return false;
    });
  };

  const getWorkoutStatus = (program: EnrichedAssignment) => {
    const completion = allCompletions.find(c => 
      c.assignment_id === program.id && 
      c.scheduled_date === dayString
    );

    if (completion) {
      return completion.status;
    }

    return 'scheduled';
  };

  const dayPrograms = getDayPrograms();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-none">
        <DialogHeader>
          <DialogTitle>
            Προγράμματα για {format(selectedDate, 'dd/MM/yyyy')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {dayPrograms.length > 0 ? (
            dayPrograms.map((program) => {
              const workoutStatus = getWorkoutStatus(program);
              const userName = program.app_users?.name || 'Άγνωστος χρήστης';
              
              return (
                <div key={program.id} className="p-3 border border-gray-200 rounded-none hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{userName}</h4>
                    <span className={`px-2 py-1 text-xs rounded-none ${
                      workoutStatus === 'completed' ? 'bg-green-100 text-green-800' :
                      workoutStatus === 'missed' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {workoutStatus === 'completed' ? 'Ολοκληρώθηκε' :
                       workoutStatus === 'missed' ? 'Απουσία' : 'Προγραμματισμένο'}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">{program.programs?.name}</p>
                    {program.programs?.description && (
                      <p className="text-xs text-gray-500">{program.programs.description}</p>
                    )}
                  </div>

                  <CalendarProgramItem
                    program={program}
                    workoutStatus={workoutStatus}
                    allCompletions={allCompletions}
                    onClick={() => onProgramClick(program)}
                  />
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              Δεν υπάρχουν προγράμματα για αυτή την ημέρα
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
