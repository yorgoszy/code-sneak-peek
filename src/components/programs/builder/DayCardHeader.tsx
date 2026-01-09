
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, ChevronDown, ChevronRight, Copy, Files, Dumbbell, Trophy, ClipboardPaste, ArrowUp, ArrowDown } from "lucide-react";
import { useProgramClipboard } from "@/contexts/ProgramClipboardContext";
import type { Day } from '../types';

interface DayCardHeaderProps {
  day: Day;
  dayName: string;
  isTestDay: boolean;
  isCompetitionDay: boolean;
  bodyFocus?: 'upper' | 'lower';
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
  onToggleBodyFocus: (focus: 'upper' | 'lower') => void;
  onPasteDay?: () => void;
}

export const DayCardHeader: React.FC<DayCardHeaderProps> = ({
  day,
  dayName,
  isTestDay,
  isCompetitionDay,
  bodyFocus,
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
  onToggleBodyFocus,
  onPasteDay
}) => {
  const { copyDay, hasDay, clipboard } = useProgramClipboard();
  
  // Check if this specific day is the one in clipboard
  const isThisDayCopied = clipboard?.type === 'day' && day && clipboard.data && 
    (clipboard.data as Day).id === day.id;

  const handleCopyDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyDay(day);
  };

  return (
    <CardHeader className="py-1 px-2">
      <div className="flex items-center">
        <CollapsibleTrigger className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded min-w-0 flex-shrink">
          {isOpen ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
          <CardTitle 
            className="text-sm cursor-pointer flex items-center gap-2 truncate"
            onDoubleClick={onNameDoubleClick}
          >
            {isEditing ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => onEditingNameChange(e.target.value)}
                onBlur={onNameSave}
                onKeyDown={onNameKeyPress}
                className="bg-transparent border border-gray-300 rounded px-1 outline-none w-24"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="truncate max-w-[100px]">{dayName}</span>
                {!isOpen && blocksCount > 0 && (
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded-full flex-shrink-0">
                    {blocksCount}
                  </span>
                )}
              </>
            )}
          </CardTitle>
        </CollapsibleTrigger>
        
        <div className="flex items-center gap-0 flex-shrink-0 ml-auto">
          {/* Upper Body Icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBodyFocus('upper');
            }}
            className={`p-1.5 rounded transition-colors ${
              bodyFocus === 'upper'
                ? 'text-[#00ffba] bg-[#00ffba]/10' 
                : 'text-gray-300 hover:text-[#00ffba] hover:bg-[#00ffba]/5'
            }`}
            title="Άνω Κορμός - Upper Body"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          
          {/* Lower Body Icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBodyFocus('lower');
            }}
            className={`p-1.5 rounded transition-colors ${
              bodyFocus === 'lower'
                ? 'text-[#00ffba] bg-[#00ffba]/10' 
                : 'text-gray-300 hover:text-[#00ffba] hover:bg-[#00ffba]/5'
            }`}
            title="Κάτω Κορμός - Lower Body"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          
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
            className="rounded-none h-7 w-7 p-0"
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            onClick={handleCopyDay}
            size="sm"
            variant="ghost"
            className="rounded-none h-7 w-7 p-0"
            title="Αντιγραφή Ημέρας στο Clipboard"
          >
            <Copy className={`w-3 h-3 ${isThisDayCopied ? 'text-red-500' : 'text-gray-600'}`} />
          </Button>
          {onPasteDay && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onPasteDay();
              }}
              size="sm"
              variant="ghost"
              className={`rounded-none h-7 w-7 p-0 ${hasDay ? 'text-[#00ffba] hover:text-[#00ffba]/80' : 'text-gray-400'}`}
              disabled={!hasDay}
              title={hasDay ? "Επικόλληση Ημέρας" : "Αντέγραψε πρώτα μια ημέρα"}
            >
              <ClipboardPaste className="w-3 h-3" />
            </Button>
          )}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateDay();
            }}
            size="sm"
            variant="ghost"
            className="rounded-none h-7 w-7 p-0"
            title="Διπλασιασμός Ημέρας"
          >
            <Files className="w-3 h-3" />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveDay();
            }}
            size="sm"
            variant="ghost"
            className="rounded-none h-7 w-7 p-0"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};
