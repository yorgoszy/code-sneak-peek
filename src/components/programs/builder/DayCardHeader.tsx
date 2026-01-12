
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, Copy, Dumbbell, Trophy, ClipboardPaste, ArrowUp, ArrowDown, Zap, BedDouble } from "lucide-react";
import { useProgramClipboard } from "@/contexts/ProgramClipboardContext";
import type { Day, EffortType } from '../types';

interface DayCardHeaderProps {
  day: Day;
  dayName: string;
  isTestDay: boolean;
  isCompetitionDay: boolean;
  isEsdDay: boolean;
  isRecoveryDay: boolean;
  upperEffort?: EffortType;
  lowerEffort?: EffortType;
  isOpen: boolean;
  isEditing: boolean;
  editingName: string;
  blocksCount: number;
  onNameDoubleClick: () => void;
  onEditingNameChange: (value: string) => void;
  onNameSave: () => void;
  onNameKeyPress: (e: React.KeyboardEvent) => void;
  onAddBlock: () => void;
  onRemoveDay: () => void;
  onToggleTestDay: () => void;
  onToggleCompetitionDay: () => void;
  onCycleEsdRecovery: () => void;
  onToggleEffort: (bodyPart: 'upper' | 'lower') => void;
  onPasteDay?: () => void;
}

export const DayCardHeader: React.FC<DayCardHeaderProps> = ({
  day,
  dayName,
  isTestDay,
  isCompetitionDay,
  isEsdDay,
  isRecoveryDay,
  upperEffort = 'none',
  lowerEffort = 'none',
  isOpen,
  isEditing,
  editingName,
  blocksCount,
  onNameDoubleClick,
  onEditingNameChange,
  onNameSave,
  onNameKeyPress,
  onAddBlock,
  onRemoveDay,
  onToggleTestDay,
  onToggleCompetitionDay,
  onCycleEsdRecovery,
  onToggleEffort,
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

  // Get effort display and colors
  const getEffortStyle = (effort: EffortType) => {
    switch (effort) {
      case 'DE':
        return 'text-blue-500 bg-blue-100';
      case 'ME':
        return 'text-red-500 bg-red-100';
      default:
        return 'text-gray-300 hover:text-[#00ffba] hover:bg-[#00ffba]/5';
    }
  };

  const getEffortLabel = (bodyPart: 'upper' | 'lower', effort: EffortType) => {
    const bodyLabel = bodyPart === 'upper' ? 'Άνω Κορμός' : 'Κάτω Κορμός';
    switch (effort) {
      case 'DE':
        return `${bodyLabel} - DE (Dynamic Effort)`;
      case 'ME':
        return `${bodyLabel} - ME (Max Effort)`;
      default:
        return `${bodyLabel} - Κλικ για DE, διπλό κλικ για ME`;
    }
  };

  return (
    <CardHeader className="py-1 px-2">
      <div className="flex items-center">
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-1 p-1 min-w-0 flex-shrink cursor-pointer hover:bg-gray-50 rounded">
            <CardTitle 
              className="text-sm cursor-pointer flex items-center gap-2 truncate"
              onDoubleClick={(e) => {
                e.stopPropagation();
                onNameDoubleClick();
              }}
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
          </div>
        </CollapsibleTrigger>
        
        <div className="flex items-center gap-0 flex-shrink-0 ml-auto">
          {/* Upper Body Icon - cycles: none -> DE -> ME -> none */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleEffort('upper');
            }}
            className={`p-1.5 rounded transition-colors relative ${getEffortStyle(upperEffort)}`}
            title={getEffortLabel('upper', upperEffort)}
          >
            <ArrowUp className="w-4 h-4" />
            {upperEffort !== 'none' && (
              <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold">
                {upperEffort}
              </span>
            )}
          </button>
          
          {/* Lower Body Icon - cycles: none -> DE -> ME -> none */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleEffort('lower');
            }}
            className={`p-1.5 rounded transition-colors relative ${getEffortStyle(lowerEffort)}`}
            title={getEffortLabel('lower', lowerEffort)}
          >
            <ArrowDown className="w-4 h-4" />
            {lowerEffort !== 'none' && (
              <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold">
                {lowerEffort}
              </span>
            )}
          </button>

          {/* ESD / Recovery Button - cycles: none -> ESD -> Recovery -> none */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCycleEsdRecovery();
            }}
            className={`p-1.5 rounded transition-colors flex items-center justify-center w-7 h-7 ${
              isRecoveryDay 
                ? 'text-green-600 bg-green-100' 
                : isEsdDay 
                  ? 'text-orange-600 bg-orange-100' 
                  : 'text-gray-300 hover:text-orange-500 hover:bg-orange-50'
            }`}
            title={isRecoveryDay ? "Recovery Day (κλικ για κατάργηση)" : isEsdDay ? "ESD (κλικ για Recovery)" : "Κλικ για ESD"}
          >
            {isRecoveryDay ? (
              <BedDouble className="w-4 h-4" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
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
