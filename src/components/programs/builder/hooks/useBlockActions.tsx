
import { ProgramStructure } from './useProgramBuilderState';
import { toast } from 'sonner';

export const useBlockActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure>) => void,
  generateId: () => string,
  saveProgram?: (programData: any) => Promise<any>
) => {
  const addBlock = (weekId: string, dayId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              const currentBlocks = day.program_blocks || [];
              
              // Βρίσκουμε το recovery block
              const recoveryIndex = currentBlocks.findIndex(b => b.training_type === 'recovery');
              
              const newBlock = {
                id: generateId(),
                name: `Μπλοκ ${currentBlocks.length + 1}`,
                block_order: currentBlocks.length + 1,
                training_type: undefined,
                workout_format: undefined,
                workout_duration: '',
                block_sets: 1,
                program_exercises: []
              };
              
              let updatedBlocks;
              if (recoveryIndex !== -1) {
                // Αν υπάρχει recovery, βάζουμε το νέο block πριν από αυτό
                updatedBlocks = [
                  ...currentBlocks.slice(0, recoveryIndex),
                  newBlock,
                  ...currentBlocks.slice(recoveryIndex)
                ];
              } else {
                // Αλλιώς το βάζουμε στο τέλος
                updatedBlocks = [...currentBlocks, newBlock];
              }
              
              // Ενημερώνουμε τα block_order
              updatedBlocks = updatedBlocks.map((block, index) => ({
                ...block,
                block_order: index + 1
              }));
              
              return {
                ...day,
                program_blocks: updatedBlocks
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
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).filter(block => block.id !== blockId)
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

  const duplicateBlock = async (weekId: string, dayId: string, blockId: string) => {
    let updatedWeeks: any[] = [];
    
    updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              const blockToDuplicate = day.program_blocks?.find(block => block.id === blockId);
              if (!blockToDuplicate) return day;

              // Ταξινόμηση των ασκήσεων με βάση το exercise_order ΠΡΙΝ την αντιγραφή
              const sortedExercises = [...(blockToDuplicate.program_exercises || [])].sort((a, b) => {
                const orderA = Number(a.exercise_order) || 0;
                const orderB = Number(b.exercise_order) || 0;
                return orderA - orderB;
              });

              const newBlock = {
                id: generateId(),
                name: `${blockToDuplicate.name} (Αντίγραφο)`,
                block_order: (day.program_blocks?.length || 0) + 1,
                training_type: blockToDuplicate.training_type,
                workout_format: (blockToDuplicate.workout_format as any) || undefined,
                workout_duration: blockToDuplicate.workout_duration || '',
                block_sets: blockToDuplicate.block_sets || 1,
                program_exercises: sortedExercises.map(exercise => ({
                  ...exercise,
                  id: generateId()
                }))
              };

              return {
                ...day,
                program_blocks: [...(day.program_blocks || []), newBlock]
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });

    // Auto-save στη βάση αν υπάρχει το πρόγραμμα
    if (saveProgram && program.id) {
      console.log('💾 [DUPLICATE BLOCK] Auto-saving to database...');
      try {
        await saveProgram({
          ...program,
          weeks: updatedWeeks
        });
        console.log('✅ [DUPLICATE BLOCK] Auto-save completed');
      } catch (error) {
        console.error('❌ [DUPLICATE BLOCK] Auto-save failed:', error);
      }
    }
  };

  const updateBlockName = (weekId: string, dayId: string, blockId: string, name: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block =>
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

  const updateBlockTrainingType = (weekId: string, dayId: string, blockId: string, trainingType: string) => {
    // Get the label for the training type
    const TRAINING_TYPE_LABELS: Record<string, string> = {
      'warm up': 'warm up',
      'pillar prep': 'pillar prep',
      'movement prep': 'mov prep',
      activation: 'activation',
      plyos: 'plyos',
      'movement skills': 'mov skills',
      'med ball': 'med ball',
      power: 'power',
      str: 'str',
      'str/spd': 'str/spd',
      pwr: 'pwr',
      'spd/str': 'spd/str',
      spd: 'spd',
      'str/end': 'str/end',
      'pwr/end': 'pwr/end',
      'spd/end': 'spd/end',
      end: 'end',
      hpr: 'hpr',
      mobility: 'mobility',
      'neural act': 'neural act',
      stability: 'stability',
      recovery: 'rec',
      accessory: 'acc',
      rotational: 'rot',
    };
    
    const blockName = TRAINING_TYPE_LABELS[trainingType] || trainingType;
    
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block =>
                  block.id === blockId ? { ...block, training_type: trainingType as any, name: blockName } : block
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

  const updateBlockWorkoutFormat = (weekId: string, dayId: string, blockId: string, workoutFormat: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block =>
                  block.id === blockId
                    ? {
                        ...block,
                        workout_format: (workoutFormat ? (workoutFormat as any) : undefined)
                      }
                    : block
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

  const updateBlockWorkoutDuration = (weekId: string, dayId: string, blockId: string, workoutDuration: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block =>
                  block.id === blockId ? { ...block, workout_duration: workoutDuration } : block
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

  const updateBlockSets = (weekId: string, dayId: string, blockId: string, blockSets: number) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block =>
                  block.id === blockId ? { ...block, block_sets: blockSets } : block
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

  // Paste block from clipboard (δεν κάνει auto-save για να αποφύγουμε κλείσιμο dialog)
  const pasteBlock = (weekId: string, dayId: string, clipboardBlock: any) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              const currentBlocks = day.program_blocks || [];
              
              // Create new block with new IDs
              const newBlock = {
                id: generateId(),
                name: clipboardBlock.name,
                block_order: currentBlocks.length + 1,
                training_type: clipboardBlock.training_type,
                workout_format: clipboardBlock.workout_format,
                workout_duration: clipboardBlock.workout_duration,
                block_sets: clipboardBlock.block_sets || 1,
                program_exercises: (clipboardBlock.program_exercises || []).map((exercise: any, idx: number) => ({
                  ...exercise,
                  id: generateId(),
                  exercise_order: idx + 1
                }))
              };
              
              return {
                ...day,
                program_blocks: [...currentBlocks, newBlock]
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
    toast.success('Block επικολλήθηκε επιτυχώς');
  };

  // Paste block content into existing block (replace content) - δεν κάνει auto-save
  const pasteBlockAtBlock = (weekId: string, dayId: string, blockId: string, clipboardBlock: any) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block => {
                  if (block.id === blockId) {
                    // Replace block content with clipboard block content
                    return {
                      ...block,
                      name: clipboardBlock.name,
                      training_type: clipboardBlock.training_type,
                      workout_format: clipboardBlock.workout_format,
                      workout_duration: clipboardBlock.workout_duration,
                      block_sets: clipboardBlock.block_sets || 1,
                      program_exercises: (clipboardBlock.program_exercises || []).map((exercise: any, idx: number) => ({
                        ...exercise,
                        id: generateId(),
                        exercise_order: idx + 1
                      }))
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
    toast.success('Block επικολλήθηκε επιτυχώς');
  };

  // Load block template into existing block - δεν κάνει auto-save
  const loadBlockTemplate = (weekId: string, dayId: string, blockId: string, template: any) => {
    console.log('📦 [LOAD TEMPLATE] Loading template into block:', { weekId, dayId, blockId, template });
    
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block => {
                  if (block.id === blockId) {
                    // Replace block content with template content
                    return {
                      ...block,
                      name: template.name || block.name,
                      training_type: template.training_type || block.training_type,
                      workout_format: template.workout_format || block.workout_format,
                      workout_duration: template.workout_duration || block.workout_duration,
                      block_sets: template.block_sets || block.block_sets || 1,
                      program_exercises: (template.exercises || []).map((exercise: any, idx: number) => ({
                        id: generateId(),
                        exercise_id: exercise.exercise_id,
                        exercise_order: idx + 1,
                        sets: exercise.sets,
                        reps: exercise.reps,
                        reps_mode: exercise.reps_mode,
                        kg: exercise.kg,
                        kg_mode: exercise.kg_mode,
                        percentage_1rm: exercise.percentage_1rm,
                        tempo: exercise.tempo,
                        rest: exercise.rest,
                        notes: exercise.notes
                      }))
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
    toast.success('Template φορτώθηκε επιτυχώς');
  };

  return {
    addBlock,
    removeBlock,
    duplicateBlock,
    updateBlockName,
    updateBlockTrainingType,
    updateBlockWorkoutFormat,
    updateBlockWorkoutDuration,
    updateBlockSets,
    pasteBlock,
    pasteBlockAtBlock,
    loadBlockTemplate
  };
};
