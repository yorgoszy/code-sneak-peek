
import React from 'react';
import { CardHeader } from "@/components/ui/card";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, Plus, Copy, Trash2 } from "lucide-react";

interface BlockCardHeaderProps {
  blockName: string;
  isOpen: boolean;
  isEditing: boolean;
  editingName: string;
  exercisesCount: number;
  onNameDoubleClick: () => void;
  onEditingNameChange: (name: string) => void;
  onNameSave: () => void;
  onNameKeyPress: (e: React.KeyboardEvent) => void;
  onAddExercise: () => void;
  onDuplicateBlock: () => void;
  onRemoveBlock: () => void;
}

export const BlockCardHeader: React.FC<BlockCardHeaderProps> = ({
  blockName,
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
  onRemoveBlock
}) => {
  return (
    <CardHeader className="p-1 md:p-2 pb-0.5 md:pb-1 flex-shrink-0" style={{ backgroundColor: '#31365d' }}>
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <div className="flex items-center space-x-1 cursor-pointer flex-1 min-w-0">
            {isOpen ? (
              <ChevronUp className="h-3 w-3 text-white flex-shrink-0" />
            ) : (
              <ChevronDown className="h-3 w-3 text-white flex-shrink-0" />
            )}
            
            {isEditing ? (
              <Input
                value={editingName}
                onChange={(e) => onEditingNameChange(e.target.value)}
                onBlur={onNameSave}
                onKeyPress={onNameKeyPress}
                className="h-5 md:h-6 text-xs px-1 rounded-none bg-white flex-1 min-w-0"
                autoFocus
              />
            ) : (
              <div className="flex-1 min-w-0">
                <h5
                  className="text-xs font-semibold text-white cursor-pointer truncate"
                  onDoubleClick={onNameDoubleClick}
                  title={blockName}
                >
                  {blockName}
                </h5>
                <p className="text-xs text-gray-300 mt-0.5">
                  {exercisesCount} άσκηση{exercisesCount !== 1 ? 'εις' : 'η'}
                </p>
              </div>
            )}
          </div>
        </CollapsibleTrigger>

        <div className="flex items-center space-x-0.5 flex-shrink-0">
          <Button
            size="sm"
            onClick={onAddExercise}
            className="rounded-none h-5 md:h-6 w-5 md:w-6 p-0 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
          >
            <Plus className="h-2.5 w-2.5 md:h-3 md:w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onDuplicateBlock}
            className="rounded-none h-5 md:h-6 w-5 md:w-6 p-0 border-white text-white hover:bg-white hover:text-black"
          >
            <Copy className="h-2.5 w-2.5 md:h-3 md:w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            onClick={onRemoveBlock}
            className="rounded-none h-5 md:h-6 w-5 md:w-6 p-0"
          >
            <Trash2 className="h-2.5 w-2.5 md:h-3 md:w-3" />
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};
