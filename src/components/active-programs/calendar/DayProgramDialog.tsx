
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface DayProgramDialogProps {
  isOpen: boolean;
  onClose: () => void;
  program: EnrichedAssignment | null;
  selectedDate: Date | null;
  workoutStatus: string;
}

export const DayProgramDialog: React.FC<DayProgramDialogProps> = ({
  isOpen,
  onClose,
  program,
  selectedDate,
  workoutStatus
}) => {
  if (!program || !selectedDate) return null;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'missed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'makeup':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Ολοκληρωμένη';
      case 'missed':
        return 'Χαμένη';
      case 'makeup':
        return 'Αναπλήρωση';
      default:
        return 'Προγραμματισμένη';
    }
  };

  // Βρίσκουμε την ημέρα της εβδομάδας για να εμφανίσουμε το σωστό πρόγραμμα
  const dayOfWeek = selectedDate.getDay();
  
  // Βρίσκουμε το πρόγραμμα για την συγκεκριμένη ημέρα
  const dayProgram = program.programs?.program_weeks?.[0]?.program_days?.find(
    day => day.day_number === dayOfWeek
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              Πρόγραμμα Προπόνησης - {format(selectedDate, 'dd MMMM yyyy', { locale: el })}
            </span>
            <Badge className={`rounded-none ${getStatusBadgeColor(workoutStatus)}`}>
              {getStatusText(workoutStatus)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Πληροφορίες Προγράμματος */}
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="text-lg">{program.programs?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Αθλητής:</span> {program.app_users?.name}
                </div>
                <div>
                  <span className="font-medium">Εκτιμώμενη Διάρκεια:</span> {dayProgram?.estimated_duration_minutes ? `${dayProgram.estimated_duration_minutes} λεπτά` : 'Μη καθορισμένη'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Πρόγραμμα Ημέρας */}
          {dayProgram ? (
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="text-lg">{dayProgram.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dayProgram.program_blocks?.map((block, blockIndex) => (
                    <div key={block.id} className="border border-gray-200 rounded-none">
                      <div className="bg-gray-50 px-4 py-2">
                        <h4 className="font-medium">{block.name}</h4>
                      </div>
                      <div className="p-4 space-y-3">
                        {block.program_exercises?.map((exercise, exerciseIndex) => (
                          <div key={exercise.id} className="bg-white border border-gray-100 p-3 rounded-none">
                            <div className="font-medium text-gray-900 mb-2">
                              {exerciseIndex + 1}. {exercise.exercises?.name}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Sets:</span> {exercise.sets}
                              </div>
                              <div>
                                <span className="font-medium">Reps:</span> {exercise.reps}
                              </div>
                              {exercise.kg && (
                                <div>
                                  <span className="font-medium">Βάρος:</span> {exercise.kg}kg
                                </div>
                              )}
                              {exercise.percentage_1rm && (
                                <div>
                                  <span className="font-medium">%1RM:</span> {exercise.percentage_1rm}%
                                </div>
                              )}
                              {exercise.velocity_ms && (
                                <div>
                                  <span className="font-medium">Ταχύτητα:</span> {exercise.velocity_ms}m/s
                                </div>
                              )}
                              {exercise.tempo && (
                                <div>
                                  <span className="font-medium">Tempo:</span> {exercise.tempo}
                                </div>
                              )}
                              {exercise.rest && (
                                <div>
                                  <span className="font-medium">Ανάπαυση:</span> {exercise.rest}
                                </div>
                              )}
                            </div>
                            {exercise.notes && (
                              <div className="mt-2 text-sm text-gray-500 italic">
                                Σημειώσεις: {exercise.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-none">
              <CardContent className="p-6 text-center text-gray-500">
                Δεν βρέθηκε πρόγραμμα για αυτή την ημέρα
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
