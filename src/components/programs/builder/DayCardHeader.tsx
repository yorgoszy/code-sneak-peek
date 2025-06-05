
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, ChevronDown, ChevronRight, Copy } from "lucide-react";

interface DayCardHeaderProps {
  dayName: string;
  isOpen: boolean;
  isEditing: boolean;
  editingName: string;
  blocksCount: number;
  onNameDoubleClick: () => void;
  onEditingNameChange: (value: string) => void;
  onNameSave: () => void;
  onNameKeyPress: (e: React.KeyboardEvent) => void;
  onAddBlock: () => void;
  onDuplicateDay: () => void;
  onRemoveDay: () => void;
}

export const DayCardHeader: React.FC<DayCardHeaderProps> = ({
  dayName,
  isOpen,
  isEditing,
  editingName,
  blocksCount,
  onNameDoubleClick,
  onEditingNameChange,
  onNameSave,
  onNameKeyPress,
  onAddBlock,
  onDuplicateDay,
  onRemoveDay
}) => {
  return (
    <CardHeader className="pb-2">
      <div className="flex justify-between items-center">
        <CollapsibleTrigger className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <CardTitle 
            className="text-sm cursor-pointer flex items-center gap-2"
            onDoubleClick={onNameDoubleClick}
          >
            {isEditing ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => onEditingNameChange(e.target.value)}
                onBlur={onNameSave}
                onKeyDown={onNameKeyPress}
                className="bg-transparent border border-gray-300 rounded px-1 outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                {dayName}
                {!isOpen && blocksCount > 0 && (
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                    {blocksCount}
                  </span>
                )}
              </>
            )}
          </CardTitle>
        </CollapsibleTrigger>
        <div className="flex gap-1">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAddBlock();
            }}
            size="sm"
            variant="ghost"
            className="rounded-none"
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateDay();
            }}
            size="sm"
            variant="ghost"
            className="rounded-none"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveDay();
            }}
            size="sm"
            variant="ghost"
            className="rounded-none"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};
