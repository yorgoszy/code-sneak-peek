
import { arrayMove } from '@dnd-kit/sortable';
import { Exercise } from '../../types';
import { ProgramStructure, Week, Day, Block, ProgramExercise } from './useProgramBuilderState';

export const useProgramBuilderActions = (
  program: ProgramStructure,
  setProgram: (program: ProgramStructure) => void,
  generateId: () => string,
  exercises: Exercise[]
) => {
  const addWeek = () => {
    const newWeek: Week = {
      id: generateId(),
      name: `Εβδομάδα ${program.weeks.length + 1}`,
      week_number: program.weeks.length + 1,
      days: []
    };
    setProgram({ ...program, weeks: [...program.weeks, newWeek] });
  };

  const removeWeek = (weekId: string) => {
    setProgram({
      ...program,
      weeks: program.weeks.filter(w => w.id !== weekId)
    });
  };

  const duplicateWeek = (weekId: string) => {
    const weekToDuplicate = program.weeks.find(w => w.id === weekId);
    if (!weekToDuplicate) return;

    const newWeek: Week = {
      ...weekToDuplicate,
      id: generateId(),
      name: `${weekToDuplicate.name} (Αντίγραφο)`,
      week_number: program.weeks.length + 1,
      days: weekToDuplicate.days.map(day => ({
        ...day,
        id: generateId(),
        blocks: day.blocks.map(block => ({
          ...block,
          id: generateId(),
          exercises: block.exercises.map(exercise => ({
            ...exercise,
            id: generateId()
          }))
        }))
      }))
    };

    setProgram({ ...program, weeks: [...program.weeks, newWeek] });
  };

  const updateWeekName = (weekId: string, name: string) => {
    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId ? { ...w, name } : w
      )
    });
  };

  const addDay = (weekId: string) => {
    const week = program.weeks.find(w => w.id === weekId);
    if (!week) return;

    const newDay: Day = {
      id: generateId(),
      name: `Ημέρα ${week.days.length + 1}`,
      day_number: week.days.length + 1,
      blocks: []
    };

    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? { ...w, days: [...w.days, newDay] }
          : w
      )
    });
  };

  const removeDay = (weekId: string, dayId: string) => {
    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? { ...w, days: w.days.filter(d => d.id !== dayId) }
          : w
      )
    });
  };

  const duplicateDay = (weekId: string, dayId: string) => {
    const week = program.weeks.find(w => w.id === weekId);
    const dayToDuplicate = week?.days.find(d => d.id === dayId);
    if (!week || !dayToDuplicate) return;

    const newDay: Day = {
      ...dayToDuplicate,
      id: generateId(),
      name: `${dayToDuplicate.name} (Αντίγραφο)`,
      day_number: week.days.length + 1,
      blocks: dayToDuplicate.blocks.map(block => ({
        ...block,
        id: generateId(),
        exercises: block.exercises.map(exercise => ({
          ...exercise,
          id: generateId()
        }))
      }))
    };

    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? { ...w, days: [...w.days, newDay] }
          : w
      )
    });
  };

  const updateDayName = (weekId: string, dayId: string, name: string) => {
    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? {
              ...w,
              days: w.days.map(d => 
                d.id === dayId ? { ...d, name } : d
              )
            }
          : w
      )
    });
  };

  const addBlock = (weekId: string, dayId: string) => {
    const week = program.weeks.find(w => w.id === weekId);
    const day = week?.days.find(d => d.id === dayId);
    if (!day) return;

    const newBlock: Block = {
      id: generateId(),
      name: `Block ${day.blocks.length + 1}`,
      block_order: day.blocks.length + 1,
      exercises: []
    };

    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? {
              ...w,
              days: w.days.map(d => 
                d.id === dayId 
                  ? { ...d, blocks: [...d.blocks, newBlock] }
                  : d
              )
            }
          : w
      )
    });
  };

  const removeBlock = (weekId: string, dayId: string, blockId: string) => {
    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? {
              ...w,
              days: w.days.map(d => 
                d.id === dayId 
                  ? { ...d, blocks: d.blocks.filter(b => b.id !== blockId) }
                  : d
              )
            }
          : w
      )
    });
  };

  const addExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string) => {
    const week = program.weeks.find(w => w.id === weekId);
    const day = week?.days.find(d => d.id === dayId);
    const block = day?.blocks.find(b => b.id === blockId);
    if (!block) return;

    const newExercise: ProgramExercise = {
      id: generateId(),
      exercise_id: exerciseId,
      exercise_name: exercises.find(ex => ex.id === exerciseId)?.name || '',
      sets: 1,
      reps: '',
      percentage_1rm: 0,
      kg: '',
      velocity_ms: '',
      tempo: '',
      rest: '',
      exercise_order: block.exercises.length + 1
    };

    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? {
              ...w,
              days: w.days.map(d => 
                d.id === dayId 
                  ? {
                      ...d,
                      blocks: d.blocks.map(b => 
                        b.id === blockId 
                          ? { ...b, exercises: [...b.exercises, newExercise] }
                          : b
                      )
                    }
                  : d
              )
            }
          : w
      )
    });
  };

  const duplicateExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string) => {
    const week = program.weeks.find(w => w.id === weekId);
    const day = week?.days.find(d => d.id === dayId);
    const block = day?.blocks.find(b => b.id === blockId);
    const exerciseToDuplicate = block?.exercises.find(e => e.id === exerciseId);
    if (!block || !exerciseToDuplicate) return;

    const newExercise: ProgramExercise = {
      ...exerciseToDuplicate,
      id: generateId(),
      exercise_order: block.exercises.length + 1
    };

    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? {
              ...w,
              days: w.days.map(d => 
                d.id === dayId 
                  ? {
                      ...d,
                      blocks: d.blocks.map(b => 
                        b.id === blockId 
                          ? { ...b, exercises: [...b.exercises, newExercise] }
                          : b
                      )
                    }
                  : d
              )
            }
          : w
      )
    });
  };

  const updateBlockName = (weekId: string, dayId: string, blockId: string, name: string) => {
    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? {
              ...w,
              days: w.days.map(d => 
                d.id === dayId 
                  ? {
                      ...d,
                      blocks: d.blocks.map(b => 
                        b.id === blockId ? { ...b, name } : b
                      )
                    }
                  : d
              )
            }
          : w
      )
    });
  };

  const updateExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => {
    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? {
              ...w,
              days: w.days.map(d => 
                d.id === dayId 
                  ? {
                      ...d,
                      blocks: d.blocks.map(b => 
                        b.id === blockId 
                          ? {
                              ...b,
                              exercises: b.exercises.map(e => 
                                e.id === exerciseId 
                                  ? { 
                                      ...e, 
                                      [field]: value,
                                      ...(field === 'exercise_id' && {
                                        exercise_name: exercises.find(ex => ex.id === value)?.name || ''
                                      })
                                    }
                                  : e
                              )
                            }
                          : b
                      )
                    }
                  : d
              )
            }
          : w
      )
    });
  };

  const removeExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string) => {
    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? {
              ...w,
              days: w.days.map(d => 
                d.id === dayId 
                  ? {
                      ...d,
                      blocks: d.blocks.map(b => 
                        b.id === blockId 
                          ? { ...b, exercises: b.exercises.filter(e => e.id !== exerciseId) }
                          : b
                      )
                    }
                  : d
              )
            }
          : w
      )
    });
  };

  const duplicateBlock = (weekId: string, dayId: string, blockId: string) => {
    const week = program.weeks.find(w => w.id === weekId);
    const day = week?.days.find(d => d.id === dayId);
    const blockToDuplicate = day?.blocks.find(b => b.id === blockId);
    if (!day || !blockToDuplicate) return;

    const newBlock: Block = {
      ...blockToDuplicate,
      id: generateId(),
      name: `${blockToDuplicate.name} (Αντίγραφο)`,
      block_order: day.blocks.length + 1,
      exercises: blockToDuplicate.exercises.map(exercise => ({
        ...exercise,
        id: generateId()
      }))
    };

    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? {
              ...w,
              days: w.days.map(d => 
                d.id === dayId 
                  ? { ...d, blocks: [...d.blocks, newBlock] }
                  : d
              )
            }
          : w
      )
    });
  };

  const reorderWeeks = (oldIndex: number, newIndex: number) => {
    const newWeeks = arrayMove(program.weeks, oldIndex, newIndex).map((week, index) => ({
      ...week,
      week_number: index + 1
    }));
    setProgram({ ...program, weeks: newWeeks });
  };

  const reorderDays = (weekId: string, oldIndex: number, newIndex: number) => {
    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? {
              ...w,
              days: arrayMove(w.days, oldIndex, newIndex).map((day, index) => ({
                ...day,
                day_number: index + 1
              }))
            }
          : w
      )
    });
  };

  const reorderBlocks = (weekId: string, dayId: string, oldIndex: number, newIndex: number) => {
    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? {
              ...w,
              days: w.days.map(d => 
                d.id === dayId 
                  ? {
                      ...d,
                      blocks: arrayMove(d.blocks, oldIndex, newIndex).map((block, index) => ({
                        ...block,
                        block_order: index + 1
                      }))
                    }
                  : d
              )
            }
          : w
      )
    });
  };

  const reorderExercises = (weekId: string, dayId: string, blockId: string, oldIndex: number, newIndex: number) => {
    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? {
              ...w,
              days: w.days.map(d => 
                d.id === dayId 
                  ? {
                      ...d,
                      blocks: d.blocks.map(b => 
                        b.id === blockId 
                          ? {
                              ...b,
                              exercises: arrayMove(b.exercises, oldIndex, newIndex).map((exercise, index) => ({
                                ...exercise,
                                exercise_order: index + 1
                              }))
                            }
                          : b
                      )
                    }
                  : d
              )
            }
          : w
      )
    });
  };

  return {
    addWeek,
    removeWeek,
    duplicateWeek,
    updateWeekName,
    addDay,
    removeDay,
    duplicateDay,
    updateDayName,
    addBlock,
    removeBlock,
    addExercise,
    duplicateExercise,
    updateBlockName,
    updateExercise,
    removeExercise,
    duplicateBlock,
    reorderWeeks,
    reorderDays,
    reorderBlocks,
    reorderExercises
  };
};
