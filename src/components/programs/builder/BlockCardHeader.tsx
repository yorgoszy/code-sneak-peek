
import React from 'react';
import { CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronDown, ChevronRight, ChevronUp, Copy, Files, ClipboardPaste } from "lucide-react";
import { useProgramClipboard } from "@/contexts/ProgramClipboardContext";
import { RollingTimeInput } from './RollingTimeInput';
import type { Block } from '../types';

interface BlockCardHeaderProps {
  block?: Block;
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
  onCopyBlock?: () => void;
  onPasteBlock?: () => void;
}

// Training types που εμφανίζονται στο dropdown
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

export const BlockCardHeader: React.FC<BlockCardHeaderProps> = ({
  block,
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
  onBlockSetsChange,
  onCopyBlock,
  onPasteBlock
}) => {
  const { copyBlock, hasBlock, hasDay, hasWeek, clipboard } = useProgramClipboard();
  
  // Check if this specific block is the one in clipboard
  const isThisBlockCopied = clipboard?.type === 'block' && block && clipboard.data && 
    (clipboard.data as Block).id === block.id;

  const handleCopyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (block) {
      copyBlock(block);
    } else if (onCopyBlock) {
      onCopyBlock();
    }
  };

  return (
    <CardHeader className="p-1 space-y-0">
      <div className="flex justify-between items-center">
        <CollapsibleTrigger className="flex items-center gap-2 hover:bg-gray-600 p-1 rounded flex-1 min-w-0">
          {isOpen ? <ChevronDown className="w-3 h-3 text-white flex-shrink-0" /> : <ChevronRight className="w-3 h-3 text-white flex-shrink-0" />}
          <div className="flex items-center gap-2 min-w-0" onClick={(e) => e.stopPropagation()}>
            <Select value={trainingType || ''} onValueChange={onTrainingTypeChange}>
              <SelectTrigger className="h-6 text-xs rounded-none bg-gray-700 border-gray-600 text-white w-[100px] flex-shrink-0">
                <SelectValue placeholder="Τύπος" />
              </SelectTrigger>
              <SelectContent className="rounded-none bg-white z-50 max-h-none overflow-visible">
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
              onAddExercise();
            }}
            size="sm"
            variant="ghost"
            className="rounded-none hover:bg-gray-600 h-6 w-6 p-0"
          >
            <Plus className="w-3 h-3 text-white" />
          </Button>
          <Button
            onClick={handleCopyToClipboard}
            size="sm"
            variant="ghost"
            className="rounded-none hover:bg-gray-600 h-6 w-6 p-0"
            title="Αντιγραφή Block στο Clipboard"
          >
            <Copy className={`w-3 h-3 ${isThisBlockCopied ? 'text-red-500' : 'text-white'}`} />
          </Button>
          {onPasteBlock && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onPasteBlock();
              }}
              size="sm"
              variant="ghost"
              className={`rounded-none hover:bg-gray-600 h-6 w-6 p-0 ${hasBlock ? 'text-[#00ffba]' : 'text-gray-500'}`}
              disabled={!hasBlock}
              title={hasBlock ? "Επικόλληση Block" : "Αντέγραψε πρώτα ένα block"}
            >
              <ClipboardPaste className="w-3 h-3" />
            </Button>
          )}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateBlock();
            }}
            size="sm"
            variant="ghost"
            className="rounded-none hover:bg-gray-600 h-6 w-6 p-0"
            title="Διπλασιασμός Block"
          >
            <Files className="w-3 h-3 text-white" />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveBlock();
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
          <RollingTimeInput
            value={workoutDuration || ''}
            onChange={onWorkoutDurationChange}
            className="h-6 w-[70px] text-xs rounded-none bg-gray-700 border-gray-600 text-white text-center"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-gray-400">Set</span>
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
