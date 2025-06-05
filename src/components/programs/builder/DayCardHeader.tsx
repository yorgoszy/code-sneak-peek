
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Copy, Plus } from "lucide-react";
import type { Day } from './hooks/useProgramBuilderState';

interface DayCardHeaderProps {
  day: Day;
  onUpdateDayName: (dayId: string, name: string) => void;
  onRemoveDay: () => void;
  onDuplicateDay: () => void;
}

export const DayCardHeader: React.FC<DayCardHeaderProps> = ({
  day,
  onUpdateDayName,
  onRemoveDay,
  onDuplicateDay
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(day.name);

  const handleSaveName = () => {
    onUpdateDayName(day.id, editName);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(day.name);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
      <div className="flex items-center gap-2">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 rounded-none"
              onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
              autoFocus
            />
            <Button size="sm" onClick={handleSaveName} className="rounded-none">
              Αποθήκευση
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="rounded-none">
              Ακύρωση
            </Button>
          </div>
        ) : (
          <h3 className="text-lg font-semibold">{day.name}</h3>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="rounded-none"
          disabled={isEditing}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDuplicateDay}
          className="rounded-none"
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemoveDay}
          className="rounded-none text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
