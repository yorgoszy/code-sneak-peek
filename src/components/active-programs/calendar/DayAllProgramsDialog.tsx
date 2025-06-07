
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Calendar, Clock, User, Dumbbell } from "lucide-react";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface DayAllProgramsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  programs: EnrichedAssignment[];
  allCompletions: any[];
  onProgramClick: (program: EnrichedAssignment) => void;
}

export const DayAllProgramsDialog: React.FC<DayAllProgramsDialogProps> = ({
  isOpen,
  onClose,
  selectedDate,
  programs,
  allCompletions,
  onProgramClick
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

  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case 'completed':
        return { 
          variant: 'default' as const, 
          className: 'bg-[#00ffba] text-black hover:bg-[#00ffba]/90',
          text: 'Ολοκληρώθηκε'
        };
      case 'missed':
        return { 
          variant: 'destructive' as const, 
          className: '',
          text: 'Απουσία'
        };
      case 'in_progress':
        return { 
          variant: 'default' as const, 
          className: 'bg-orange-500 text-white hover:bg-orange-600',
          text: 'Σε εξέλιξη'
        };
      default:
        return { 
          variant: 'secondary' as const, 
          className: '',
          text: 'Προγραμματισμένο'
        };
    }
  };

  const dayPrograms = getDayPrograms();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#00ffba]" />
            Προγράμματα για {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: el })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {dayPrograms.length > 0 ? (
            <>
              <div className="text-sm text-gray-600 mb-4">
                Συνολικά {dayPrograms.length} προγράμματα για αυτή την ημέρα
              </div>
              
              <div className="grid gap-4">
                {dayPrograms.map((program) => {
                  const workoutStatus = getWorkoutStatus(program);
                  const userName = program.app_users?.name || 'Άγνωστος χρήστης';
                  const statusProps = getStatusBadgeProps(workoutStatus);
                  
                  return (
                    <div 
                      key={program.id} 
                      className="p-4 border border-gray-200 rounded-none hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => onProgramClick(program)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <h4 className="font-semibold text-gray-900">{userName}</h4>
                          </div>
                        </div>
                        <Badge 
                          variant={statusProps.variant}
                          className={`rounded-none ${statusProps.className}`}
                        >
                          {statusProps.text}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-4 w-4 text-gray-500" />
                          <p className="font-medium text-gray-800">{program.programs?.name}</p>
                        </div>
                        
                        {program.programs?.description && (
                          <p className="text-sm text-gray-600 ml-6">{program.programs.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 ml-6 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Εκτιμώμενη διάρκεια: {program.programs?.program_weeks?.[0]?.program_days?.[0]?.estimated_duration_minutes || 'Δεν έχει οριστεί'} λεπτά</span>
                          </div>
                        </div>

                        {/* Εμφάνιση των ημερών της εβδομάδας αν υπάρχουν */}
                        {program.programs?.program_weeks?.[0]?.program_days && (
                          <div className="ml-6 mt-2">
                            <div className="text-xs text-gray-500 mb-1">Ημέρες προπόνησης:</div>
                            <div className="flex flex-wrap gap-1">
                              {program.programs.program_weeks[0].program_days.map((day, index) => (
                                <span 
                                  key={day.id} 
                                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-none"
                                >
                                  {day.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-2">Δεν υπάρχουν προγράμματα</p>
              <p className="text-sm">Δεν έχουν προγραμματιστεί προπονήσεις για αυτή την ημέρα</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
