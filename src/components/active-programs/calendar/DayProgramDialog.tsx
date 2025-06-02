
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Play } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseVideoDialog } from '@/components/user-profile/daily-program/ExerciseVideoDialog';
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
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);

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

  const handleExerciseClick = (exercise: any) => {
    if (exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url)) {
      setSelectedExercise(exercise);
      setIsVideoDialogOpen(true);
    }
  };

  const renderVideoThumbnail = (exercise: any) => {
    const videoUrl = exercise.exercises?.video_url;
    if (!videoUrl || !isValidVideoUrl(videoUrl)) {
      return (
        <div className="w-8 h-6 bg-gray-200 rounded-none flex items-center justify-center flex-shrink-0">
          <span className="text-xs text-gray-400">-</span>
        </div>
      );
    }

    const thumbnailUrl = getVideoThumbnail(videoUrl);
    
    return (
      <div className="relative w-8 h-6 rounded-none overflow-hidden cursor-pointer group flex-shrink-0">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`${exercise.exercises?.name} thumbnail`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Play className="w-2 h-2 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-2 h-2 text-white" />
        </div>
      </div>
    );
  };

  // Βρίσκουμε την σωστή ημέρα βάσει των training_dates
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const trainingDates = program.training_dates || [];
  const dateIndex = trainingDates.findIndex(date => date === selectedDateStr);
  
  console.log('🔍 Looking for training day:', selectedDateStr);
  console.log('📅 Available training dates:', trainingDates);
  console.log('📍 Date index found:', dateIndex);

  // Βρίσκουμε την ημέρα προπόνησης που αντιστοιχεί στον δείκτη
  let dayProgram = null;
  if (dateIndex >= 0 && program.programs?.program_weeks?.[0]?.program_days) {
    const programDays = program.programs.program_weeks[0].program_days;
    // Αντιστοιχούμε τον δείκτη με την ημέρα προπόνησης
    dayProgram = programDays[dateIndex % programDays.length];
    console.log('✅ Found day program:', dayProgram?.name);
  }

  return (
    <>
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
            <div className="bg-white border border-gray-200 rounded-none p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {program.programs?.name}
                  </h3>
                  {program.programs?.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {program.programs.description}
                    </p>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <div><span className="font-medium">Αθλητής:</span> {program.app_users?.name}</div>
                  {dayProgram?.estimated_duration_minutes && (
                    <div><span className="font-medium">Διάρκεια:</span> {dayProgram.estimated_duration_minutes} λεπτά</div>
                  )}
                </div>
              </div>
            </div>

            {/* Πρόγραμμα Ημέρας */}
            {dayProgram ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                  <span>{dayProgram.name}</span>
                </h4>

                {dayProgram.program_blocks?.map((block) => (
                  <div key={block.id} className="bg-gray-700 rounded-none p-2 mb-1">
                    <h6 className="text-xs font-medium text-white mb-1">
                      {block.name}
                    </h6>
                    
                    <div className="space-y-0">
                      {block.program_exercises
                        ?.sort((a, b) => a.exercise_order - b.exercise_order)
                        .map((exercise) => (
                          <div key={exercise.id} className="bg-white rounded-none">
                            {/* Exercise Header */}
                            <div className="flex items-center gap-2 p-1 border-b border-gray-100">
                              <div 
                                onClick={() => handleExerciseClick(exercise)}
                                className="flex-shrink-0"
                              >
                                {renderVideoThumbnail(exercise)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h6 
                                  className={`text-xs font-medium text-gray-900 truncate ${
                                    exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url) 
                                      ? 'cursor-pointer hover:text-blue-600' 
                                      : ''
                                  }`}
                                  onClick={() => handleExerciseClick(exercise)}
                                >
                                  {exercise.exercises?.name || 'Άγνωστη άσκηση'}
                                </h6>
                              </div>
                            </div>
                            
                            {/* Exercise Details Grid */}
                            <div className="p-1 bg-gray-50">
                              <div className="flex text-xs">
                                <div className="flex-1 text-center">
                                  <div className="font-medium text-gray-600 mb-1">Sets</div>
                                  <div className="text-gray-900">{exercise.sets}</div>
                                </div>
                                
                                <Separator orientation="vertical" className="h-10 mx-1" />
                                
                                <div className="flex-1 text-center">
                                  <div className="font-medium text-gray-600 mb-1">Reps</div>
                                  <div className="text-gray-900">{exercise.reps}</div>
                                </div>
                                
                                {exercise.kg && (
                                  <>
                                    <Separator orientation="vertical" className="h-10 mx-1" />
                                    <div className="flex-1 text-center">
                                      <div className="font-medium text-gray-600 mb-1">Kg</div>
                                      <div className="text-gray-900">{exercise.kg}</div>
                                    </div>
                                  </>
                                )}
                                
                                {exercise.percentage_1rm && (
                                  <>
                                    <Separator orientation="vertical" className="h-10 mx-1" />
                                    <div className="flex-1 text-center">
                                      <div className="font-medium text-gray-600 mb-1">%1RM</div>
                                      <div className="text-gray-900">{exercise.percentage_1rm}%</div>
                                    </div>
                                  </>
                                )}
                                
                                {exercise.velocity_ms && (
                                  <>
                                    <Separator orientation="vertical" className="h-10 mx-1" />
                                    <div className="flex-1 text-center">
                                      <div className="font-medium text-gray-600 mb-1">m/s</div>
                                      <div className="text-gray-900">{exercise.velocity_ms}</div>
                                    </div>
                                  </>
                                )}
                                
                                {exercise.tempo && (
                                  <>
                                    <Separator orientation="vertical" className="h-10 mx-1" />
                                    <div className="flex-1 text-center">
                                      <div className="font-medium text-gray-600 mb-1">Tempo</div>
                                      <div className="text-gray-900">{exercise.tempo}</div>
                                    </div>
                                  </>
                                )}
                                
                                {exercise.rest && (
                                  <>
                                    <Separator orientation="vertical" className="h-10 mx-1" />
                                    <div className="flex-1 text-center">
                                      <div className="font-medium text-gray-600 mb-1">Rest</div>
                                      <div className="text-gray-900">{exercise.rest}</div>
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              {exercise.notes && (
                                <div className="mt-1 text-xs text-gray-600 italic">
                                  {exercise.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-none p-6 text-center text-gray-500">
                Δεν βρέθηκε πρόγραμμα για αυτή την ημέρα
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ExerciseVideoDialog
        isOpen={isVideoDialogOpen}
        onClose={() => setIsVideoDialogOpen(false)}
        exercise={selectedExercise}
      />
    </>
  );
};
