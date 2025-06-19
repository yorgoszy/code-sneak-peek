
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProgramStructure } from './useProgramStructure';

export const useProgramSave = () => {
  const [loading, setLoading] = useState(false);
  const { createProgramStructure } = useProgramStructure();

  const saveProgram = async (programData: any) => {
    setLoading(true);
    try {
      console.log('💾 [useProgramSave] Starting saveProgram with data:', {
        id: programData.id,
        name: programData.name,
        hasWeeks: programData.weeks?.length || 0,
        weeksDetail: programData.weeks?.map(w => ({
          id: w.id,
          name: w.name,
          daysCount: w.program_days?.length || 0,
          days: w.program_days?.map(d => ({
            id: d.id,
            name: d.name,
            blocksCount: d.program_blocks?.length || 0,
            blocks: d.program_blocks?.map(b => ({
              id: b.id,
              name: b.name,
              exercisesCount: b.program_exercises?.length || 0
            }))
          }))
        }))
      });

      // Διασφαλίζουμε ότι έχουμε training_dates
      let trainingDatesArray = [];
      if (programData.training_dates && Array.isArray(programData.training_dates)) {
        trainingDatesArray = programData.training_dates.map(date => {
          if (typeof date === 'string') {
            return date;
          } else if (date instanceof Date) {
            return date.toISOString().split('T')[0];
          } else {
            return new Date(date).toISOString().split('T')[0];
          }
        });
      } else if (programData.weeks && programData.weeks.length > 0) {
        // Αν δεν υπάρχουν training_dates, δημιουργούμε αυτόματα
        const totalDays = programData.weeks.reduce((total, week) => total + (week.program_days?.length || 0), 0);
        const today = new Date();
        trainingDatesArray = [];
        for (let i = 0; i < totalDays; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          trainingDatesArray.push(date.toISOString().split('T')[0]);
        }
        console.log('📅 Auto-generated training dates:', trainingDatesArray);
      }

      // Βασικά δεδομένα προγράμματος
      const programPayload = {
        name: programData.name,
        description: programData.description || '',
        user_id: programData.user_id || null,
        status: programData.status || 'draft',
        type: programData.type || 'strength',
        duration: programData.weeks?.length || null,
        training_days: programData.weeks?.[0]?.program_days?.length || null
      };

      console.log('💾 [useProgramSave] Program payload:', programPayload);

      let savedProgram;

      if (programData.id) {
        // Έλεγχος αν το πρόγραμμα υπάρχει πριν την ενημέρωση
        console.log('🔍 Checking if program exists:', programData.id);
        
        const { data: existingProgram, error: checkError } = await supabase
          .from('programs')
          .select('id')
          .eq('id', programData.id)
          .maybeSingle();

        if (checkError) {
          console.error('❌ Error checking program:', checkError);
          throw checkError;
        }

        if (existingProgram) {
          // Update existing program
          console.log('🔄 Updating existing program:', programData.id);
          
          const { data, error } = await supabase
            .from('programs')
            .update(programPayload)
            .eq('id', programData.id)
            .select()
            .single();

          if (error) throw error;
          savedProgram = data;

          // Ενημέρωση των training_dates στα program_assignments αν υπάρχουν
          if (trainingDatesArray.length > 0) {
            await supabase
              .from('program_assignments')
              .update({ training_dates: trainingDatesArray })
              .eq('program_id', programData.id);
          }

          // Διαγραφή υπάρχουσας δομής πριν την αναδημιουργία
          await deleteExistingStructure(programData.id);
        } else {
          // Το πρόγραμμα δεν υπάρχει, δημιουργούμε νέο
          console.log('📝 Program not found, creating new one');
          
          const { data, error } = await supabase
            .from('programs')
            .insert([programPayload])
            .select()
            .single();

          if (error) throw error;
          savedProgram = data;
        }
      } else {
        // Create new program
        console.log('🆕 Creating new program');
        
        const { data, error } = await supabase
          .from('programs')
          .insert([programPayload])
          .select()
          .single();

        if (error) throw error;
        savedProgram = data;
      }

      console.log('✅ [useProgramSave] Program saved:', savedProgram);

      // ΚΡΙΤΙΚΟ: Δημιουργία δομής προγράμματος (weeks, days, blocks, exercises)
      if (programData.weeks && programData.weeks.length > 0) {
        console.log('🏗️ [useProgramSave] Creating program structure with weeks:', programData.weeks.length);
        
        // Βεβαιωνόμαστε ότι τα δεδομένα είναι σωστά πριν περάσουν στο createProgramStructure
        console.log('🏗️ [useProgramSave] Structure data being passed:', {
          weeks: programData.weeks.map(w => ({
            id: w.id,
            name: w.name,
            daysCount: w.program_days?.length,
            totalExercises: w.program_days?.reduce((total, d) => 
              total + (d.program_blocks?.reduce((blockTotal, b) => 
                blockTotal + (b.program_exercises?.length || 0), 0) || 0), 0)
          }))
        });
        
        // Χρησιμοποιούμε τη μέθοδο createProgramStructure
        await createProgramStructure(savedProgram.id, {
          weeks: programData.weeks
        });
        
        console.log('✅ [useProgramSave] Program structure created successfully');
      } else {
        console.log('⚠️ [useProgramSave] No weeks found in program data');
      }

      // Επιστρέφουμε το πρόγραμμα με τις ημερομηνίες
      return {
        ...savedProgram,
        training_dates: trainingDatesArray
      };
    } catch (error) {
      console.error('❌ [useProgramSave] Error saving program:', error);
      toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteExistingStructure = async (programId: string) => {
    try {
      console.log('🗑️ [useProgramSave] Deleting existing program structure for:', programId);

      // Διαγραφή με τη σωστή σειρά και σωστό τρόπο
      
      // 1. Βρίσκουμε όλα τα weeks του προγράμματος
      const { data: weeks } = await supabase
        .from('program_weeks')
        .select('id')
        .eq('program_id', programId);

      if (weeks && weeks.length > 0) {
        const weekIds = weeks.map(w => w.id);
        console.log('🗑️ [useProgramSave] Found weeks to delete:', weekIds);

        // 2. Βρίσκουμε όλες τις days των weeks
        const { data: days } = await supabase
          .from('program_days')
          .select('id')
          .in('week_id', weekIds);

        if (days && days.length > 0) {
          const dayIds = days.map(d => d.id);
          console.log('🗑️ [useProgramSave] Found days to delete:', dayIds);

          // 3. Βρίσκουμε όλα τα blocks των days
          const { data: blocks } = await supabase
            .from('program_blocks')
            .select('id')
            .in('day_id', dayIds);

          if (blocks && blocks.length > 0) {
            const blockIds = blocks.map(b => b.id);
            console.log('🗑️ [useProgramSave] Found blocks to delete:', blockIds);

            // 4. Διαγράφουμε exercises πρώτα
            const { error: exercisesError } = await supabase
              .from('program_exercises')
              .delete()
              .in('block_id', blockIds);
            
            if (exercisesError) {
              console.error('❌ [useProgramSave] Error deleting exercises:', exercisesError);
            } else {
              console.log('✅ [useProgramSave] Exercises deleted successfully');
            }
          }

          // 5. Διαγράφουμε blocks
          const { error: blocksError } = await supabase
            .from('program_blocks')
            .delete()
            .in('day_id', dayIds);
          
          if (blocksError) {
            console.error('❌ [useProgramSave] Error deleting blocks:', blocksError);
          } else {
            console.log('✅ [useProgramSave] Blocks deleted successfully');
          }
        }

        // 6. Διαγράφουμε days
        const { error: daysError } = await supabase
          .from('program_days')
          .delete()
          .in('week_id', weekIds);
        
        if (daysError) {
          console.error('❌ [useProgramSave] Error deleting days:', daysError);
        } else {
          console.log('✅ [useProgramSave] Days deleted successfully');
        }
      }

      // 7. Διαγράφουμε weeks
      const { error: weeksError } = await supabase
        .from('program_weeks')
        .delete()
        .eq('program_id', programId);
      
      if (weeksError) {
        console.error('❌ [useProgramSave] Error deleting weeks:', weeksError);
      } else {
        console.log('✅ [useProgramSave] Weeks deleted successfully');
      }

      console.log('✅ [useProgramSave] Existing structure deleted');
    } catch (error) {
      console.error('❌ [useProgramSave] Error deleting existing structure:', error);
      // Δεν πετάμε error εδώ για να μη σταματήσει η διαδικασία
    }
  };

  return {
    loading,
    saveProgram
  };
};
