
import { useState } from 'react';
import { Program, Week, Day, Block } from "@/components/programs/types";

export const useProgramFormState = () => {
  // Program builder states
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [builderDialogOpen, setBuilderDialogOpen] = useState(false);

  // Dialog states
  const [showNewWeek, setShowNewWeek] = useState(false);
  const [showNewDay, setShowNewDay] = useState(false);
  const [showNewBlock, setShowNewBlock] = useState(false);
  const [showNewExercise, setShowNewExercise] = useState(false);

  // Form states
  const [newWeek, setNewWeek] = useState({ name: '', week_number: 1 });
  const [newDay, setNewDay] = useState({ name: '', day_number: 1 });
  const [newBlock, setNewBlock] = useState({ name: '', block_order: 1 });
  const [newExercise, setNewExercise] = useState({
    exercise_id: '',
    sets: 1,
    reps: '',
    kg: '',
    percentage_1rm: 0,
    tempo: '',
    rest: '',
    notes: '',
    exercise_order: 1
  });

  // Current context for adding items
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [currentDay, setCurrentDay] = useState<Day | null>(null);
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);

  return {
    editingProgram,
    setEditingProgram,
    builderDialogOpen,
    setBuilderDialogOpen,
    showNewWeek,
    setShowNewWeek,
    showNewDay,
    setShowNewDay,
    showNewBlock,
    setShowNewBlock,
    showNewExercise,
    setShowNewExercise,
    newWeek,
    setNewWeek,
    newDay,
    setNewDay,
    newBlock,
    setNewBlock,
    newExercise,
    setNewExercise,
    currentWeek,
    setCurrentWeek,
    currentDay,
    setCurrentDay,
    currentBlock,
    setCurrentBlock
  };
};
