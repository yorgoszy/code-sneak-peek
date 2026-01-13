
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ViewOnlyExerciseRow } from '@/components/user-profile/daily-program/ViewOnlyExerciseRow';
import { getTrainingTypeLabel } from '@/utils/trainingTypeLabels';

interface ProgramBlocksProps {
  blocks: any[];
  workoutInProgress: boolean;
  getRemainingText: (exerciseId: string) => string;
  isExerciseComplete: (exerciseId: string, totalSets: number) => boolean;
  getCompletedSets: (exerciseId: string) => number;
  onExerciseClick: (exercise: any, event: React.MouseEvent) => void;
  onSetClick: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  onVideoClick: (exercise: any) => void;
  getNotes: (exerciseId: string) => string;
  updateNotes: (exerciseId: string, notes: string) => void;
  clearNotes: (exerciseId: string) => void;
  updateKg: (exerciseId: string, kg: string) => void;
  clearKg: (exerciseId: string) => void;
  updateVelocity: (exerciseId: string, velocity: string) => void;
  clearVelocity: (exerciseId: string) => void;
  updateReps: (exerciseId: string, reps: string) => void;
  clearReps: (exerciseId: string) => void;
  getKg: (exerciseId: string) => string;
  getReps: (exerciseId: string) => string;
  getVelocity: (exerciseId: string) => string;
  selectedDate: Date;
  program: any;
}

export const ProgramBlocks: React.FC<ProgramBlocksProps> = ({
  blocks,
  workoutInProgress,
  onVideoClick
}) => {
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>(() => {
    // Initialize all blocks as open by default
    const initial: Record<string, boolean> = {};
    blocks?.forEach(block => {
      initial[block.id] = true;
    });
    return initial;
  });

  if (!blocks || blocks.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        Δεν υπάρχουν blocks για αυτή την ημέρα
      </div>
    );
  }

  // Ταξινόμηση blocks με βάση block_order
  const sortedBlocks = [...blocks].sort((a, b) => {
    const orderA = Number(a.block_order) || 0;
    const orderB = Number(b.block_order) || 0;
    return orderA - orderB;
  });

  const toggleBlock = (blockId: string) => {
    setOpenBlocks(prev => ({
      ...prev,
      [blockId]: !prev[blockId]
    }));
  };

  // Format workout info for badge
  const getBlockInfoText = (block: any) => {
    const parts = [];
    if (block.workout_format) parts.push(block.workout_format);
    if (block.workout_duration) parts.push(block.workout_duration);
    if (block.block_sets) parts.push(`${block.block_sets} sets`);
    return parts.join(' · ');
  };

  return (
    <div className="space-y-2">
      {sortedBlocks.map((block, blockIndex) => {
        // Ταξινόμηση ασκήσεων με βάση exercise_order
        const sortedExercises = [...(block.program_exercises || [])].sort((a, b) => {
          const orderA = Number(a.exercise_order) || 0;
          const orderB = Number(b.exercise_order) || 0;
          return orderA - orderB;
        });

        const isOpen = openBlocks[block.id] ?? true;
        const blockInfoText = getBlockInfoText(block);

        return (
          <Card key={block.id} className="rounded-none overflow-hidden">
            <Collapsible open={isOpen} onOpenChange={() => toggleBlock(block.id)}>
              <CollapsibleTrigger asChild>
                <div 
                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: '#31365d' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">
                      {getTrainingTypeLabel(block.training_type, block.name || `Block ${blockIndex + 1}`)}
                    </span>
                    {blockInfoText && (
                      <Badge variant="secondary" className="rounded-none text-xs bg-white/20 text-white border-0">
                        {blockInfoText}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/70 text-xs">
                      {sortedExercises.length} ασκ.
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-white" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-white" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-200">
                    {sortedExercises.map((exercise, exerciseIndex) => (
                      <ViewOnlyExerciseRow
                        key={exercise.id}
                        exercise={exercise}
                        exerciseNumber={exerciseIndex + 1}
                        onVideoClick={onVideoClick}
                      />
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
};
