
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

      // 🔍 ΑΝΑΛΥΣΗ ΑΣΚΗΣΕΩΝ ΠΡΙΝ ΤΗΝ ΑΠΟΘΗΚΕΥΣΗ
      // ΚΡΙΤΙΚΟ: Χρησιμοποιούμε program_weeks αν υπάρχει και έχει δεδομένα, αλλιώς weeks
      // Αυτό είναι σημαντικό γιατί τα δεδομένα από τη βάση έρχονται ως program_weeks
      let weeks: any[] = [];
      
      // Πρώτη προτεραιότητα: weeks αν έχει δεδομένα
      if (programData.weeks && Array.isArray(programData.weeks) && programData.weeks.length > 0) {
        weeks = programData.weeks;
        console.log('🔍 [SAVE] Using weeks source: weeks array');
      } 
      // Δεύτερη προτεραιότητα: program_weeks αν έχει δεδομένα
      else if (programData.program_weeks && Array.isArray(programData.program_weeks) && programData.program_weeks.length > 0) {
        weeks = programData.program_weeks;
        console.log('🔍 [SAVE] Using weeks source: program_weeks array');
      }
      // Αν δεν υπάρχουν weeks, σημαίνει ότι το πρόγραμμα δεν έχει δομή - ΔΕΝ ΑΠΟΘΗΚΕΥΟΥΜΕ
      else {
        console.warn('⚠️ [SAVE] No weeks data found - this will only update program metadata, NOT structure');
      }
      
      console.log('🔍 [SAVE] Weeks count:', weeks.length);
      console.log('🔍 [SAVE ANALYSIS] Program structure before save:');
      weeks.forEach((week, weekIndex) => {
        console.log(`🔍 [SAVE] Week ${weekIndex + 1}: ${week.name}`);
        week.program_days?.forEach((day, dayIndex) => {
          console.log(`🔍 [SAVE] Day ${dayIndex + 1}: ${day.name}`);
          day.program_blocks?.forEach((block, blockIndex) => {
            console.log(`🔍 [SAVE] Block ${blockIndex + 1}: ${block.name} - ${block.program_exercises?.length || 0} exercises`);
            block.program_exercises?.forEach((ex, exIndex) => {
              console.log(`🔍 [SAVE] Exercise ${exIndex + 1}: ${ex.exercises?.name} (order: ${ex.exercise_order})`);
              console.log(`🔍 [SAVE] Exercise details:`, {
                id: ex.id,
                exercise_id: ex.exercise_id,
                exercise_order: ex.exercise_order,
                created_at: ex.exercises?.created_at,
                updated_at: ex.exercises?.updated_at
              });
            });
          });
        });
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
      const programPayload: any = {
        name: programData.name,
        description: programData.description || '',
        user_id: programData.user_id || null,
        is_template: programData.is_template || false,
        status: programData.status || 'draft',
        type: programData.type || 'strength',
        duration: weeks?.length || null,
        training_days: weeks?.[0]?.program_days?.length || null
      };
      
      // Προσθήκη created_by αν υπάρχει (για coach programs)
      if (programData.created_by) {
        programPayload.created_by = programData.created_by;
      }

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

          // ΚΡΙΤΙΚΟ: Διαγράφουμε την υπάρχουσα δομή ΜΟΝΟ αν έχουμε νέα weeks για αποθήκευση
          // Αυτό αποτρέπει τη διαγραφή της δομής αν η αποθήκευση είναι μόνο για metadata
          if (weeks && weeks.length > 0) {
            console.log('🔄 Deleting existing structure before recreation (have', weeks.length, 'weeks to save)...');
            await deleteExistingStructure(programData.id);
          } else {
            console.log('⚠️ No weeks to save - keeping existing structure intact');
          }
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
      if (weeks && weeks.length > 0) {
        console.log('🏗️ [useProgramSave] Creating program structure with weeks:', weeks.length);
        
        // 🚨 ΚΡΙΤΙΚΟΣ ΕΛΕΓΧΟΣ: Εμφάνιση της δομής που περνάμε στο createProgramStructure
        console.log('🚨 [CRITICAL] Data being passed to createProgramStructure:');
        weeks.forEach((week, wIndex) => {
          console.log(`🚨  Week ${wIndex}: ${week.name}`);
          week.program_days?.forEach((day, dIndex) => {
            console.log(`🚨    Day ${dIndex}: ${day.name}`);
            day.program_blocks?.forEach((block, bIndex) => {
              console.log(`🚨      Block ${bIndex}: ${block.name}`);
              const sortedExercises = [...(block.program_exercises || [])].sort((a, b) => {
                const orderA = a.exercise_order || 0;
                const orderB = b.exercise_order || 0;
                return orderA - orderB;
              });
              console.log(`🚨      Exercises in order before passing:`);
              sortedExercises.forEach((ex, eIndex) => {
                console.log(`🚨        ${eIndex + 1}. ${ex.exercises?.name} (order: ${ex.exercise_order})`);
              });
            });
          });
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
