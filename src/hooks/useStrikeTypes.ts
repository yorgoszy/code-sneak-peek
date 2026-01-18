import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StrikeType {
  id: string;
  coach_id: string;
  name: string;
  category: 'punch' | 'kick' | 'knee' | 'elbow' | 'combo' | 'combo_kick_finish';
  side: 'left' | 'right' | 'both' | null;
  description: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStrikeType {
  name: string;
  category: 'punch' | 'kick' | 'knee' | 'elbow' | 'combo' | 'combo_kick_finish';
  side?: 'left' | 'right' | 'both' | null;
  description?: string;
}

export const useStrikeTypes = (coachId: string | null) => {
  const [strikeTypes, setStrikeTypes] = useState<StrikeType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStrikeTypes = async () => {
    if (!coachId) {
      setStrikeTypes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('strike_types')
        .select('*')
        .eq('coach_id', coachId)
        .eq('is_active', true)
        .order('category')
        .order('order_index');

      if (error) throw error;
      setStrikeTypes((data as StrikeType[]) || []);
    } catch (error) {
      console.error('Error fetching strike types:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των τύπων χτυπημάτων');
    } finally {
      setLoading(false);
    }
  };

  const createStrikeType = async (strikeType: CreateStrikeType) => {
    console.log('Creating strike type with coachId:', coachId, 'data:', strikeType);
    
    if (!coachId) {
      console.error('No coachId available');
      toast.error('Δεν βρέθηκε coach ID');
      return null;
    }

    try {
      const insertData = {
        coach_id: coachId,
        name: strikeType.name,
        category: strikeType.category,
        side: strikeType.side || null,
        description: strikeType.description || null,
      };
      console.log('Insert data:', insertData);
      
      const { data, error } = await supabase
        .from('strike_types')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Strike type created:', data);
      toast.success('Το χτύπημα δημιουργήθηκε');
      await fetchStrikeTypes();
      return data as StrikeType;
    } catch (error: any) {
      console.error('Error creating strike type:', error);
      toast.error(`Σφάλμα: ${error.message || 'Αποτυχία δημιουργίας'}`);
      return null;
    }
  };

  const updateStrikeType = async (id: string, updates: Partial<CreateStrikeType>) => {
    try {
      const { error } = await supabase
        .from('strike_types')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Το χτύπημα ενημερώθηκε');
      await fetchStrikeTypes();
    } catch (error) {
      console.error('Error updating strike type:', error);
      toast.error('Σφάλμα κατά την ενημέρωση');
    }
  };

  const deleteStrikeType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('strike_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Το χτύπημα διαγράφηκε');
      await fetchStrikeTypes();
    } catch (error) {
      console.error('Error deleting strike type:', error);
      toast.error('Σφάλμα κατά τη διαγραφή');
    }
  };

  useEffect(() => {
    fetchStrikeTypes();
  }, [coachId]);

  return {
    strikeTypes,
    loading,
    createStrikeType,
    updateStrikeType,
    deleteStrikeType,
    refetch: fetchStrikeTypes,
  };
};

export const categoryLabels: Record<string, string> = {
  punch: 'Γροθιά',
  kick: 'Κλωτσιά',
  knee: 'Γόνατο',
  elbow: 'Αγκώνας',
  combo: 'Κόμπο',
  combo_kick_finish: 'Κόμπο + Πόδι',
};

export const sideLabels: Record<string, string> = {
  left: 'Αριστερό',
  right: 'Δεξί',
  both: 'Και τα δύο',
};
