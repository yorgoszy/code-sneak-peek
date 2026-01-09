
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Collapsible } from "@/components/ui/collapsible";
import { BlockCardHeader } from './BlockCardHeader';
import { BlockCardContent } from './BlockCardContent';
import { ExerciseSelectionDialog } from './ExerciseSelectionDialog';
import { Exercise, Block } from '../types';

// Training types labels - πρέπει να ταιριάζουν με το BlockCardHeader
const TRAINING_TYPE_LABELS: Record<string, string> = {
  'warm up': 'warm up',
  'pillar prep': 'pillar prep',
  'movement prep': 'mov prep',
  activation: 'activation',
  plyos: 'plyos',
  'movement skills': 'mov skills',
  'med ball': 'med ball',
  power: 'power',
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
  mobility: 'mobility',
  'neural act': 'neural act',
  stability: 'stability',
  recovery: 'rec',
  accessory: 'acc',
  rotational: 'rot',
};

interface BlockCardProps {
  block: Block;
  exercises: Exercise[];
  selectedUserId?: string;
  onAddExercise: (exerciseId: string) => void;
  onRemoveBlock: () => void;
  onDuplicateBlock: () => void;
  onUpdateBlockName: (name: string) => void;
  onUpdateBlockTrainingType: (trainingType: string) => void;
  onUpdateBlockWorkoutFormat: (format: string) => void;
  onUpdateBlockWorkoutDuration: (duration: string) => void;
  onUpdateBlockSets: (sets: number) => void;
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onDuplicateExercise: (exerciseId: string) => void;
  onReorderExercises: (oldIndex: number, newIndex: number) => void;
  onPasteBlock?: () => void;
  onSelectBlockTemplate?: (template: any) => void;
  coachId?: string;
}

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
  exercises,
  selectedUserId,
  onAddExercise,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onUpdateBlockTrainingType,
  onUpdateBlockWorkoutFormat,
  onUpdateBlockWorkoutDuration,
  onUpdateBlockSets,
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderExercises,
  onPasteBlock,
  onSelectBlockTemplate,
  coachId
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(block.name);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);

  // Sync editingName when block.name changes externally (without clobbering while saving)
  React.useEffect(() => {
    if (!isEditing) setEditingName(block.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.name]);

  const handleNameDoubleClick = () => {
    setIsEditing(true);
    setEditingName(block.name);
  };

  const handleNameSave = () => {
    if (editingName.trim()) {
      onUpdateBlockName(editingName.trim());
    }
    setIsEditing(false);
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingName(block.name);
    }
  };

  const handleAddExerciseClick = () => {
    setShowExerciseDialog(true);
  };

  const handleExerciseSelect = (exerciseId: string) => {
    onAddExercise(exerciseId);
    setShowExerciseDialog(false);
  };

  const handleMultipleExercisesSelect = (exerciseIds: string[]) => {
    // Add exercises in the order they were selected
    exerciseIds.forEach(id => onAddExercise(id));
    setShowExerciseDialog(false);
  };

  // Όταν αλλάζει το training type, ενημερώνουμε ΜΟΝΟ το training type.
  // Το όνομα ενημερώνεται μέσα από το updateBlockTrainingType (στο state layer), αλλιώς γίνεται overwrite με stale state.
  const handleTrainingTypeChange = (trainingType: string) => {
    onUpdateBlockTrainingType(trainingType);

    // UI-only: δείχνουμε άμεσα το label στο local state (θα συγχρονιστεί και από props μετά)
    const newName = TRAINING_TYPE_LABELS[trainingType] || trainingType;
    setEditingName(newName);
  };

  const exercisesCount = block.program_exercises.length;

  return (
    <>
      <Card className={`rounded-none w-full transition-all duration-200 ${isOpen ? 'min-h-[120px]' : 'min-h-[40px]'}`} style={{ backgroundColor: '#31365d' }}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <BlockCardHeader
            block={block}
            blockName={block.name}
            trainingType={block.training_type}
            workoutFormat={block.workout_format}
            workoutDuration={block.workout_duration}
            blockSets={block.block_sets}
            isOpen={isOpen}
            isEditing={isEditing}
            editingName={editingName}
            exercisesCount={exercisesCount}
            onNameDoubleClick={handleNameDoubleClick}
            onEditingNameChange={setEditingName}
            onNameSave={handleNameSave}
            onNameKeyPress={handleNameKeyPress}
            onAddExercise={handleAddExerciseClick}
            onDuplicateBlock={onDuplicateBlock}
            onRemoveBlock={onRemoveBlock}
            onTrainingTypeChange={handleTrainingTypeChange}
            onWorkoutFormatChange={onUpdateBlockWorkoutFormat}
            onWorkoutDurationChange={onUpdateBlockWorkoutDuration}
            onBlockSetsChange={onUpdateBlockSets}
            onPasteBlock={onPasteBlock}
          />
          
          <BlockCardContent
            exercises={block.program_exercises}
            availableExercises={exercises}
            selectedUserId={selectedUserId}
            onUpdateExercise={onUpdateExercise}
            onRemoveExercise={onRemoveExercise}
            onDuplicateExercise={onDuplicateExercise}
            onReorderExercises={onReorderExercises}
          />
        </Collapsible>
      </Card>

      <ExerciseSelectionDialog
        open={showExerciseDialog}
        onOpenChange={setShowExerciseDialog}
        exercises={exercises}
        onSelectExercise={handleExerciseSelect}
        onSelectMultipleExercises={handleMultipleExercisesSelect}
        onSelectBlockTemplate={(template) => {
          if (onSelectBlockTemplate) {
            onSelectBlockTemplate(template);
            setShowExerciseDialog(false);
          }
        }}
        coachId={coachId}
      />
    </>
  );
};
