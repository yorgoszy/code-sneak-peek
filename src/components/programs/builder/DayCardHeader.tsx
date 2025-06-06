
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
    <CardHeader className="pb-1 md:pb-2 px-2 md:px-4 py-1 md:py-2">
      <div className="flex justify-between items-center gap-1 md:gap-2">
        <CollapsibleTrigger className="flex items-center gap-1 md:gap-2 hover:bg-gray-50 p-0.5 md:p-1 rounded min-w-0 flex-1">
          {isOpen ? <ChevronDown className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />}
          <CardTitle 
            className="text-xs md:text-sm cursor-pointer flex items-center gap-1 md:gap-2 min-w-0 flex-1"
            onDoubleClick={onNameDoubleClick}
          >
            {isEditing ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => onEditingNameChange(e.target.value)}
                onBlur={onNameSave}
                onKeyDown={onNameKeyPress}
                className="bg-transparent border border-gray-300 rounded px-1 outline-none text-xs md:text-sm w-full min-w-0"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="truncate">{dayName}</span>
                {!isOpen && blocksCount > 0 && (
                  <span className="text-xs bg-gray-200 px-1 md:px-2 py-0.5 md:py-1 rounded-full flex-shrink-0">
                    {blocksCount}
                  </span>
                )}
              </>
            )}
          </CardTitle>
        </CollapsibleTrigger>
        <div className="flex gap-0.5 md:gap-1 flex-shrink-0">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAddBlock();
            }}
            size="sm"
            variant="ghost"
            className="rounded-none h-6 w-6 md:h-8 md:w-8 p-0"
          >
            <Plus className="w-2.5 h-2.5 md:w-3 md:h-3" />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateDay();
            }}
            size="sm"
            variant="ghost"
            className="rounded-none h-6 w-6 md:h-8 md:w-8 p-0"
          >
            <Copy className="w-2.5 h-2.5 md:w-3 md:h-3" />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveDay();
            }}
            size="sm"
            variant="ghost"
            className="rounded-none h-6 w-6 md:h-8 md:w-8 p-0"
          >
            <Trash2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};
