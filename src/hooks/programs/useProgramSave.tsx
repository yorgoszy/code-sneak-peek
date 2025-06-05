
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

        // Διαγραφή υπάρχουσας δομής πριν την αναδημιουργία
        await deleteExistingStructure(programData.id);
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

      // Δημιουργία δομής προγράμματος (weeks, days, blocks, exercises)
      if (programData.weeks && programData.weeks.length > 0) {
        console.log('🏗️ Creating program structure...');
        await createProgramStructure(savedProgram.id, programData);
        console.log('✅ Program structure created');
      }

      return savedProgram;
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

      // Διαγραφή με τη σωστή σειρά (από το πιο εσωτερικό προς το εξωτερικό)
      
      // 1. Διαγραφή exercises
      const { data: blocks } = await supabase
        .from('program_blocks')
        .select('id')
        .in('day_id', 
          supabase
            .from('program_days')
            .select('id')
            .in('week_id',
              supabase
                .from('program_weeks')
                .select('id')
                .eq('program_id', programId)
            )
        );

      if (blocks && blocks.length > 0) {
        const blockIds = blocks.map(b => b.id);
        await supabase
          .from('program_exercises')
          .delete()
          .in('block_id', blockIds);
      }

      // 2. Διαγραφή blocks
      const { data: days } = await supabase
        .from('program_days')
        .select('id')
        .in('week_id',
          supabase
            .from('program_weeks')
            .select('id')
            .eq('program_id', programId)
        );

      if (days && days.length > 0) {
        const dayIds = days.map(d => d.id);
        await supabase
          .from('program_blocks')
          .delete()
          .in('day_id', dayIds);
      }

      // 3. Διαγραφή days
      const { data: weeks } = await supabase
        .from('program_weeks')
        .select('id')
        .eq('program_id', programId);

      if (weeks && weeks.length > 0) {
        const weekIds = weeks.map(w => w.id);
        await supabase
          .from('program_days')
          .delete()
          .in('week_id', weekIds);
      }

      // 4. Διαγραφή weeks
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
