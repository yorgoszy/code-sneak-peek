
import React from 'react';
import { CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronDown, ChevronRight, Copy } from "lucide-react";

interface BlockCardHeaderProps {
  blockName: string;
  trainingType?: string;
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
}

const TRAINING_TYPE_LABELS: Record<string, string> = {
  str: 'str',
  'str/spd': 'str/spd',
  pwr: 'pwr',
  'spd/str': 'spd/str',
  spd: 'spd',
  'str/end': 'str/end',
  'pwr/end': 'pwr/end',
  'spd/end': 'spd/end',
  end: 'end',
};

export const BlockCardHeader: React.FC<BlockCardHeaderProps> = ({
  blockName,
  trainingType,
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
  onTrainingTypeChange
}) => {
  return (
    <CardHeader className="pb-2 space-y-2">
      <div className="flex justify-between items-center">
        <CollapsibleTrigger className="flex items-center gap-2 hover:bg-gray-600 p-1 rounded">
          {isOpen ? <ChevronDown className="w-3 h-3 text-white" /> : <ChevronRight className="w-3 h-3 text-white" />}
          <h6 
            className="text-xs font-medium cursor-pointer flex items-center gap-2 text-white"
            onDoubleClick={onNameDoubleClick}
          >
            {isEditing ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => onEditingNameChange(e.target.value)}
                onBlur={onNameSave}
                onKeyDown={onNameKeyPress}
                className="bg-transparent border border-gray-300 rounded px-1 outline-none text-xs text-white"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                {blockName}
                {!isOpen && exercisesCount > 0 && (
                  <span className="text-xs bg-gray-500 px-2 py-1 rounded-full text-white">
                    {exercisesCount}
                  </span>
                )}
              </>
            )}
          </h6>
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
      
      {/* Training Type Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-white">Τύπος:</span>
        <Select value={trainingType || ''} onValueChange={onTrainingTypeChange}>
          <SelectTrigger className="h-6 text-xs rounded-none bg-gray-700 border-gray-600 text-white w-[140px]" onClick={(e) => e.stopPropagation()}>
            <SelectValue placeholder="Επιλέξτε τύπο" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {Object.entries(TRAINING_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </CardHeader>
  );
};
