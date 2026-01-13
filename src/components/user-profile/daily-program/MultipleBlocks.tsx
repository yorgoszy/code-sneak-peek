
import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { EditableExerciseRow } from './EditableExerciseRow';
import { ViewOnlyExerciseRow } from './ViewOnlyExerciseRow';
import { ExerciseSelector } from '@/components/active-programs/calendar/ExerciseSelector';
import { RollingTimeInput } from '@/components/programs/builder/RollingTimeInput';
import { getTrainingTypeLabel } from '@/utils/trainingTypeLabels';

interface Exercise {
  id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  reps_mode?: string;
  kg?: string;
  kg_mode?: string;
  percentage_1rm?: number;
  velocity_ms?: number;
  tempo?: string;
  rest?: string;
  notes?: string;
  exercise_order: number;
  exercises?: {
    id: string;
    name: string;
    description?: string;
    video_url?: string;
  };
}

interface Block {
  id: string;
  name: string;
  block_order: number;
  training_type?: string;
  workout_format?: string;
  workout_duration?: string;
  block_sets?: number;
  program_exercises: Exercise[];
}

interface MultipleBlocksProps {
  blocks: Block[];
  viewOnly: boolean;
  editMode?: boolean;
  getRemainingText: (exerciseId: string, totalSets: number) => string;
  isExerciseComplete: (exerciseId: string, totalSets: number) => boolean;
  onExerciseClick: (exercise: Exercise, event: React.MouseEvent) => void;
  onVideoClick: (exercise: Exercise) => void;
  onAddExercise?: (blockId: string, exerciseId: string) => void;
  onRemoveBlock?: (blockId: string) => void;
  onRemoveExercise?: (exerciseId: string) => void;
  onUpdateExercise?: (exerciseId: string, field: string, value: any) => void;
  onUpdateBlockFormat?: (blockId: string, format: string) => void;
  onUpdateBlockDuration?: (blockId: string, duration: string) => void;
  onUpdateBlockSets?: (blockId: string, sets: number) => void;
  onUpdateBlockTrainingType?: (blockId: string, trainingType: string) => void;
}

// Training types for dropdown - same as BlockCardHeader
const TRAINING_TYPE_LABELS: Record<string, string> = {
  'warm up': 'warm up',
  str: 'str',
  'str/spd': 'str/spd',
  pwr: 'pwr',
  'spd/str': 'spd/str',
  spd: 'spd',
  'str/end': 'str/end',
  'pwr/end': 'pwr/end',
  'spd/end': 'spd/end',
  end: 'end',
  hpr: 'hpr',
  recovery: 'rec',
  accessory: 'acc',
  rotational: 'rot',
};

const WORKOUT_FORMAT_LABELS: Record<string, string> = {
  non_stop: 'Non Stop',
  emom: 'EMOM',
  for_time: 'For Time',
  amrap: 'AMRAP',
};

export const MultipleBlocks: React.FC<MultipleBlocksProps> = ({
  blocks,
  viewOnly,
  editMode = false,
  getRemainingText,
  isExerciseComplete,
  onExerciseClick,
  onVideoClick,
  onAddExercise,
  onRemoveBlock,
  onRemoveExercise,
  onUpdateExercise,
  onUpdateBlockFormat,
  onUpdateBlockDuration,
  onUpdateBlockSets,
  onUpdateBlockTrainingType
}) => {
  const [exerciseSelectorOpen, setExerciseSelectorOpen] = useState<string | null>(null);
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    blocks.forEach(block => { initial[block.id] = true; });
    return initial;
  });
  
  const sortedBlocks = [...blocks].sort((a, b) => a.block_order - b.block_order);

  const handleSelectExercise = (blockId: string, exerciseId: string) => {
    if (onAddExercise) {
      onAddExercise(blockId, exerciseId);
    }
    setExerciseSelectorOpen(null);
  };

  const toggleBlock = (blockId: string) => {
    setOpenBlocks(prev => ({ ...prev, [blockId]: !prev[blockId] }));
  };

  // View mode - BlockCard style with collapsible, read-only fields, same UI as DayCard
  if (!editMode) {
    return (
      <div className="space-y-2">
        {sortedBlocks.map((block) => {
          const isOpen = openBlocks[block.id] !== false;
          const exercisesCount = block.program_exercises?.length || 0;
          
          return (
            <Card 
              key={block.id} 
              className={`rounded-none w-full transition-all duration-200 ${isOpen ? 'min-h-[80px]' : 'min-h-[32px]'}`} 
              style={{ backgroundColor: '#31365d' }}
            >
              <Collapsible open={isOpen} onOpenChange={() => toggleBlock(block.id)}>
                {/* Block Header - Same as BlockCardHeader but read-only */}
                <CardHeader className="p-1 space-y-0">
                  <div className="flex justify-between items-center">
                    <CollapsibleTrigger className="flex items-center gap-2 hover:bg-gray-600 p-1 rounded flex-1 min-w-0">
                      {isOpen ? (
                        <ChevronDown className="w-3 h-3 text-white flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-white flex-shrink-0" />
                      )}
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Training Type - Read only text */}
                        <span className="text-xs text-white font-medium">
                          {getTrainingTypeLabel(block.training_type, block.name)}
                        </span>
                        
                        {/* Workout Format and Duration - Read only badge */}
                        {(block.workout_format || block.workout_duration) && (
                          <div className="inline-flex items-center gap-1 text-xs border border-[#cb8954] px-1.5 py-0.5">
                            {block.workout_format && (
                              <span className="text-[#cb8954]">
                                {WORKOUT_FORMAT_LABELS[block.workout_format] || block.workout_format}
                              </span>
                            )}
                            {block.workout_format && block.workout_duration && (
                              <span className="text-[#cb8954]">-</span>
                            )}
                            {block.workout_duration && (
                              <span className="text-[#cb8954]">{block.workout_duration}</span>
                            )}
                          </div>
                        )}
                        
                        {/* Block Sets */}
                        {block.block_sets && block.block_sets > 1 && (
                          <span className="text-xs text-[#00ffba]">x{block.block_sets}</span>
                        )}
                        
                        {/* Exercise count when collapsed */}
                        {!isOpen && exercisesCount > 0 && (
                          <span className="text-xs bg-gray-500 px-2 py-0.5 rounded-full text-white">
                            {exercisesCount}
                          </span>
                        )}
                      </div>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>

                {/* Block Content - Exercises */}
                <CollapsibleContent>
                  <CardContent className="p-0 m-0 bg-white">
                    {block.program_exercises
                      ?.sort((a, b) => a.exercise_order - b.exercise_order)
                      .map((exercise, idx) => (
                        <ViewOnlyExerciseRow
                          key={exercise.id}
                          exercise={exercise}
                          exerciseNumber={idx + 1}
                          onVideoClick={onVideoClick}
                        />
                      ))}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    );
  }

  // Edit mode - ProgramBuilder BlockCard style
  return (
    <div className="space-y-2">
      {sortedBlocks.map((block) => {
        const isOpen = openBlocks[block.id] !== false;
        const exercisesCount = block.program_exercises?.length || 0;
        
        return (
          <Card 
            key={block.id} 
            className={`rounded-none w-full transition-all duration-200 ${isOpen ? 'min-h-[120px]' : 'min-h-[40px]'}`} 
            style={{ backgroundColor: '#31365d' }}
          >
            <Collapsible open={isOpen} onOpenChange={() => toggleBlock(block.id)}>
              {/* Block Header - Same as BlockCardHeader */}
              <CardHeader className="p-1 space-y-0">
                <div className="flex justify-between items-center">
                  <CollapsibleTrigger className="flex items-center gap-2 hover:bg-gray-600 p-1 rounded flex-1 min-w-0">
                    {isOpen ? (
                      <ChevronDown className="w-3 h-3 text-white flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-white flex-shrink-0" />
                    )}
                    <div className="flex items-center gap-2 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <Select 
                        value={block.training_type || ''} 
                        onValueChange={(value) => onUpdateBlockTrainingType?.(block.id, value)}
                      >
                        <SelectTrigger className="h-6 text-xs rounded-none bg-gray-700 border-gray-600 text-white w-[100px] flex-shrink-0">
                          <SelectValue placeholder="Τύπος" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none bg-white z-50">
                          {Object.entries(TRAINING_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value} className="text-xs">
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!isOpen && exercisesCount > 0 && (
                        <span className="text-xs bg-gray-500 px-2 py-1 rounded-full text-white">
                          {exercisesCount}
                        </span>
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <div className="flex gap-0 flex-shrink-0">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExerciseSelectorOpen(block.id);
                      }}
                      size="sm"
                      variant="ghost"
                      className="rounded-none hover:bg-gray-600 h-6 w-6 p-0"
                    >
                      <Plus className="w-3 h-3 text-white" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBlock?.(block.id);
                      }}
                      size="sm"
                      variant="ghost"
                      className="rounded-none hover:bg-gray-600 h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </Button>
                  </div>
                </div>
                
                {/* Training Type, Workout Format and Sets - inline compact */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Select 
                    value={block.workout_format || 'none'} 
                    onValueChange={(value) => onUpdateBlockFormat?.(block.id, value === 'none' ? '' : value)}
                  >
                    <SelectTrigger 
                      className="h-6 text-xs rounded-none bg-gray-700 border-gray-600 text-white w-[110px]" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none bg-white z-50">
                      <SelectItem value="none" className="text-xs">Κανένα</SelectItem>
                      {Object.entries(WORKOUT_FORMAT_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="text-xs">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {block.workout_format && block.workout_format !== 'none' && (
                    <RollingTimeInput
                      value={block.workout_duration || ''}
                      onChange={(value) => onUpdateBlockDuration?.(block.id, value)}
                      className="h-6 w-[70px] text-xs rounded-none bg-gray-700 border-gray-600 text-white text-center"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-gray-400">Set</span>
                    <button
                      type="button"
                      onClick={() => onUpdateBlockSets?.(block.id, Math.max(1, (block.block_sets || 1) - 1))}
                      className="p-0.5 text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <span className="text-xs text-white min-w-[16px] text-center">{block.block_sets || 1}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateBlockSets?.(block.id, (block.block_sets || 1) + 1)}
                      className="p-0.5 text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    {(block.block_sets || 1) > 1 && (
                      <span className="text-xs text-[#00ffba]">x{block.block_sets}</span>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Block Content - Exercises */}
              {isOpen && (
                <div className="bg-white">
                  {block.program_exercises
                    ?.sort((a, b) => a.exercise_order - b.exercise_order)
                    .map((exercise) => (
                      <EditableExerciseRow
                        key={exercise.id}
                        exercise={exercise}
                        onUpdate={onUpdateExercise ? (field, value) => onUpdateExercise(exercise.id, field, value) : undefined}
                        onRemove={onRemoveExercise ? () => onRemoveExercise(exercise.id) : undefined}
                        onVideoClick={() => onVideoClick(exercise)}
                      />
                    ))}
                </div>
              )}
            </Collapsible>

            {/* Exercise Selector Dialog */}
            <ExerciseSelector
              isOpen={exerciseSelectorOpen === block.id}
              onClose={() => setExerciseSelectorOpen(null)}
              onSelectExercise={(exerciseId) => handleSelectExercise(block.id, exerciseId)}
            />
          </Card>
        );
      })}
    </div>
  );
};
