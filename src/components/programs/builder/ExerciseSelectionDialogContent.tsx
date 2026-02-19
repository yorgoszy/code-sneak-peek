import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Filter, Plus, X, Save, FolderOpen, Play, AlertTriangle, Check } from "lucide-react";
import { ExerciseFilters } from './ExerciseFilters';
import { ExerciseSearchInput } from './ExerciseSearchInput';
import { AddExerciseDialog } from '@/components/AddExerciseDialog';
import { CreateBlockTemplateDialog } from './CreateBlockTemplateDialog';
import { SelectBlockTemplateDialog } from './SelectBlockTemplateDialog';
import { useExerciseRealtime } from './hooks/useExerciseRealtime';
import { useExerciseWithCategories } from './hooks/useExerciseWithCategories';
import { useFmsExerciseStatusContext } from '@/contexts/FmsExerciseStatusContext';
import { matchesSearchTerm } from "@/lib/utils";
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { cn } from '@/lib/utils';
import { RedExerciseAlternativesDialog } from './RedExerciseAlternativesDialog';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
}

interface ExerciseSelectionDialogContentProps {
  exercises: Exercise[];
  onSelectExercise: (exerciseId: string) => void;
  onClose: () => void;
  onExercisesUpdate?: (exercises: Exercise[]) => void;
  onSelectBlockTemplate?: (template: any) => void;
  coachId?: string;
}

export const ExerciseSelectionDialogContent: React.FC<ExerciseSelectionDialogContentProps> = ({
  exercises: initialExercises,
  onSelectExercise,
  onClose,
  onExercisesUpdate,
  onSelectBlockTemplate,
  coachId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
  const [createTemplateDialogOpen, setCreateTemplateDialogOpen] = useState(false);
  const [selectTemplateDialogOpen, setSelectTemplateDialogOpen] = useState(false);
  
  // Multi-select state
  const [multiSelectedIds, setMultiSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  // Red exercise alternatives popup state
  const [redExercisePopup, setRedExercisePopup] = useState<{
    open: boolean;
    exercise: Exercise | null;
  }>({ open: false, exercise: null });

  // Get FMS exercise status from context
  const { exerciseStatusMap, loading: fmsLoading } = useFmsExerciseStatusContext();

  // Handle real-time exercise updates
  const { currentExercises } = useExerciseRealtime(initialExercises, (newExercise) => {
    console.log('🎯 Real-time exercise received, adding with categories:', newExercise.name);
    addExerciseWithCategories(newExercise);
    if (onExercisesUpdate) {
      onExercisesUpdate([...exercisesWithCategories, newExercise]);
    }
  });

  // Handle exercises with categories
  const { exercisesWithCategories, addExerciseWithCategories } = useExerciseWithCategories(currentExercises);

  const filteredExercises = useMemo(() => {
    let filtered = exercisesWithCategories;

    if (searchTerm.trim()) {
      filtered = filtered.filter((exercise) => matchesSearchTerm(exercise.name, searchTerm));
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((exercise) => {
        if (!exercise.categories || exercise.categories.length === 0) return false;
        return selectedCategories.every((selectedCat) =>
          exercise.categories!.some((exerciseCat) => exerciseCat.toLowerCase() === selectedCat.toLowerCase())
        );
      });
    }

    return filtered;
  }, [exercisesWithCategories, searchTerm, selectedCategories]);

  // Get exercise background color based on FMS status
  const getExerciseBgColor = (exerciseId: string) => {
    const status = exerciseStatusMap.get(exerciseId);
    if (status === 'red') return 'bg-red-100 hover:bg-red-200';
    if (status === 'yellow') return 'bg-yellow-100 hover:bg-yellow-200';
    return '';
  };

  // Toggle multi-select for an exercise
  const toggleMultiSelect = useCallback((exerciseId: string) => {
    setMultiSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      // Exit multi-select mode if nothing selected
      if (next.size === 0) setIsMultiSelectMode(false);
      return next;
    });
    if (!isMultiSelectMode) setIsMultiSelectMode(true);
  }, [isMultiSelectMode]);

  // Confirm multi-select: add all selected exercises
  const confirmMultiSelect = useCallback(async () => {
    const ids = Array.from(multiSelectedIds);
    for (const id of ids) {
      onSelectExercise(id);
      // Small delay to allow async addExercise to process sequentially
      await new Promise(r => setTimeout(r, 50));
    }
    setMultiSelectedIds(new Set());
    setIsMultiSelectMode(false);
    onClose();
    setSearchTerm('');
    setSelectedCategories([]);
  }, [multiSelectedIds, onSelectExercise, onClose]);

  // Cancel multi-select
  const cancelMultiSelect = useCallback(() => {
    setMultiSelectedIds(new Set());
    setIsMultiSelectMode(false);
  }, []);

  // Handle Enter key for confirming multi-select
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isMultiSelectMode && multiSelectedIds.size > 0) {
        e.preventDefault();
        confirmMultiSelect();
      }
      if (e.key === 'Escape' && isMultiSelectMode) {
        e.preventDefault();
        cancelMultiSelect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMultiSelectMode, multiSelectedIds, confirmMultiSelect, cancelMultiSelect]);

  const handleSelectExercise = (exercise: Exercise, e: React.MouseEvent) => {
    // Ctrl+Click or Meta+Click = multi-select
    if (e.ctrlKey || e.metaKey) {
      toggleMultiSelect(exercise.id);
      return;
    }

    // If already in multi-select mode, keep toggling
    if (isMultiSelectMode) {
      toggleMultiSelect(exercise.id);
      return;
    }

    const status = exerciseStatusMap.get(exercise.id);
    
    // If it's a red exercise, show the alternatives popup
    if (status === 'red') {
      setRedExercisePopup({ open: true, exercise });
      return;
    }
    
    // Otherwise, proceed normally (single select)
    onSelectExercise(exercise.id);
    onClose();
    setSearchTerm('');
    setSelectedCategories([]);
  };

  // Long press handlers for mobile
  const handleTouchStart = useCallback((exerciseId: string) => {
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      toggleMultiSelect(exerciseId);
    }, 500);
  }, [toggleMultiSelect]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleAlternativeSelected = (alternativeId: string) => {
    setRedExercisePopup({ open: false, exercise: null });
    onSelectExercise(alternativeId);
    onClose();
    setSearchTerm('');
    setSelectedCategories([]);
  };

  const handleUseRedExerciseAnyway = () => {
    if (redExercisePopup.exercise) {
      onSelectExercise(redExercisePopup.exercise.id);
      onClose();
      setSearchTerm('');
      setSelectedCategories([]);
    }
    setRedExercisePopup({ open: false, exercise: null });
  };

  const handleExerciseAdded = () => {
    setAddExerciseDialogOpen(false);
    console.log('✅ Exercise added successfully - real-time update should show it automatically');
  };

  const handleSelectTemplate = (template: any) => {
    if (onSelectBlockTemplate) {
      onSelectBlockTemplate(template);
      onClose();
    }
  };

  // Count red/yellow exercises
  const statusCounts = useMemo(() => {
    let red = 0;
    let yellow = 0;
    exercisesWithCategories.forEach(ex => {
      const status = exerciseStatusMap.get(ex.id);
      if (status === 'red') red++;
      if (status === 'yellow') yellow++;
    });
    return { red, yellow };
  }, [exercisesWithCategories, exerciseStatusMap]);

  return (
    <>
      <DialogContent
        className="rounded-none w-[900px] h-[600px] max-w-[95vw] max-h-[90vh] p-3 sm:p-4 md:p-6 flex flex-col [&>button]:hidden"
        onPointerDownOutside={(e) => {
          if (addExerciseDialogOpen || createTemplateDialogOpen || selectTemplateDialogOpen || redExercisePopup.open) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (addExerciseDialogOpen || createTemplateDialogOpen || selectTemplateDialogOpen || redExercisePopup.open) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <Filter className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Επιλογή Άσκησης ({exercisesWithCategories.length})</span>
              {/* Status legend */}
              {(statusCounts.red > 0 || statusCounts.yellow > 0) && (
                <div className="flex items-center gap-2 ml-2 text-xs text-muted-foreground">
                  {statusCounts.red > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span>{statusCounts.red}</span>
                    </div>
                  )}
                  {statusCounts.yellow > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <span>{statusCounts.yellow}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 flex-nowrap flex-shrink-0">
              {FEATURE_FLAGS.exerciseSelectionAddExerciseButton && (
                <Button
                  onClick={() => setAddExerciseDialogOpen(true)}
                  className="rounded-none h-7 px-1.5 sm:px-2 text-xs"
                  size="sm"
                >
                  <Plus className="w-3 h-3 sm:mr-0.5" />
                  <span className="hidden sm:inline">Άσκηση</span>
                </Button>
              )}

              <Button
                onClick={() => setCreateTemplateDialogOpen(true)}
                variant="outline"
                className="rounded-none h-7 px-1.5 sm:px-2 text-xs"
                size="sm"
              >
                <Save className="w-3 h-3 sm:mr-0.5" />
                <span className="hidden sm:inline">Template</span>
              </Button>

              <Button
                onClick={() => setSelectTemplateDialogOpen(true)}
                variant="outline"
                className="rounded-none h-7 px-1.5 sm:px-2 text-xs"
                size="sm"
              >
                <FolderOpen className="w-3 h-3 sm:mr-0.5" />
                <span className="hidden sm:inline">Templates</span>
              </Button>

              <Button onClick={onClose} variant="destructive" className="rounded-none h-7 w-7 p-0" size="sm">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Multi-select bar */}
          {isMultiSelectMode && (
            <div className="flex-shrink-0 flex items-center justify-between bg-[#00ffba]/20 border border-[#00ffba] px-3 py-2 mb-2 rounded-none">
              <span className="text-xs font-medium">
                {multiSelectedIds.size} άσκηση{multiSelectedIds.size !== 1 ? 'εις' : ''} επιλεγμέν{multiSelectedIds.size !== 1 ? 'ες' : 'η'}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={cancelMultiSelect}
                  variant="outline"
                  size="sm"
                  className="rounded-none h-7 text-xs"
                >
                  Ακύρωση
                </Button>
                <Button
                  onClick={confirmMultiSelect}
                  size="sm"
                  className="rounded-none h-7 text-xs bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Προσθήκη ({multiSelectedIds.size})
                </Button>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto border rounded-none">
            <div className="p-2">
              {/* Search + Filters */}
              <div className="grid grid-cols-2 gap-2 mb-2 sticky top-0 bg-background z-10 pb-2">
                <ExerciseSearchInput searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                <ExerciseFilters selectedCategories={selectedCategories} onCategoryChange={setSelectedCategories} />
              </div>

              {/* Hint text */}
              {!isMultiSelectMode && (
                <div className="text-[10px] text-muted-foreground mb-2 px-1">
                  Ctrl+Click για πολλαπλή επιλογή · Παρατεταμένο πάτημα σε κινητό
                </div>
              )}

              {/* Cards */}
              <div className="grid grid-cols-2 gap-2">
                {filteredExercises.map((exercise) => {
                  const hasValidVideo = exercise.video_url && isValidVideoUrl(exercise.video_url);
                  const thumbnailUrl = hasValidVideo ? getVideoThumbnail(exercise.video_url!) : null;
                  const bgColor = getExerciseBgColor(exercise.id);
                  const isSelected = multiSelectedIds.has(exercise.id);

                  return (
                    <Button
                      key={exercise.id}
                      variant="outline"
                      className={cn(
                        "h-auto py-2 px-3 rounded-none justify-start text-left relative",
                        bgColor,
                        isSelected && "ring-2 ring-[#00ffba] bg-[#00ffba]/10"
                      )}
                      onClick={(e) => handleSelectExercise(exercise, e)}
                      onTouchStart={() => handleTouchStart(exercise.id)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchMove}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {/* Multi-select checkmark */}
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#00ffba] flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-black" />
                          </div>
                        )}

                        {hasValidVideo && thumbnailUrl ? (
                          <div className="w-8 h-6 rounded-none overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={thumbnailUrl}
                              alt={`${exercise.name} thumbnail`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
                                  parent.className = 'w-8 h-6 rounded-none bg-muted flex items-center justify-center flex-shrink-0';
                                }
                              }}
                            />
                          </div>
                        ) : hasValidVideo ? (
                          <div className="w-8 h-6 rounded-none bg-muted flex items-center justify-center flex-shrink-0">
                            <Play className="w-3 h-3" />
                          </div>
                        ) : null}

                        <span className="text-xs truncate">{exercise.name}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>

              {filteredExercises.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {selectedCategories.length > 0 || searchTerm ? 'Δεν βρέθηκαν ασκήσεις που να ταιριάζουν με τα κριτήρια' : 'Δεν βρέθηκαν ασκήσεις'}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      <AddExerciseDialog
        open={addExerciseDialogOpen}
        onOpenChange={setAddExerciseDialogOpen}
        onSuccess={handleExerciseAdded}
        coachId={coachId}
      />

      <CreateBlockTemplateDialog open={createTemplateDialogOpen} onOpenChange={setCreateTemplateDialogOpen} coachId={coachId} />

      <SelectBlockTemplateDialog
        open={selectTemplateDialogOpen}
        onOpenChange={setSelectTemplateDialogOpen}
        onSelectTemplate={handleSelectTemplate}
        coachId={coachId}
      />

      {/* Red Exercise Alternatives Dialog */}
      <RedExerciseAlternativesDialog
        open={redExercisePopup.open}
        onOpenChange={(open) => setRedExercisePopup({ open, exercise: open ? redExercisePopup.exercise : null })}
        redExercise={redExercisePopup.exercise}
        allExercises={exercisesWithCategories}
        onSelectAlternative={handleAlternativeSelected}
        onUseAnyway={handleUseRedExerciseAnyway}
      />
    </>
  );
};
