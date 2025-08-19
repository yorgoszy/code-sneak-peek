import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SharedExerciseNote {
  id: string;
  assignment_id: string;
  exercise_id: string;
  day_number: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export const useSharedExerciseNotes = (assignmentId?: string) => {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Helper function to create a unique key for exercise notes
  const createNoteKey = useCallback((exerciseId: string, dayNumber: number) => {
    return `${exerciseId}_${dayNumber}`;
  }, []);

  // Load all notes for the assignment
  const loadNotes = useCallback(async () => {
    if (!assignmentId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercise_notes')
        .select('*')
        .eq('assignment_id', assignmentId);

      if (error) {
        console.error('❌ Error loading exercise notes:', error);
        return;
      }

      const notesMap: Record<string, string> = {};
      data?.forEach((note: SharedExerciseNote) => {
        const key = createNoteKey(note.exercise_id, note.day_number);
        notesMap[key] = note.notes || '';
      });

      setNotes(notesMap);
      console.log('📚 Loaded shared exercise notes:', notesMap);
    } catch (error) {
      console.error('❌ Error loading exercise notes:', error);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, createNoteKey]);

  // Load notes when assignment changes
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Get notes for a specific exercise and day
  const getNotes = useCallback((exerciseId: string, dayNumber: number) => {
    const key = createNoteKey(exerciseId, dayNumber);
    return notes[key] || '';
  }, [notes, createNoteKey]);

  // Update notes for a specific exercise and day
  const updateNotes = useCallback(async (exerciseId: string, dayNumber: number, newNotes: string) => {
    if (!assignmentId) {
      console.error('❌ No assignment ID provided for updateNotes');
      return;
    }

    const key = createNoteKey(exerciseId, dayNumber);
    
    // Update local state immediately
    setNotes(prev => ({
      ...prev,
      [key]: newNotes
    }));

    try {
      // Update or insert in database
      const { error } = await supabase
        .from('exercise_notes')
        .upsert({
          assignment_id: assignmentId,
          exercise_id: exerciseId,
          day_number: dayNumber,
          notes: newNotes
        }, {
          onConflict: 'assignment_id,exercise_id,day_number'
        });

      if (error) {
        console.error('❌ Error updating exercise notes:', error);
        // Revert local state on error
        setNotes(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
        return;
      }

      console.log(`📝 Updated shared notes for exercise ${exerciseId} day ${dayNumber}:`, newNotes);
    } catch (error) {
      console.error('❌ Error updating exercise notes:', error);
      // Revert local state on error
      setNotes(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
  }, [assignmentId, createNoteKey]);

  // Clear notes for a specific exercise and day
  const clearNotes = useCallback(async (exerciseId: string, dayNumber: number) => {
    if (!assignmentId) {
      console.error('❌ No assignment ID provided for clearNotes');
      return;
    }

    const key = createNoteKey(exerciseId, dayNumber);
    
    // Update local state immediately
    setNotes(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });

    try {
      // Delete from database
      const { error } = await supabase
        .from('exercise_notes')
        .delete()
        .eq('assignment_id', assignmentId)
        .eq('exercise_id', exerciseId)
        .eq('day_number', dayNumber);

      if (error) {
        console.error('❌ Error clearing exercise notes:', error);
        return;
      }

      console.log(`🗑️ Cleared shared notes for exercise ${exerciseId} day ${dayNumber}`);
    } catch (error) {
      console.error('❌ Error clearing exercise notes:', error);
    }
  }, [assignmentId, createNoteKey]);

  return {
    getNotes,
    updateNotes,
    clearNotes,
    loading,
    refreshNotes: loadNotes
  };
};