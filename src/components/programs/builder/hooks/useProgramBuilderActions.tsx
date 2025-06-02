
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Exercise } from "../../types";

export const useProgramBuilderActions = (
  programStructure: any,
  updateProgram: any,
  generateId: () => string,
  exercises: Exercise[]
) => {
  const { toast } = useToast();

  const addWeek = () => {
    console.log('🔄 addWeek called, current weeks:', programStructure.weeks);
    
    const newWeek = {
      id: generateId(),
      name: `Εβδομάδα ${(programStructure.weeks || []).length + 1}`,
      week_number: (programStructure.weeks || []).length + 1,
      days: []
    };

    console.log('📝 Creating new week:', newWeek);
    
    updateProgram({ 
      weeks: [...(programStructure.weeks || []), newWeek] 
    });
    
    console.log('✅ Week added successfully');
  };

  const saveProgram = async (saveProgram: (data: any) => Promise<void>, selectedUserId?: string) => {
    try {
      console.log('💾 Saving program with structure:', programStructure);

      if (!programStructure.name) {
        toast({
          title: "Σφάλμα",
          description: "Το όνομα του προγράμματος είναι υποχρεωτικό",
          variant: "destructive",
        });
        return;
      }

      // Prepare program data
      const programData = {
        ...programStructure,
        user_id: selectedUserId || null,
      };

      console.log('📦 Final program data:', programData);
      
      await saveProgram(programData);
      
      toast({
        title: "Επιτυχία",
        description: "Το πρόγραμμα αποθηκεύτηκε επιτυχώς",
      });
    } catch (error) {
      console.error('❌ Error saving program:', error);
      toast({
        title: "Σφάλμα",
        description: "Παρουσιάστηκε σφάλμα κατά την αποθήκευση",
        variant: "destructive",
      });
    }
  };

  const removeWeek = (weekId: string) => {
    updateProgram({
      weeks: programStructure.weeks?.filter((week: any) => week.id !== weekId) || []
    });
  };

  const duplicateWeek = (weekId: string) => {
    const weekToDuplicate = programStructure.weeks?.find((week: any) => week.id === weekId);
    if (!weekToDuplicate) return;

    const newWeek = {
      ...weekToDuplicate,
      id: generateId(),
      name: `${weekToDuplicate.name} (αντίγραφο)`,
      week_number: (programStructure.weeks || []).length + 1,
      days: weekToDuplicate.days?.map((day: any) => ({
        ...day,
        id: generateId(),
        blocks: day.blocks?.map((block: any) => ({
          ...block,
          id: generateId(),
          exercises: block.exercises?.map((exercise: any) => ({
            ...exercise,
            id: generateId()
          })) || []
        })) || []
      })) || []
    };

    updateProgram({
      weeks: [...(programStructure.weeks || []), newWeek]
    });
  };

  const updateWeekName = (weekId: string, name: string) => {
    updateProgram({
      weeks: programStructure.weeks?.map((week: any) => 
        week.id === weekId ? { ...week, name } : week
      ) || []
    });
  };

  const addDay = (weekId: string) => {
    const newWeeks = [...(programStructure.weeks || [])];
    const weekIndex = newWeeks.findIndex(week => week.id === weekId);
    
    if (weekIndex !== -1) {
      const targetWeek = newWeeks[weekIndex];
      const newDay = {
        id: generateId(),
        name: `Ημέρα ${(targetWeek.days || []).length + 1}`,
        day_number: (targetWeek.days || []).length + 1,
        blocks: []
      };
      
      newWeeks[weekIndex] = {
        ...targetWeek,
        days: [...(targetWeek.days || []), newDay]
      };
      
      updateProgram({ weeks: newWeeks });
    }
  };

  const removeDay = (weekId: string, dayId: string) => {
    const newWeeks = [...(programStructure.weeks || [])];
    const weekIndex = newWeeks.findIndex(week => week.id === weekId);
    
    if (weekIndex !== -1) {
      const targetWeek = newWeeks[weekIndex];
      newWeeks[weekIndex] = {
        ...targetWeek,
        days: targetWeek.days?.filter((day: any) => day.id !== dayId) || []
      };
      
      updateProgram({ weeks: newWeeks });
    }
  };

  const duplicateDay = (weekId: string, dayId: string) => {
    const newWeeks = [...(programStructure.weeks || [])];
    const weekIndex = newWeeks.findIndex(week => week.id === weekId);
    
    if (weekIndex !== -1) {
      const targetWeek = newWeeks[weekIndex];
      const dayToDuplicate = targetWeek.days?.find((day: any) => day.id === dayId);
      
      if (dayToDuplicate) {
        const newDay = {
          ...dayToDuplicate,
          id: generateId(),
          name: `${dayToDuplicate.name} (αντίγραφο)`,
          day_number: (targetWeek.days || []).length + 1,
          blocks: dayToDuplicate.blocks?.map((block: any) => ({
            ...block,
            id: generateId(),
            exercises: block.exercises?.map((exercise: any) => ({
              ...exercise,
              id: generateId()
            })) || []
          })) || []
        };
        
        newWeeks[weekIndex] = {
          ...targetWeek,
          days: [...(targetWeek.days || []), newDay]
        };
        
        updateProgram({ weeks: newWeeks });
      }
    }
  };

  const updateDayName = (weekId: string, dayId: string, name: string) => {
    const newWeeks = [...(programStructure.weeks || [])];
    const weekIndex = newWeeks.findIndex(week => week.id === weekId);
    
    if (weekIndex !== -1) {
      const targetWeek = newWeeks[weekIndex];
      newWeeks[weekIndex] = {
        ...targetWeek,
        days: targetWeek.days?.map((day: any) => 
          day.id === dayId ? { ...day, name } : day
        ) || []
      };
      
      updateProgram({ weeks: newWeeks });
    }
  };

  const addBlock = (weekId: string, dayId: string) => {
    const newWeeks = [...(programStructure.weeks || [])];
    const weekIndex = newWeeks.findIndex(week => week.id === weekId);
    
    if (weekIndex !== -1) {
      const targetWeek = newWeeks[weekIndex];
      const dayIndex = targetWeek.days?.findIndex((day: any) => day.id === dayId);
      
      if (dayIndex !== -1 && dayIndex !== undefined) {
        const targetDay = targetWeek.days[dayIndex];
        const newBlock = {
          id: generateId(),
          name: `Block ${(targetDay.blocks || []).length + 1}`,
          block_order: (targetDay.blocks || []).length + 1,
          exercises: []
        };
        
        newWeeks[weekIndex].days[dayIndex] = {
          ...targetDay,
          blocks: [...(targetDay.blocks || []), newBlock]
        };
        
        updateProgram({ weeks: newWeeks });
      }
    }
  };

  const removeBlock = (weekId: string, dayId: string, blockId: string) => {
    const newWeeks = [...(programStructure.weeks || [])];
    const weekIndex = newWeeks.findIndex(week => week.id === weekId);
    
    if (weekIndex !== -1) {
      const targetWeek = newWeeks[weekIndex];
      const dayIndex = targetWeek.days?.findIndex((day: any) => day.id === dayId);
      
      if (dayIndex !== -1 && dayIndex !== undefined) {
        const targetDay = targetWeek.days[dayIndex];
        newWeeks[weekIndex].days[dayIndex] = {
          ...targetDay,
          blocks: targetDay.blocks?.filter((block: any) => block.id !== blockId) || []
        };
        
        updateProgram({ weeks: newWeeks });
      }
    }
  };

  const duplicateBlock = (weekId: string, dayId: string, blockId: string) => {
    const newWeeks = [...(programStructure.weeks || [])];
    const weekIndex = newWeeks.findIndex(week => week.id === weekId);
    
    if (weekIndex !== -1) {
      const targetWeek = newWeeks[weekIndex];
      const dayIndex = targetWeek.days?.findIndex((day: any) => day.id === dayId);
      
      if (dayIndex !== -1 && dayIndex !== undefined) {
        const targetDay = targetWeek.days[dayIndex];
        const blockToDuplicate = targetDay.blocks?.find((block: any) => block.id === blockId);
        
        if (blockToDuplicate) {
          const newBlock = {
            ...blockToDuplicate,
            id: generateId(),
            name: `${blockToDuplicate.name} (αντίγραφο)`,
            block_order: (targetDay.blocks || []).length + 1,
            exercises: blockToDuplicate.exercises?.map((exercise: any) => ({
              ...exercise,
              id: generateId()
            })) || []
          };
          
          newWeeks[weekIndex].days[dayIndex] = {
            ...targetDay,
            blocks: [...(targetDay.blocks || []), newBlock]
          };
          
          updateProgram({ weeks: newWeeks });
        }
      }
    }
  };

  const updateBlockName = (weekId: string, dayId: string, blockId: string, name: string) => {
    const newWeeks = [...(programStructure.weeks || [])];
    const weekIndex = newWeeks.findIndex(week => week.id === weekId);
    
    if (weekIndex !== -1) {
      const targetWeek = newWeeks[weekIndex];
      const dayIndex = targetWeek.days?.findIndex((day: any) => day.id === dayId);
      
      if (dayIndex !== -1 && dayIndex !== undefined) {
        const targetDay = targetWeek.days[dayIndex];
        newWeeks[weekIndex].days[dayIndex] = {
          ...targetDay,
          blocks: targetDay.blocks?.map((block: any) => 
            block.id === blockId ? { ...block, name } : block
          ) || []
        };
        
        updateProgram({ weeks: newWeeks });
      }
    }
  };

  const addExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const newWeeks = [...(programStructure.weeks || [])];
    const weekIndex = newWeeks.findIndex(week => week.id === weekId);
    
    if (weekIndex !== -1) {
      const targetWeek = newWeeks[weekIndex];
      const dayIndex = targetWeek.days?.findIndex((day: any) => day.id === dayId);
      
      if (dayIndex !== -1 && dayIndex !== undefined) {
        const targetDay = targetWeek.days[dayIndex];
        const blockIndex = targetDay.blocks?.findIndex((block: any) => block.id === blockId);
        
        if (blockIndex !== -1 && blockIndex !== undefined) {
          const targetBlock = targetDay.blocks[blockIndex];
          const newExercise = {
            id: generateId(),
            exercise_id: exerciseId,
            exercise_name: exercise.name,
            sets: 3,
            reps: '10',
            percentage_1rm: 0,
            kg: '',
            velocity_ms: '',
            tempo: '',
            rest: '',
            exercise_order: (targetBlock.exercises || []).length + 1
          };
          
          newWeeks[weekIndex].days[dayIndex].blocks[blockIndex] = {
            ...targetBlock,
            exercises: [...(targetBlock.exercises || []), newExercise]
          };
          
          updateProgram({ weeks: newWeeks });
        }
      }
    }
  };

  const removeExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string) => {
    const newWeeks = [...(programStructure.weeks || [])];
    const weekIndex = newWeeks.findIndex(week => week.id === weekId);
    
    if (weekIndex !== -1) {
      const targetWeek = newWeeks[weekIndex];
      const dayIndex = targetWeek.days?.findIndex((day: any) => day.id === dayId);
      
      if (dayIndex !== -1 && dayIndex !== undefined) {
        const targetDay = targetWeek.days[dayIndex];
        const blockIndex = targetDay.blocks?.findIndex((block: any) => block.id === blockId);
        
        if (blockIndex !== -1 && blockIndex !== undefined) {
          const targetBlock = targetDay.blocks[blockIndex];
          newWeeks[weekIndex].days[dayIndex].blocks[blockIndex] = {
            ...targetBlock,
            exercises: targetBlock.exercises?.filter((exercise: any) => exercise.id !== exerciseId) || []
          };
          
          updateProgram({ weeks: newWeeks });
        }
      }
    }
  };

  const updateExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => {
    const newWeeks = [...(programStructure.weeks || [])];
    const weekIndex = newWeeks.findIndex(week => week.id === weekId);
    
    if (weekIndex !== -1) {
      const targetWeek = newWeeks[weekIndex];
      const dayIndex = targetWeek.days?.findIndex((day: any) => day.id === dayId);
      
      if (dayIndex !== -1 && dayIndex !== undefined) {
        const targetDay = targetWeek.days[dayIndex];
        const blockIndex = targetDay.blocks?.findIndex((block: any) => block.id === blockId);
        
        if (blockIndex !== -1 && blockIndex !== undefined) {
          const targetBlock = targetDay.blocks[blockIndex];
          newWeeks[weekIndex].days[dayIndex].blocks[blockIndex] = {
            ...targetBlock,
            exercises: targetBlock.exercises?.map((exercise: any) => 
              exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise
            ) || []
          };
          
          updateProgram({ weeks: newWeeks });
        }
      }
    }
  };

  const duplicateExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string) => {
    const newWeeks = [...(programStructure.weeks || [])];
    const weekIndex = newWeeks.findIndex(week => week.id === weekId);
    
    if (weekIndex !== -1) {
      const targetWeek = newWeeks[weekIndex];
      const dayIndex = targetWeek.days?.findIndex((day: any) => day.id === dayId);
      
      if (dayIndex !== -1 && dayIndex !== undefined) {
        const targetDay = targetWeek.days[dayIndex];
        const blockIndex = targetDay.blocks?.findIndex((block: any) => block.id === blockId);
        
        if (blockIndex !== -1 && blockIndex !== undefined) {
          const targetBlock = targetDay.blocks[blockIndex];
          const exerciseToDuplicate = targetBlock.exercises?.find((exercise: any) => exercise.id === exerciseId);
          
          if (exerciseToDuplicate) {
            const newExercise = {
              ...exerciseToDuplicate,
              id: generateId(),
              exercise_order: (targetBlock.exercises || []).length + 1
            };
            
            newWeeks[weekIndex].days[dayIndex].blocks[blockIndex] = {
              ...targetBlock,
              exercises: [...(targetBlock.exercises || []), newExercise]
            };
            
            updateProgram({ weeks: newWeeks });
          }
        }
      }
    }
  };

  const reorderWeeks = (oldIndex: number, newIndex: number) => {
    const newWeeks = [...(programStructure.weeks || [])];
    const [reorderedWeek] = newWeeks.splice(oldIndex, 1);
    newWeeks.splice(newIndex, 0, reorderedWeek);
    
    // Update week numbers
    newWeeks.forEach((week, index) => {
      week.week_number = index + 1;
    });
    
    updateProgram({ weeks: newWeeks });
  };

  const reorderDays = (weekId: string, oldIndex: number, newIndex: number) => {
    const newWeeks = [...(programStructure.weeks || [])];
    const weekIndex = newWeeks.findIndex(week => week.id === weekId);
    
    if (weekIndex !== -1) {
      const targetWeek = newWeeks[weekIndex];
      const newDays = [...(targetWeek.days || [])];
      const [reorderedDay] = newDays.splice(oldIndex, 1);
      newDays.splice(newIndex, 0, reorderedDay);
      
      // Update day numbers
      newDays.forEach((day, index) => {
        day.day_number = index + 1;
      });
      
      newWeeks[weekIndex] = { ...targetWeek, days: newDays };
      
      updateProgram({ weeks: newWeeks });
    }
  };

  const reorderBlocks = (weekId: string, dayId: string, oldIndex: number, newIndex: number) => {
    const newWeeks = [...(programStructure.weeks || [])];
    const weekIndex = newWeeks.findIndex(week => week.id === weekId);
    
    if (weekIndex !== -1) {
      const targetWeek = newWeeks[weekIndex];
      const dayIndex = targetWeek.days?.findIndex((day: any) => day.id === dayId);
      
      if (dayIndex !== -1 && dayIndex !== undefined) {
        const targetDay = targetWeek.days[dayIndex];
        const newBlocks = [...(targetDay.blocks || [])];
        const [reorderedBlock] = newBlocks.splice(oldIndex, 1);
        newBlocks.splice(newIndex, 0, reorderedBlock);
        
        // Update block orders
        newBlocks.forEach((block, index) => {
          block.block_order = index + 1;
        });
        
        newWeeks[weekIndex].days[dayIndex] = { ...targetDay, blocks: newBlocks };
        
        updateProgram({ weeks: newWeeks });
      }
    }
  };

  const reorderExercises = (weekId: string, dayId: string, blockId: string, oldIndex: number, newIndex: number) => {
    const newWeeks = [...(programStructure.weeks || [])];
    const weekIndex = newWeeks.findIndex(week => week.id === weekId);
    
    if (weekIndex !== -1) {
      const targetWeek = newWeeks[weekIndex];
      const dayIndex = targetWeek.days?.findIndex((day: any) => day.id === dayId);
      
      if (dayIndex !== -1 && dayIndex !== undefined) {
        const targetDay = targetWeek.days[dayIndex];
        const blockIndex = targetDay.blocks?.findIndex((block: any) => block.id === blockId);
        
        if (blockIndex !== -1 && blockIndex !== undefined) {
          const targetBlock = targetDay.blocks[blockIndex];
          const newExercises = [...(targetBlock.exercises || [])];
          const [reorderedExercise] = newExercises.splice(oldIndex, 1);
          newExercises.splice(newIndex, 0, reorderedExercise);
          
          // Update exercise orders
          newExercises.forEach((exercise, index) => {
            exercise.exercise_order = index + 1;
          });
          
          newWeeks[weekIndex].days[dayIndex].blocks[blockIndex] = { ...targetBlock, exercises: newExercises };
          
          updateProgram({ weeks: newWeeks });
        }
      }
    }
  };

  return {
    saveProgram,
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
