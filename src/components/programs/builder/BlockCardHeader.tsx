
import React from 'react';
import { CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ChevronDown, ChevronRight, ChevronUp, Copy } from "lucide-react";
import { formatTimeInput } from '@/utils/timeFormatting';

interface BlockCardHeaderProps {
  blockName: string;
  trainingType?: string;
  workoutFormat?: string;
  workoutDuration?: string;
  blockSets?: number;
  isOpen: boolean;
  isEditing: boolean;
  editingName: string;
  exercisesCount: number;
  onNameDoubleClick: () => void;
  onEditingNameChange: (value: string) => void;
  onNameSave: () => void;
  onNameKeyPress: (e: React.KeyboardEvent) => void;
  onAddExercise: () => void;
  onDuplicateBlock: () => void;
  onRemoveBlock: () => void;
  onTrainingTypeChange: (type: string) => void;
  onWorkoutFormatChange: (format: string) => void;
  onWorkoutDurationChange: (duration: string) => void;
  onBlockSetsChange: (sets: number) => void;
}

// Training types που εμφανίζονται στο dropdown
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

const WORKOUT_FORMAT_LABELS: Record<string, string> = {
  time_cap: 'Time Cap',
  emom: 'EMOM',
  for_time: 'For Time',
  amrap: 'AMRAP',
};

export const BlockCardHeader: React.FC<BlockCardHeaderProps> = ({
  blockName,
  trainingType,
  workoutFormat,
  workoutDuration,
  blockSets,
  isOpen,
  isEditing,
  editingName,
  exercisesCount,
  onNameDoubleClick,
  onEditingNameChange,
  onNameSave,
  onNameKeyPress,
  onAddExercise,
  onDuplicateBlock,
  onRemoveBlock,
  onTrainingTypeChange,
  onWorkoutFormatChange,
  onWorkoutDurationChange,
  onBlockSetsChange
}) => {
  return (
    <CardHeader className="p-1 space-y-0">
      <div className="flex justify-between items-center">
        <CollapsibleTrigger className="flex items-center gap-2 hover:bg-gray-600 p-1 rounded">
          {isOpen ? <ChevronDown className="w-3 h-3 text-white" /> : <ChevronRight className="w-3 h-3 text-white" />}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Select value={trainingType || ''} onValueChange={onTrainingTypeChange}>
              <SelectTrigger className="h-6 text-xs rounded-none bg-gray-700 border-gray-600 text-white w-[100px]">
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
        <div className="flex gap-1">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAddExercise();
            }}
            size="sm"
            variant="ghost"
            className="rounded-none hover:bg-gray-600"
          >
            <Plus className="w-2 h-2 text-white" />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateBlock();
            }}
            size="sm"
            variant="ghost"
            className="rounded-none hover:bg-gray-600"
          >
            <Copy className="w-2 h-2 text-white" />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveBlock();
            }}
            size="sm"
            variant="ghost"
            className="rounded-none hover:bg-gray-600"
          >
            <Trash2 className="w-2 h-2 text-white" />
          </Button>
        </div>
      </div>
      
      {/* Training Type, Workout Format and Sets - inline compact */}
      <div className="flex items-center gap-2 flex-wrap">

        <Select value={workoutFormat || 'none'} onValueChange={(value) => onWorkoutFormatChange(value === 'none' ? '' : value)}>
          <SelectTrigger className="h-6 text-xs rounded-none bg-gray-700 border-gray-600 text-white w-[110px]" onClick={(e) => e.stopPropagation()}>
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

        {workoutFormat && workoutFormat !== 'none' && (
          <Input
            type="text"
            value={workoutDuration || ''}
            onChange={(e) => {
              const formatted = formatTimeInput(e.target.value);
              onWorkoutDurationChange(formatted);
            }}
            placeholder="00:00"
            className="h-6 w-[70px] text-xs rounded-none bg-gray-700 border-gray-600 text-white text-center"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onBlockSetsChange(Math.max(1, (blockSets || 1) - 1))}
            className="p-0.5 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
          <span className="text-xs text-white min-w-[16px] text-center">{blockSets || 1}</span>
          <button
            type="button"
            onClick={() => onBlockSetsChange((blockSets || 1) + 1)}
            className="p-0.5 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          {(blockSets || 1) > 1 && (
            <span className="text-xs text-[#00ffba]">x{blockSets}</span>
          )}
        </div>
      </div>
    </CardHeader>
  );
};
