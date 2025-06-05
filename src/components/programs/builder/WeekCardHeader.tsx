
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Copy, Calendar } from "lucide-react";
import type { Week } from './hooks/useProgramBuilderState';

interface WeekCardHeaderProps {
  week: Week;
  onUpdateWeekName: (weekId: string, name: string) => void;
  onRemoveWeek: (weekId: string) => void;
  onDuplicateWeek: (weekId: string) => void;
}

export const WeekCardHeader: React.FC<WeekCardHeaderProps> = ({
  week,
  onUpdateWeekName,
  onRemoveWeek,
  onDuplicateWeek
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(week.name);

  const handleSaveName = () => {
    onUpdateWeekName(week.id, editName);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(week.name);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-gray-600" />
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
          <h3 className="text-lg font-semibold">{week.name}</h3>
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
          onClick={() => onDuplicateWeek(week.id)}
          className="rounded-none"
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemoveWeek(week.id)}
          className="rounded-none text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
