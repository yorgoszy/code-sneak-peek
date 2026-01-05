
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildDisplayWeeks } from "@/utils/programDisplayWeeks";
import { Program } from './types';

interface ProgramPreviewDialogProps {
  program: Program | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProgramPreviewDialog: React.FC<ProgramPreviewDialogProps> = ({
  program,
  isOpen,
  onOpenChange
}) => {
  if (!program) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle>Προεπισκόπηση: {program.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Program Info */}
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle>Στοιχεία Προγράμματος</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Όνομα:</strong> {program.name}</p>
                {program.description && (
                  <p><strong>Περιγραφή:</strong> {program.description}</p>
                )}
                {program.app_users && (
                  <p><strong>Αθλητής:</strong> {program.app_users.name}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Program Structure */}
          {(() => {
            const weeks = buildDisplayWeeks({
              baseWeeks: program.program_weeks,
              // Στα templates δεν έχουμε training_dates, αλλά αν κάποια στιγμή υπάρχουν, τις υποστηρίζουμε
              trainingDates: (program as any).training_dates
            });

            if (!weeks || weeks.length === 0) return null;

            return (
              <div className="space-y-4">
                {weeks.map((week, weekIndex) => (
                  <Card key={week.id} className="rounded-none">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Εβδομάδα {week.week_number}: {week.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {week.program_days && week.program_days.length > 0 ? (
                        <div className="space-y-3">
                          {week.program_days.map((day, dayIndex) => (
                            <div key={day.id} className="border p-3">
                              <h4 className="font-medium mb-2">
                                Ημέρα {day.day_number}: {day.name}
                              </h4>
                              {day.program_blocks && day.program_blocks.length > 0 ? (
                                <div className="space-y-2">
                                  {day.program_blocks.map((block, blockIndex) => (
                                    <div key={block.id} className="bg-gray-50 p-2">
                                      <h5 className="font-medium text-sm mb-1">
                                        Block {block.block_order}: {block.name}
                                      </h5>
                                      {block.program_exercises && block.program_exercises.length > 0 ? (
                                        <div className="space-y-1">
                                          {block.program_exercises.map((exercise, exerciseIndex) => (
                                            <div key={exercise.id} className="text-sm flex justify-between items-center">
                                              <span>{exercise.exercises?.name || 'Άγνωστη άσκηση'}</span>
                                              <span className="text-xs text-gray-600">
                                                {exercise.sets} sets × {exercise.reps} reps
                                                {exercise.kg && ` @ ${exercise.kg}kg`}
                                                {exercise.rest && ` (${exercise.rest})`}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-gray-500">Δεν υπάρχουν ασκήσεις</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">Δεν υπάρχουν blocks</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Δεν υπάρχουν ημέρες</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
