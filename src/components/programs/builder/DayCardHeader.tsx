
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, ChevronDown, ChevronRight, Copy, Dumbbell, Trophy, Clipboard } from "lucide-react";
import { useProgramClipboard } from "@/contexts/ProgramClipboardContext";
import type { Day } from '../types';

interface DayCardHeaderProps {
  day: Day;
  dayName: string;
  isTestDay: boolean;
  isCompetitionDay: boolean;
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
  onToggleTestDay: () => void;
  onToggleCompetitionDay: () => void;
  onPasteBlock?: () => void;
}

export const DayCardHeader: React.FC<DayCardHeaderProps> = ({
  day,
  dayName,
  isTestDay,
  isCompetitionDay,
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
  onRemoveDay,
  onToggleTestDay,
  onToggleCompetitionDay,
  onPasteBlock
}) => {
  const { copyDay, hasBlock } = useProgramClipboard();

  const handleCopyDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyDay(day);
  };

  return (
    <CardHeader className="py-1 px-2">
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
        
        <div className="flex items-center gap-1">
          {/* Test Day Icon - Yellow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleTestDay();
            }}
            className={`p-1.5 rounded transition-colors ${
              isTestDay 
                ? 'text-yellow-600 bg-yellow-100' 
                : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-50'
            }`}
            title="Ημέρα Τεστ"
          >
            <Dumbbell className="w-4 h-4" />
          </button>
          
          {/* Competition Day Icon - Purple */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompetitionDay();
            }}
            className={`p-1.5 rounded transition-colors ${
              isCompetitionDay 
                ? 'text-purple-600 bg-purple-100' 
                : 'text-gray-300 hover:text-purple-500 hover:bg-purple-50'
            }`}
            title="Ημέρα Αγώνα"
          >
            <Trophy className="w-4 h-4" />
          </button>
          
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
          {onPasteBlock && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onPasteBlock();
              }}
              size="sm"
              variant="ghost"
              className="rounded-none"
              disabled={!hasBlock}
              title={hasBlock ? "Επικόλληση Block" : "Αντέγραψε πρώτα ένα block"}
            >
              <Clipboard className="w-3 h-3" />
            </Button>
          )}
          <Button
            onClick={handleCopyDay}
            size="sm"
            variant="ghost"
            className="rounded-none"
            title="Αντιγραφή Ημέρας στο Clipboard"
          >
            <Copy className="w-3 h-3 text-blue-500" />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateDay();
            }}
            size="sm"
            variant="ghost"
            className="rounded-none"
            title="Διπλασιασμός Ημέρας"
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
