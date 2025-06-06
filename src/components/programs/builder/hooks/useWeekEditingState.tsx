
import { useState } from 'react';

interface ProgramExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  percentage_1rm: number;
  kg: string;
  velocity_ms: string;
  tempo: string;
  rest: string;
  exercise_order: number;
}

interface Block {
  id: string;
  name: string;
  block_order: number;
  exercises: ProgramExercise[];
}

interface Day {
  id: string;
  name: string;
  day_number: number;
  blocks: Block[];
}

interface Week {
  id: string;
  name: string;
  week_number: number;
  days: Day[];
}

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
