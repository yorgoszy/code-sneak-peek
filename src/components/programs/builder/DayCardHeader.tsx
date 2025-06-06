
import React from 'react';
import { CardHeader } from "@/components/ui/card";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, Plus, Copy, Trash2 } from "lucide-react";

interface DayCardHeaderProps {
  dayName: string;
  isOpen: boolean;
  isEditing: boolean;
  editingName: string;
  blocksCount: number;
  onNameDoubleClick: () => void;
  onEditingNameChange: (name: string) => void;
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
    <CardHeader className="p-2 md:p-4 pb-1 md:pb-2 ml-2 md:ml-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <div className="flex items-center space-x-1 md:space-x-2 cursor-pointer flex-1 min-w-0">
            {isOpen ? (
              <ChevronUp className="h-3 w-3 md:h-4 md:w-4 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-gray-500 flex-shrink-0" />
            )}
            
            {isEditing ? (
              <Input
                value={editingName}
                onChange={(e) => onEditingNameChange(e.target.value)}
                onBlur={onNameSave}
                onKeyPress={onNameKeyPress}
                className="h-6 md:h-8 text-xs md:text-sm px-1 md:px-2 rounded-none bg-white flex-1 min-w-0"
                autoFocus
              />
            ) : (
              <div className="flex-1 min-w-0">
                <h4
                  className="text-xs md:text-sm font-semibold text-gray-900 cursor-pointer truncate"
                  onDoubleClick={onNameDoubleClick}
                  title={dayName}
                >
                  {dayName}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {blocksCount} block{blocksCount !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </CollapsibleTrigger>

        <div className="flex items-center space-x-0.5 md:space-x-1 flex-shrink-0">
          <Button
            size="sm"
            onClick={onAddBlock}
            className="rounded-none h-6 md:h-8 w-6 md:w-8 p-0"
          >
            <Plus className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onDuplicateDay}
            className="rounded-none h-6 md:h-8 w-6 md:w-8 p-0"
          >
            <Copy className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            onClick={onRemoveDay}
            className="rounded-none h-6 md:h-8 w-6 md:w-8 p-0"
          >
            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};
