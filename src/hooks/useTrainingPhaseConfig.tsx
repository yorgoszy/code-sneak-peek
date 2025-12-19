import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TrainingPhase {
  id: string;
  phase_key: string;
  phase_name: string;
  phase_type: string;
  parent_phase_key: string | null;
  rep_range_min: number | null;
  rep_range_max: number | null;
  intensity_range_min: number | null;
  intensity_range_max: number | null;
  rest_range_min: number | null;
  rest_range_max: number | null;
  tempo_recommendation: string | null;
  description: string | null;
}

export interface PhaseRepScheme {
  id: string;
  phase_id: string;
  scheme_name: string;
  sets: number;
  reps: string;
  tempo: string | null;
  rest: string | null;
  intensity_percent: number | null;
  is_primary: boolean;
  notes: string | null;
}

export interface PhaseExercise {
  id: string;
  phase_id: string;
  exercise_id: string;
  priority: number;
  notes: string | null;
  exercises?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface PhaseExerciseCategory {
  id: string;
  phase_id: string;
  category_id: string;
  priority: number;
  exercise_categories?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface CorrectiveIssueExercise {
  id: string;
  issue_name: string;
  issue_category: string;
  exercise_id: string;
  exercise_type: string;
  priority: number;
  notes: string | null;
  exercises?: {
    id: string;
    name: string;
  };
}

export interface CorrectiveMuscleExercise {
  id: string;
  muscle_id: string;
  action_type: string;
  exercise_id: string;
  priority: number;
  notes: string | null;
  exercises?: {
    id: string;
    name: string;
  };
  muscles?: {
    id: string;
    name: string;
  };
}

export const useTrainingPhaseConfig = () => {
  const [phases, setPhases] = useState<TrainingPhase[]>([]);
  const [repSchemes, setRepSchemes] = useState<PhaseRepScheme[]>([]);
  const [phaseExercises, setPhaseExercises] = useState<PhaseExercise[]>([]);
  const [phaseCategories, setPhaseCategories] = useState<PhaseExerciseCategory[]>([]);
  const [correctiveIssues, setCorrectiveIssues] = useState<CorrectiveIssueExercise[]>([]);
  const [correctiveMuscles, setCorrectiveMuscles] = useState<CorrectiveMuscleExercise[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPhases = async () => {
    try {
      const { data, error } = await supabase
        .from('training_phase_config')
        .select('*')
        .order('phase_type', { ascending: true })
        .order('phase_name', { ascending: true });

      if (error) throw error;
      setPhases(data || []);
    } catch (error) {
      console.error('Error fetching phases:', error);
      toast.error('Σφάλμα φόρτωσης φάσεων');
    }
  };

  const fetchRepSchemes = async () => {
    try {
      const { data, error } = await supabase
        .from('phase_rep_schemes')
        .select('*')
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setRepSchemes(data || []);
    } catch (error) {
      console.error('Error fetching rep schemes:', error);
    }
  };

  const fetchPhaseExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('phase_exercises')
        .select(`
          *,
          exercises:exercise_id (id, name, description)
        `)
        .order('priority', { ascending: true });

      if (error) throw error;
      setPhaseExercises(data || []);
    } catch (error) {
      console.error('Error fetching phase exercises:', error);
    }
  };

  const fetchPhaseCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('phase_exercise_categories')
        .select(`
          *,
          exercise_categories:category_id (id, name, type)
        `)
        .order('priority', { ascending: true });

      if (error) throw error;
      setPhaseCategories(data || []);
    } catch (error) {
      console.error('Error fetching phase categories:', error);
    }
  };

  const fetchCorrectiveIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('corrective_issue_exercises')
        .select(`
          *,
          exercises:exercise_id (id, name)
        `)
        .order('issue_category', { ascending: true })
        .order('priority', { ascending: true });

      if (error) throw error;
      setCorrectiveIssues(data || []);
    } catch (error) {
      console.error('Error fetching corrective issues:', error);
    }
  };

  const fetchCorrectiveMuscles = async () => {
    try {
      const { data, error } = await supabase
        .from('corrective_muscle_exercises')
        .select(`
          *,
          exercises:exercise_id (id, name),
          muscles:muscle_id (id, name)
        `)
        .order('action_type', { ascending: true })
        .order('priority', { ascending: true });

      if (error) throw error;
      setCorrectiveMuscles(data || []);
    } catch (error) {
      console.error('Error fetching corrective muscles:', error);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchPhases(),
      fetchRepSchemes(),
      fetchPhaseExercises(),
      fetchPhaseCategories(),
      fetchCorrectiveIssues(),
      fetchCorrectiveMuscles(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // CRUD operations for rep schemes
  const addRepScheme = async (scheme: Omit<PhaseRepScheme, 'id'>) => {
    try {
      const { error } = await supabase
        .from('phase_rep_schemes')
        .insert(scheme);

      if (error) throw error;
      toast.success('Το scheme προστέθηκε');
      await fetchRepSchemes();
    } catch (error) {
      console.error('Error adding rep scheme:', error);
      toast.error('Σφάλμα προσθήκης scheme');
    }
  };

  const deleteRepScheme = async (id: string) => {
    try {
      const { error } = await supabase
        .from('phase_rep_schemes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Το scheme διαγράφηκε');
      await fetchRepSchemes();
    } catch (error) {
      console.error('Error deleting rep scheme:', error);
      toast.error('Σφάλμα διαγραφής scheme');
    }
  };

  // CRUD for phase exercises
  const addPhaseExercise = async (phaseId: string, exerciseId: string, priority: number = 1) => {
    try {
      const { error } = await supabase
        .from('phase_exercises')
        .insert({ phase_id: phaseId, exercise_id: exerciseId, priority });

      if (error) throw error;
      toast.success('Η άσκηση προστέθηκε');
      await fetchPhaseExercises();
    } catch (error) {
      console.error('Error adding phase exercise:', error);
      toast.error('Σφάλμα προσθήκης άσκησης');
    }
  };

  const removePhaseExercise = async (id: string) => {
    try {
      const { error } = await supabase
        .from('phase_exercises')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Η άσκηση αφαιρέθηκε');
      await fetchPhaseExercises();
    } catch (error) {
      console.error('Error removing phase exercise:', error);
      toast.error('Σφάλμα αφαίρεσης άσκησης');
    }
  };

  // CRUD for corrective issues
  const addCorrectiveIssue = async (data: Omit<CorrectiveIssueExercise, 'id' | 'exercises'>) => {
    try {
      const { error } = await supabase
        .from('corrective_issue_exercises')
        .insert(data);

      if (error) throw error;
      toast.success('Η διορθωτική άσκηση προστέθηκε');
      await fetchCorrectiveIssues();
    } catch (error) {
      console.error('Error adding corrective issue:', error);
      toast.error('Σφάλμα προσθήκης');
    }
  };

  const removeCorrectiveIssue = async (id: string) => {
    try {
      const { error } = await supabase
        .from('corrective_issue_exercises')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Η διορθωτική άσκηση αφαιρέθηκε');
      await fetchCorrectiveIssues();
    } catch (error) {
      console.error('Error removing corrective issue:', error);
      toast.error('Σφάλμα αφαίρεσης');
    }
  };

  // CRUD for corrective muscles
  const addCorrectiveMuscle = async (data: Omit<CorrectiveMuscleExercise, 'id' | 'exercises' | 'muscles'>) => {
    try {
      const { error } = await supabase
        .from('corrective_muscle_exercises')
        .insert(data);

      if (error) throw error;
      toast.success('Η άσκηση μυός προστέθηκε');
      await fetchCorrectiveMuscles();
    } catch (error) {
      console.error('Error adding corrective muscle:', error);
      toast.error('Σφάλμα προσθήκης');
    }
  };

  const removeCorrectiveMuscle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('corrective_muscle_exercises')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Η άσκηση μυός αφαιρέθηκε');
      await fetchCorrectiveMuscles();
    } catch (error) {
      console.error('Error removing corrective muscle:', error);
      toast.error('Σφάλμα αφαίρεσης');
    }
  };

  // Get phase config for AI
  const getPhaseConfigForAI = (phaseKey: string) => {
    const phase = phases.find(p => p.phase_key === phaseKey);
    if (!phase) return null;

    const schemes = repSchemes.filter(s => s.phase_id === phase.id);
    const exercises = phaseExercises.filter(e => e.phase_id === phase.id);
    const categories = phaseCategories.filter(c => c.phase_id === phase.id);

    return {
      phase,
      repSchemes: schemes,
      exercises,
      categories,
    };
  };

  return {
    phases,
    repSchemes,
    phaseExercises,
    phaseCategories,
    correctiveIssues,
    correctiveMuscles,
    loading,
    refreshAll,
    addRepScheme,
    deleteRepScheme,
    addPhaseExercise,
    removePhaseExercise,
    addCorrectiveIssue,
    removeCorrectiveIssue,
    addCorrectiveMuscle,
    removeCorrectiveMuscle,
    getPhaseConfigForAI,
  };
};
