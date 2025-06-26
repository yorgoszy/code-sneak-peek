
import React from 'react';
import { CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { Block } from '../types';

interface BlockCardHeaderProps {
  block: Block;
  onUpdateBlockName: (name: string) => void;
  onDuplicateBlock: () => void;
  onRemoveBlock: () => void;
  onAddExercise: () => void;
}

export const BlockCardHeader: React.FC<BlockCardHeaderProps> = ({
  block,
  onUpdateBlockName,
  onDuplicateBlock,
  onRemoveBlock,
  onAddExercise
}) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingName, setEditingName] = React.useState(block.name);

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

  const exercisesCount = block.program_exercises?.length || 0;

  return (
    <CardHeader className="pb-2">
      <div className="flex justify-between items-center">
        <CollapsibleTrigger className="flex items-center gap-2 hover:bg-gray-600 p-1 rounded">
          {isOpen ? <ChevronDown className="w-3 h-3 text-white" /> : <ChevronRight className="w-3 h-3 text-white" />}
          <h6 
            className="text-xs font-medium cursor-pointer flex items-center gap-2 text-white"
            onDoubleClick={handleNameDoubleClick}
          >
            {isEditing ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleNameKeyPress}
                className="bg-transparent border border-gray-300 rounded px-1 outline-none text-xs text-white"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                {block.name}
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
    </CardHeader>
  );
};
