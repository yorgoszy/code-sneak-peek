
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Square, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseVideoDialog } from '@/components/user-profile/daily-program/ExerciseVideoDialog';
import { useExerciseCompletion } from '@/hooks/useExerciseCompletion';
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
  const [workoutInProgress, setWorkoutInProgress] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const { completeSet, getRemainingText, isExerciseComplete } = useExerciseCompletion();

  // Χρονόμετρο
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (workoutInProgress && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutInProgress, startTime]);

  // Format elapsed time to MM:SS
  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  const handleStartWorkout = () => {
    console.log('🏋️‍♂️ Έναρξη προπόνησης για ημερομηνία:', format(selectedDate, 'dd/MM/yyyy'));
    console.log('📋 Program ID:', program.id);
    console.log('👤 User:', program.app_users?.name);
    
    setWorkoutInProgress(true);
    setStartTime(new Date());
    setElapsedTime(0);
  };

  const handleCompleteWorkout = () => {
    console.log('✅ Ολοκλήρωση προπόνησης');
    console.log('⏱️ Συνολικός χρόνος:', formatElapsedTime(elapsedTime));
    
    setWorkoutInProgress(false);
    setStartTime(null);
    setElapsedTime(0);
    // Εδώ θα μπορούσαμε να αποθηκεύσουμε τα δεδομένα της προπόνησης
  };

  const handleCancelWorkout = () => {
    console.log('❌ Ακύρωση προπόνησης');
    
    setWorkoutInProgress(false);
    setStartTime(null);
    setElapsedTime(0);
  };

  const handleExerciseClick = (exercise: any, event: React.MouseEvent) => {
    // Αν δεν έχει ξεκινήσει η προπόνηση, δεν επιτρέπουμε κλικ στις ασκήσεις
    if (!workoutInProgress) {
      console.log('⚠️ Πρέπει να ξεκινήσεις την προπόνηση πρώτα!');
      return;
    }

    // Αν κλικάρουμε στο video thumbnail, ανοίγει το video
    if ((event.target as HTMLElement).closest('.video-thumbnail')) {
      if (exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url)) {
        setSelectedExercise(exercise);
        setIsVideoDialogOpen(true);
      }
      return;
    }

    // Αλλιώς, ολοκληρώνουμε ένα σετ
    completeSet(exercise.id, exercise.sets);
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
      <div className="relative w-8 h-6 rounded-none overflow-hidden cursor-pointer group flex-shrink-0 video-thumbnail">
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

  let dayProgram = null;
  if (dateIndex >= 0 && program.programs?.program_weeks?.[0]?.program_days) {
    const programDays = program.programs.program_weeks[0].program_days;
    dayProgram = programDays[dateIndex % programDays.length];
    console.log('✅ Found day program:', dayProgram?.name);
  }

  const renderBlockTabs = (blocks: any[]) => {
    if (!blocks || blocks.length === 0) return null;

    // Αν έχουμε μόνο ένα block, το εμφανίζουμε χωρίς tabs
    if (blocks.length === 1) {
      const block = blocks[0];
      return (
        <div className="bg-gray-700 rounded-none p-2 mb-1">
          <h6 className="text-xs font-medium text-white mb-1">
            {block.name}
          </h6>
          
          <div className="space-y-0">
            {block.program_exercises
              ?.sort((a: any, b: any) => a.exercise_order - b.exercise_order)
              .map((exercise: any) => {
                const remainingText = getRemainingText(exercise.id, exercise.sets);
                const isComplete = isExerciseComplete(exercise.id, exercise.sets);
                
                return (
                  <div key={exercise.id} className="bg-white rounded-none">
                    {/* Exercise Header */}
                    <div 
                      className={`flex items-center gap-2 p-1 border-b border-gray-100 ${
                        workoutInProgress ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-50'
                      } ${isComplete ? 'bg-green-50' : ''}`}
                      onClick={(e) => handleExerciseClick(exercise, e)}
                    >
                      <div className="flex-shrink-0">
                        {renderVideoThumbnail(exercise)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h6 className={`text-xs font-medium truncate ${
                          isComplete ? 'text-green-800' : 'text-gray-900'
                        }`}>
                          {exercise.exercises?.name || 'Άγνωστη άσκηση'}
                        </h6>
                      </div>
                    </div>
                    
                    {/* Exercise Details Grid */}
                    <div className="p-1 bg-gray-50">
                      <div className="flex text-xs" style={{ width: '70%' }}>
                        <div className="flex-1 text-center">
                          <div className="font-medium text-gray-600 mb-1">Sets</div>
                          <div className={`${isComplete ? 'text-green-700 font-semibold' : 'text-gray-900'}`}>
                            {exercise.sets || '-'}{remainingText}
                          </div>
                        </div>
                        
                        <Separator orientation="vertical" className="h-10 mx-1" />
                        
                        <div className="flex-1 text-center">
                          <div className="font-medium text-gray-600 mb-1">Reps</div>
                          <div className="text-gray-900">{exercise.reps || '-'}</div>
                        </div>
                        
                        <Separator orientation="vertical" className="h-10 mx-1" />
                        
                        <div className="flex-1 text-center">
                          <div className="font-medium text-gray-600 mb-1">%1RM</div>
                          <div className="text-gray-900">{exercise.percentage_1rm ? `${exercise.percentage_1rm}%` : '-'}</div>
                        </div>
                        
                        <Separator orientation="vertical" className="h-10 mx-1" />
                        
                        <div className="flex-1 text-center">
                          <div className="font-medium text-gray-600 mb-1">Kg</div>
                          <div className="text-gray-900">{exercise.kg || '-'}</div>
                        </div>
                        
                        <Separator orientation="vertical" className="h-10 mx-1" />
                        
                        <div className="flex-1 text-center">
                          <div className="font-medium text-gray-600 mb-1">m/s</div>
                          <div className="text-gray-900">{exercise.velocity_ms || '-'}</div>
                        </div>
                        
                        <Separator orientation="vertical" className="h-10 mx-1" />
                        
                        <div className="flex-1 text-center">
                          <div className="font-medium text-gray-600 mb-1">Tempo</div>
                          <div className="text-gray-900">{exercise.tempo || '-'}</div>
                        </div>
                        
                        <Separator orientation="vertical" className="h-10 mx-1" />
                        
                        <div className="flex-1 text-center">
                          <div className="font-medium text-gray-600 mb-1">Rest</div>
                          <div className="text-gray-900">{exercise.rest || '-'}</div>
                        </div>
                      </div>
                      
                      {exercise.notes && (
                        <div className="mt-1 text-xs text-gray-600 italic">
                          {exercise.notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      );
    }

    // Αν έχουμε πολλαπλά blocks, τα εμφανίζουμε ως tabs
    return (
      <Tabs defaultValue={blocks[0]?.id} className="w-full">
        <TabsList className="grid w-full rounded-none" style={{ gridTemplateColumns: `repeat(${blocks.length}, 1fr)` }}>
          {blocks
            .sort((a, b) => a.block_order - b.block_order)
            .map((block) => (
              <TabsTrigger key={block.id} value={block.id} className="rounded-none text-xs">
                {block.name}
              </TabsTrigger>
            ))}
        </TabsList>
        
        {blocks.map((block) => (
          <TabsContent key={block.id} value={block.id} className="mt-2">
            <div className="space-y-0">
              {block.program_exercises
                ?.sort((a: any, b: any) => a.exercise_order - b.exercise_order)
                .map((exercise: any) => {
                  const remainingText = getRemainingText(exercise.id, exercise.sets);
                  const isComplete = isExerciseComplete(exercise.id, exercise.sets);
                  
                  return (
                    <div key={exercise.id} className="bg-white rounded-none border border-gray-200">
                      {/* Exercise Header */}
                      <div 
                        className={`flex items-center gap-2 p-1 border-b border-gray-100 ${
                          workoutInProgress ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-50'
                        } ${isComplete ? 'bg-green-50' : ''}`}
                        onClick={(e) => handleExerciseClick(exercise, e)}
                      >
                        <div className="flex-shrink-0">
                          {renderVideoThumbnail(exercise)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h6 className={`text-xs font-medium truncate ${
                            isComplete ? 'text-green-800' : 'text-gray-900'
                          }`}>
                            {exercise.exercises?.name || 'Άγνωστη άσκηση'}
                          </h6>
                        </div>
                      </div>
                      
                      {/* Exercise Details Grid */}
                      <div className="p-1 bg-gray-50">
                        <div className="flex text-xs" style={{ width: '70%' }}>
                          <div className="flex-1 text-center">
                            <div className="font-medium text-gray-600 mb-1">Sets</div>
                            <div className={`${isComplete ? 'text-green-700 font-semibold' : 'text-gray-900'}`}>
                              {exercise.sets || '-'}{remainingText}
                            </div>
                          </div>
                          
                          <Separator orientation="vertical" className="h-10 mx-1" />
                          
                          <div className="flex-1 text-center">
                            <div className="font-medium text-gray-600 mb-1">Reps</div>
                            <div className="text-gray-900">{exercise.reps || '-'}</div>
                          </div>
                          
                          <Separator orientation="vertical" className="h-10 mx-1" />
                          
                          <div className="flex-1 text-center">
                            <div className="font-medium text-gray-600 mb-1">%1RM</div>
                            <div className="text-gray-900">{exercise.percentage_1rm ? `${exercise.percentage_1rm}%` : '-'}</div>
                          </div>
                          
                          <Separator orientation="vertical" className="h-10 mx-1" />
                          
                          <div className="flex-1 text-center">
                            <div className="font-medium text-gray-600 mb-1">Kg</div>
                            <div className="text-gray-900">{exercise.kg || '-'}</div>
                          </div>
                          
                          <Separator orientation="vertical" className="h-10 mx-1" />
                          
                          <div className="flex-1 text-center">
                            <div className="font-medium text-gray-600 mb-1">m/s</div>
                            <div className="text-gray-900">{exercise.velocity_ms || '-'}</div>
                          </div>
                          
                          <Separator orientation="vertical" className="h-10 mx-1" />
                          
                          <div className="flex-1 text-center">
                            <div className="font-medium text-gray-600 mb-1">Tempo</div>
                            <div className="text-gray-900">{exercise.tempo || '-'}</div>
                          </div>
                          
                          <Separator orientation="vertical" className="h-10 mx-1" />
                          
                          <div className="flex-1 text-center">
                            <div className="font-medium text-gray-600 mb-1">Rest</div>
                            <div className="text-gray-900">{exercise.rest || '-'}</div>
                          </div>
                        </div>
                        
                        {exercise.notes && (
                          <div className="mt-1 text-xs text-gray-600 italic">
                            {exercise.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                Πρόγραμμα Προπόνησης - {format(selectedDate, 'dd MMMM yyyy', { locale: el })}
              </span>
              <div className="flex items-center gap-2">
                {/* Χρονόμετρο */}
                {workoutInProgress && (
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-none text-sm font-mono">
                    ⏱️ {formatElapsedTime(elapsedTime)}
                  </div>
                )}
                
                {/* Κουμπιά ελέγχου προπόνησης */}
                {!workoutInProgress && workoutStatus !== 'completed' && (
                  <Button
                    onClick={handleStartWorkout}
                    size="sm"
                    className="rounded-none flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Έναρξη
                  </Button>
                )}
                
                {workoutInProgress && (
                  <>
                    <Button
                      onClick={handleCompleteWorkout}
                      size="sm"
                      className="rounded-none flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Ολοκλήρωση
                    </Button>
                    <Button
                      onClick={handleCancelWorkout}
                      size="sm"
                      variant="outline"
                      className="rounded-none flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Ακύρωση
                    </Button>
                  </>
                )}
                
                <Badge className={`rounded-none ${getStatusBadgeColor(workoutStatus)}`}>
                  {getStatusText(workoutStatus)}
                </Badge>
              </div>
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
              
              {/* Οδηγίες για τον χρήστη */}
              {!workoutInProgress && workoutStatus !== 'completed' && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-none">
                  <p className="text-xs text-blue-700">
                    💡 Πάτησε "Έναρξη" για να ξεκινήσεις την προπόνηση και να μπορείς να κάνεις κλικ στις ασκήσεις για να μειώνεις τα sets.
                  </p>
                </div>
              )}
              
              {workoutInProgress && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-none">
                  <p className="text-xs text-green-700">
                    🏋️‍♂️ Προπόνηση σε εξέλιξη! Κάνε κλικ στις ασκήσεις για να ολοκληρώνεις τα sets.
                  </p>
                </div>
              )}
            </div>

            {/* Πρόγραμμα Ημέρας */}
            {dayProgram ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                  <span>{dayProgram.name}</span>
                </h4>

                {renderBlockTabs(dayProgram.program_blocks)}
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
