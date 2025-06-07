
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
      console.log('💾 Saving program:', programData);

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
        const totalDays = programData.weeks.reduce((total, week) => {
          const daysCount = week.days?.length || 0;
          return total + daysCount;
        }, 0);
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
        training_days: programData.weeks?.[0]?.days?.length || null
      };

      let savedProgram;

      if (programData.id) {
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

        // Διαγραφή υπάρχουσας δομής πριν την αναδημιουργία ΜΟΝΟ αν υπάρχουν αλλαγές στη δομή
        if (programData.weeks && programData.weeks.length > 0) {
          await deleteExistingStructure(programData.id);
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

      console.log('✅ Program saved:', savedProgram);

      // Δημιουργία δομής προγράμματος (weeks, days, blocks, exercises) ΜΟΝΟ αν υπάρχουν weeks
      if (programData.weeks && programData.weeks.length > 0) {
        console.log('🏗️ Creating program structure...');
        await createProgramStructure(savedProgram.id, programData);
        console.log('✅ Program structure created');
      }

      // Επιστρέφουμε το πρόγραμμα με τη σωστή δομή και διατήρηση των weeks
      const result = {
        ...savedProgram,
        training_dates: trainingDatesArray,
        weeks: programData.weeks || []
      };

      console.log('📤 Returning program result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error saving program:', error);
      toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteExistingStructure = async (programId: string) => {
    try {
      console.log('🗑️ Deleting existing program structure for:', programId);

      // Διαγραφή με τη σωστή σειρά και σωστό τρόπο
      
      // 1. Βρίσκουμε όλα τα weeks του προγράμματος
      const { data: weeks } = await supabase
        .from('program_weeks')
        .select('id')
        .eq('program_id', programId);

      if (weeks && weeks.length > 0) {
        const weekIds = weeks.map(w => w.id);

        // 2. Βρίσκουμε όλες τις days των weeks
        const { data: days } = await supabase
          .from('program_days')
          .select('id')
          .in('week_id', weekIds);

        if (days && days.length > 0) {
          const dayIds = days.map(d => d.id);

          // 3. Βρίσκουμε όλα τα blocks των days
          const { data: blocks } = await supabase
            .from('program_blocks')
            .select('id')
            .in('day_id', dayIds);

          if (blocks && blocks.length > 0) {
            const blockIds = blocks.map(b => b.id);

            // 4. Διαγράφουμε exercises πρώτα
            await supabase
              .from('program_exercises')
              .delete()
              .in('block_id', blockIds);
          }

          // 5. Διαγράφουμε blocks
          await supabase
            .from('program_blocks')
            .delete()
            .in('day_id', dayIds);
        }

        // 6. Διαγράφουμε days
        await supabase
          .from('program_days')
          .delete()
          .in('week_id', weekIds);
      }

      // 7. Διαγράφουμε weeks
      await supabase
        .from('program_weeks')
        .delete()
        .eq('program_id', programId);

      console.log('✅ Existing structure deleted');
    } catch (error) {
      console.error('❌ Error deleting existing structure:', error);
      // Δεν πετάμε error εδώ για να μη σταματήσει η διαδικασία
    }
  };

  return {
    loading,
    saveProgram
  };
};
