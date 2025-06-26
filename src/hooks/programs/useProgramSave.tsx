
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
        hasWeeks: (programData.weeks || programData.program_weeks)?.length || 0,
        weeksSource: programData.weeks ? 'weeks' : programData.program_weeks ? 'program_weeks' : 'none'
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
      } else {
        // Προσπαθούμε να δημιουργήσουμε dates από τη δομή εβδομάδων
        const weeks = programData.weeks || programData.program_weeks || [];
        if (weeks.length > 0) {
          const totalDays = weeks.reduce((total, week) => total + (week.program_days?.length || 0), 0);
          const today = new Date();
          trainingDatesArray = [];
          for (let i = 0; i < totalDays; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            trainingDatesArray.push(date.toISOString().split('T')[0]);
          }
          console.log('📅 Auto-generated training dates:', trainingDatesArray);
        }
      }

      // Βασικά δεδομένα προγράμματος
      const programPayload = {
        name: programData.name,
        description: programData.description || '',
        user_id: programData.user_id || null,
        status: programData.status || 'draft',
        type: programData.type || 'strength',
        duration: (programData.weeks || programData.program_weeks)?.length || null,
        training_days: (programData.weeks || programData.program_weeks)?.[0]?.program_days?.length || null
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

          // ΚΡΙΤΙΚΗ ΔΙΟΡΘΩΣΗ: Πάντα διαγράφουμε την υπάρχουσα δομή για να αποφύγουμε παλιά δεδομένα
          console.log('🗑️ [useProgramSave] Force deleting existing structure for program update');
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
      const weeks = programData.weeks || programData.program_weeks || [];
      if (weeks && weeks.length > 0) {
        console.log('🏗️ [useProgramSave] Creating program structure with weeks:', weeks.length);
        
        // Βεβαιωνόμαστε ότι τα δεδομένα είναι σωστά πριν περάσουν στο createProgramStructure
        console.log('🏗️ [useProgramSave] Structure data being passed:', {
          weeks: weeks.map(w => ({
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
          weeks: weeks
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
      console.log('🗑️ [useProgramSave] Starting comprehensive deletion of existing program structure for:', programId);

      // Βρίσκουμε τα IDs με σταδιακό τρόπο για να αποφύγουμε subquery errors
      
      // ΒΗΜΑ 1: Βρίσκουμε week IDs
      const { data: weeks } = await supabase
        .from('program_weeks')
        .select('id')
        .eq('program_id', programId);

      if (weeks && weeks.length > 0) {
        const weekIds = weeks.map(w => w.id);
        console.log('🗑️ [useProgramSave] Found week IDs:', weekIds);

        // ΒΗΜΑ 2: Βρίσκουμε day IDs
        const { data: days } = await supabase
          .from('program_days')
          .select('id')
          .in('week_id', weekIds);

        if (days && days.length > 0) {
          const dayIds = days.map(d => d.id);
          console.log('🗑️ [useProgramSave] Found day IDs:', dayIds);

          // ΒΗΜΑ 3: Βρίσκουμε block IDs
          const { data: blocks } = await supabase
            .from('program_blocks')
            .select('id')
            .in('day_id', dayIds);

          if (blocks && blocks.length > 0) {
            const blockIds = blocks.map(b => b.id);
            console.log('🗑️ [useProgramSave] Found block IDs:', blockIds);

            // ΒΗΜΑ 4: Διαγράφουμε exercises
            await supabase
              .from('program_exercises')
              .delete()
              .in('block_id', blockIds);
            
            console.log('✅ [useProgramSave] Program exercises deleted');
          }

          // ΒΗΜΑ 5: Διαγράφουμε blocks
          await supabase
            .from('program_blocks')
            .delete()
            .in('day_id', dayIds);
          
          console.log('✅ [useProgramSave] Program blocks deleted');
        }

        // ΒΗΜΑ 6: Διαγράφουμε days
        await supabase
          .from('program_days')
          .delete()
          .in('week_id', weekIds);
        
        console.log('✅ [useProgramSave] Program days deleted');

        // ΒΗΜΑ 7: Διαγράφουμε weeks
        await supabase
          .from('program_weeks')
          .delete()
          .in('id', weekIds);
        
        console.log('✅ [useProgramSave] Program weeks deleted');
      }

      console.log('✅ [useProgramSave] Complete structure deletion finished successfully');
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
