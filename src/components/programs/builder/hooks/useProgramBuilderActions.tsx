import { ProgramStructure } from './useProgramBuilderState';

export const useProgramBuilderActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure>) => void,
  generateId: () => string,
  exercises: any[]
) => {
  const addWeek = () => {
    const newWeek = {
      id: generateId(),
      name: `Εβδομάδα ${(program.weeks?.length || 0) + 1}`,
      week_number: (program.weeks?.length || 0) + 1,
      days: []
    };

    const updatedWeeks = [...(program.weeks || []), newWeek];
    updateProgram({ weeks: updatedWeeks });
  };

  const removeWeek = (weekId: string) => {
    const updatedWeeks = (program.weeks || []).filter(week => week.id !== weekId);
    updateProgram({ weeks: updatedWeeks });
  };

  const duplicateWeek = (weekId: string) => {
    const weekToDuplicate = program.weeks?.find(week => week.id === weekId);
    if (!weekToDuplicate) return;

    const newWeek = {
      ...JSON.parse(JSON.stringify(weekToDuplicate)),
      id: generateId(),
      name: `${weekToDuplicate.name} (Αντίγραφο)`,
      week_number: (program.weeks?.length || 0) + 1,
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

    const updatedWeeks = [...(program.weeks || []), newWeek];
    updateProgram({ weeks: updatedWeeks });
  };

  const updateWeekName = (weekId: string, name: string) => {
    const updatedWeeks = (program.weeks || []).map(week =>
      week.id === weekId ? { ...week, name } : week
    );
    updateProgram({ weeks: updatedWeeks });
  };

  const addDay = (weekId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        const newDay = {
          id: generateId(),
          name: `Ημέρα ${(week.days?.length || 0) + 1}`,
          day_number: (week.days?.length || 0) + 1,
          blocks: []
        };
        return {
          ...week,
          days: [...(week.days || []), newDay]
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const removeDay = (weekId: string, dayId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).filter(day => day.id !== dayId)
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const duplicateDay = (weekId: string, dayId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        const dayToDuplicate = week.days?.find(day => day.id === dayId);
        if (!dayToDuplicate) return week;

        const newDay = {
          ...JSON.parse(JSON.stringify(dayToDuplicate)),
          id: generateId(),
          name: `${dayToDuplicate.name} (Αντίγραφο)`,
          day_number: (week.days?.length || 0) + 1,
          blocks: dayToDuplicate.blocks.map(block => ({
            ...block,
            id: generateId(),
            exercises: block.exercises.map(exercise => ({
              ...exercise,
              id: generateId()
            }))
          }))
        };

        return {
          ...week,
          days: [...(week.days || []), newDay]
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const updateDayName = (weekId: string, dayId: string, name: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).map(day =>
            day.id === dayId ? { ...day, name } : day
          )
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const addBlock = (weekId: string, dayId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              const newBlock = {
                id: generateId(),
                name: `Μπλοκ ${(day.blocks?.length || 0) + 1}`,
                block_order: (day.blocks?.length || 0) + 1,
                exercises: []
              };
              return {
                ...day,
                blocks: [...(day.blocks || []), newBlock]
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const removeBlock = (weekId: string, dayId: string, blockId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                blocks: (day.blocks || []).filter(block => block.id !== blockId)
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const duplicateBlock = (weekId: string, dayId: string, blockId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              const blockToDuplicate = day.blocks?.find(block => block.id === blockId);
              if (!blockToDuplicate) return day;

              const newBlock = {
                ...JSON.parse(JSON.stringify(blockToDuplicate)),
                id: generateId(),
                name: `${blockToDuplicate.name} (Αντίγραφο)`,
                block_order: (day.blocks?.length || 0) + 1,
                exercises: blockToDuplicate.exercises.map(exercise => ({
                  ...exercise,
                  id: generateId()
                }))
              };

              return {
                ...day,
                blocks: [...(day.blocks || []), newBlock]
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const updateBlockName = (weekId: string, dayId: string, blockId: string, name: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                blocks: (day.blocks || []).map(block =>
                  block.id === blockId ? { ...block, name } : block
                )
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const addExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string) => {
    const selectedExercise = exercises.find(ex => ex.id === exerciseId);
    
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                blocks: (day.blocks || []).map(block => {
                  if (block.id === blockId) {
                    const newExercise = {
                      id: generateId(),
                      exercise_id: exerciseId,
                      exercise_name: selectedExercise?.name || '',
                      sets: 0, // Changed to 0 instead of empty string to maintain number type
                      reps: '',
                      percentage_1rm: 0,
                      kg: '',
                      velocity_ms: '',
                      tempo: '',
                      rest: '',
                      exercise_order: (block.exercises?.length || 0) + 1
                    };
                    
                    return {
                      ...block,
                      exercises: [...(block.exercises || []), newExercise]
                    };
                  }
                  return block;
                })
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const removeExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                blocks: (day.blocks || []).map(block => {
                  if (block.id === blockId) {
                    return {
                      ...block,
                      exercises: (block.exercises || []).filter(exercise => exercise.id !== exerciseId)
                    };
                  }
                  return block;
                })
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const updateExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                blocks: (day.blocks || []).map(block => {
                  if (block.id === blockId) {
                    return {
                      ...block,
                      exercises: (block.exercises || []).map(exercise =>
                        exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise
                      )
                    };
                  }
                  return block;
                })
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const duplicateExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                blocks: (day.blocks || []).map(block => {
                  if (block.id === blockId) {
                    const exerciseToDuplicate = block.exercises?.find(exercise => exercise.id === exerciseId);
                    if (!exerciseToDuplicate) return block;

                    const newExercise = {
                      ...exerciseToDuplicate,
                      id: generateId(),
                      exercise_order: (block.exercises?.length || 0) + 1
                    };

                    return {
                      ...block,
                      exercises: [...(block.exercises || []), newExercise]
                    };
                  }
                  return block;
                })
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const reorderWeeks = (oldIndex: number, newIndex: number) => {
    const weeks = [...(program.weeks || [])];
    const [reorderedItem] = weeks.splice(oldIndex, 1);
    weeks.splice(newIndex, 0, reorderedItem);
    
    // Update week numbers
    const updatedWeeks = weeks.map((week, index) => ({
      ...week,
      week_number: index + 1
    }));
    
    updateProgram({ weeks: updatedWeeks });
  };

  const reorderDays = (weekId: string, oldIndex: number, newIndex: number) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        const days = [...(week.days || [])];
        const [reorderedItem] = days.splice(oldIndex, 1);
        days.splice(newIndex, 0, reorderedItem);
        
        // Update day numbers
        const updatedDays = days.map((day, index) => ({
          ...day,
          day_number: index + 1
        }));
        
        return { ...week, days: updatedDays };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const reorderBlocks = (weekId: string, dayId: string, oldIndex: number, newIndex: number) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              const blocks = [...(day.blocks || [])];
              const [reorderedItem] = blocks.splice(oldIndex, 1);
              blocks.splice(newIndex, 0, reorderedItem);
              
              // Update block order
              const updatedBlocks = blocks.map((block, index) => ({
                ...block,
                block_order: index + 1
              }));
              
              return { ...day, blocks: updatedBlocks };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const reorderExercises = (weekId: string, dayId: string, blockId: string, oldIndex: number, newIndex: number) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                blocks: (day.blocks || []).map(block => {
                  if (block.id === blockId) {
                    const exercises = [...(block.exercises || [])];
                    const [reorderedItem] = exercises.splice(oldIndex, 1);
                    exercises.splice(newIndex, 0, reorderedItem);
                    
                    // Update exercise order
                    const updatedExercises = exercises.map((exercise, index) => ({
                      ...exercise,
                      exercise_order: index + 1
                    }));
                    
                    return { ...block, exercises: updatedExercises };
                  }
                  return block;
                })
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
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
    duplicateBlock,
    updateBlockName,
    addExercise,
    removeExercise,
    updateExercise,
    duplicateExercise,
    reorderWeeks,
    reorderDays,
    reorderBlocks,
    reorderExercises
  };
};
