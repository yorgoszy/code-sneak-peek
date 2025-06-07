
import { useState } from 'react';
import { Week } from '../../types';

export const useWeekEditingState = (
  weeks: Week[],
  onUpdateWeekName: (weekId: string, name: string) => void
) => {
  const [activeWeek, setActiveWeek] = useState(weeks[0]?.id || '');
  const [editingWeekId, setEditingWeekId] = useState<string | null>(null);
  const [editingWeekName, setEditingWeekName] = useState('');

  const handleWeekNameDoubleClick = (week: Week) => {
    setEditingWeekId(week.id);
    setEditingWeekName(week.name);
  };

  const handleWeekNameSave = () => {
    if (editingWeekId && editingWeekName.trim()) {
      onUpdateWeekName(editingWeekId, editingWeekName.trim());
    }
    setEditingWeekId(null);
    setEditingWeekName('');
  };

  const handleWeekNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleWeekNameSave();
    } else if (e.key === 'Escape') {
      setEditingWeekId(null);
      setEditingWeekName('');
    }
  };

  return {
    activeWeek,
    setActiveWeek,
    editingWeekId,
    editingWeekName,
    setEditingWeekName,
    handleWeekNameDoubleClick,
    handleWeekNameSave,
    handleWeekNameKeyPress
  };
};
