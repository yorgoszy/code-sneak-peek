import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useProgramBuilderActions = (
  programStructure: any,
  setProgramStructure: any,
  selectedDates: string[],
  setSelectedDates: any,
  onProgramSaved?: () => void
) => {
  const { toast } = useToast();

  const saveProgram = async (saveProgram: (data: any) => Promise<void>, selectedUserId?: string) => {
    try {
      console.log('💾 Saving program with structure:', programStructure);
      console.log('📅 Selected dates:', selectedDates);
      console.log('👤 Selected user:', selectedUserId);

      if (!programStructure.name) {
        toast({
          title: "Σφάλμα",
          description: "Το όνομα του προγράμματος είναι υποχρεωτικό",
          variant: "destructive",
        });
        return;
      }

      // Prepare program data with training dates
      const programData = {
        ...programStructure,
        user_id: selectedUserId || null,
        training_dates: selectedDates.length > 0 ? selectedDates : [],
        start_date: selectedDates.length > 0 ? new Date(selectedDates[0]) : null,
        weeks: programStructure.weeks || []
      };

      console.log('📦 Final program data:', programData);
      
      await saveProgram(programData);
      
      toast({
        title: "Επιτυχία",
        description: "Το πρόγραμμα αποθηκεύτηκε επιτυχώς",
      });

      if (onProgramSaved) {
        onProgramSaved();
      }
    } catch (error) {
      console.error('❌ Error saving program:', error);
      toast({
        title: "Σφάλμα",
        description: "Παρουσιάστηκε σφάλμα κατά την αποθήκευση",
        variant: "destructive",
      });
    }
  };

  const addWeek = () => {
    const newWeek = {
      id: `temp-week-${Date.now()}`,
      name: `Εβδομάδα ${(programStructure.weeks || []).length + 1}`,
      week_number: (programStructure.weeks || []).length + 1,
      program_days: []
    };

    setProgramStructure((prev: any) => ({
      ...prev,
      weeks: [...(prev.weeks || []), newWeek]
    }));
  };

  const removeWeek = (weekIndex: number) => {
    setProgramStructure((prev: any) => ({
      ...prev,
      weeks: prev.weeks?.filter((_: any, index: number) => index !== weekIndex) || []
    }));
  };

  const addDay = (weekIndex: number) => {
    setProgramStructure((prev: any) => {
      const newWeeks = [...(prev.weeks || [])];
      const targetWeek = newWeeks[weekIndex];
      
      if (targetWeek) {
        const newDay = {
          id: `temp-day-${Date.now()}`,
          name: `Ημέρα ${(targetWeek.program_days || []).length + 1}`,
          day_number: (targetWeek.program_days || []).length + 1,
          program_blocks: []
        };
        
        newWeeks[weekIndex] = {
          ...targetWeek,
          program_days: [...(targetWeek.program_days || []), newDay]
        };
      }
      
      return { ...prev, weeks: newWeeks };
    });
  };

  const removeDay = (weekIndex: number, dayIndex: number) => {
    setProgramStructure((prev: any) => {
      const newWeeks = [...(prev.weeks || [])];
      const targetWeek = newWeeks[weekIndex];
      
      if (targetWeek) {
        newWeeks[weekIndex] = {
          ...targetWeek,
          program_days: targetWeek.program_days?.filter((_: any, index: number) => index !== dayIndex) || []
        };
      }
      
      return { ...prev, weeks: newWeeks };
    });
  };

  const addBlock = (weekIndex: number, dayIndex: number) => {
    setProgramStructure((prev: any) => {
      const newWeeks = [...(prev.weeks || [])];
      const targetWeek = newWeeks[weekIndex];
      
      if (targetWeek?.program_days?.[dayIndex]) {
        const targetDay = targetWeek.program_days[dayIndex];
        const newBlock = {
          id: `temp-block-${Date.now()}`,
          name: `Block ${(targetDay.program_blocks || []).length + 1}`,
          block_order: (targetDay.program_blocks || []).length + 1,
          program_exercises: []
        };
        
        newWeeks[weekIndex].program_days[dayIndex] = {
          ...targetDay,
          program_blocks: [...(targetDay.program_blocks || []), newBlock]
        };
      }
      
      return { ...prev, weeks: newWeeks };
    });
  };

  const removeBlock = (weekIndex: number, dayIndex: number, blockIndex: number) => {
    setProgramStructure((prev: any) => {
      const newWeeks = [...(prev.weeks || [])];
      const targetWeek = newWeeks[weekIndex];
      
      if (targetWeek?.program_days?.[dayIndex]) {
        const targetDay = targetWeek.program_days[dayIndex];
        newWeeks[weekIndex].program_days[dayIndex] = {
          ...targetDay,
          program_blocks: targetDay.program_blocks?.filter((_: any, index: number) => index !== blockIndex) || []
        };
      }
      
      return { ...prev, weeks: newWeeks };
    });
  };

  return {
    saveProgram,
    addWeek,
    removeWeek,
    addDay,
    removeDay,
    addBlock,
    removeBlock
  };
};
