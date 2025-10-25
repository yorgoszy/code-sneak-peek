import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { ExerciseSearchDialog } from './ExerciseSearchDialog';

interface Exercise {
  id: string;
  name: string;
  video_url?: string | null;
}

interface ExerciseRelationship {
  id: string;
  exercise_id: string;
  related_exercise_id: string;
  relationship_type: string;
  order_index: number;
  exercise: { name: string };
  related_exercise: { name: string };
}

export const ExerciseRelationships: React.FC = () => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>('');
  const [selectedMobilityId, setSelectedMobilityId] = useState<string>('');
  const [selectedMobilityName, setSelectedMobilityName] = useState<string>('');
  const [selectedStabilityId, setSelectedStabilityId] = useState<string>('');
  const [selectedStabilityName, setSelectedStabilityName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [mobilityDialogOpen, setMobilityDialogOpen] = useState(false);
  const [stabilityDialogOpen, setStabilityDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch all exercises
  const { data: exercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, video_url')
        .order('name');
      
      if (error) throw error;
      return data as Exercise[];
    }
  });

  // Fetch mobility exercises
  const { data: mobilityExercises } = useQuery({
    queryKey: ['mobility-exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select(`
          id,
          name,
          video_url,
          exercise_to_category!inner(
            exercise_categories!inner(
              name
            )
          )
        `)
        .eq('exercise_to_category.exercise_categories.name', 'mobility')
        .order('name');
      
      if (error) throw error;
      return data as Exercise[];
    }
  });

  // Fetch stability exercises
  const { data: stabilityExercises } = useQuery({
    queryKey: ['stability-exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select(`
          id,
          name,
          video_url,
          exercise_to_category!inner(
            exercise_categories!inner(
              name
            )
          )
        `)
        .eq('exercise_to_category.exercise_categories.name', 'stability')
        .order('name');
      
      if (error) throw error;
      return data as Exercise[];
    }
  });

  // Fetch exercise relationships
  const { data: relationships, isLoading } = useQuery({
    queryKey: ['exercise-relationships'],
    queryFn: async () => {
      // First get the relationships
      const { data: rels, error: relsError } = await supabase
        .from('exercise_relationships')
        .select('*')
        .order('exercise_id');
      
      if (relsError) throw relsError;
      if (!rels || rels.length === 0) return [];
      
      // Get all unique exercise IDs
      const exerciseIds = [...new Set([
        ...rels.map(r => r.exercise_id),
        ...rels.map(r => r.related_exercise_id)
      ])];
      
      // Fetch exercise names
      const { data: exerciseNames, error: namesError } = await supabase
        .from('exercises')
        .select('id, name')
        .in('id', exerciseIds);
      
      if (namesError) throw namesError;
      
      // Create a map for quick lookup
      const exerciseMap = new Map(exerciseNames?.map(e => [e.id, e.name]) || []);
      
      // Combine the data
      return rels.map(rel => ({
        id: rel.id,
        exercise_id: rel.exercise_id,
        related_exercise_id: rel.related_exercise_id,
        relationship_type: rel.relationship_type,
        order_index: rel.order_index,
        exercise: { name: exerciseMap.get(rel.exercise_id) || 'Unknown' },
        related_exercise: { name: exerciseMap.get(rel.related_exercise_id) || 'Unknown' }
      })) as ExerciseRelationship[];
    }
  });

  // Create relationship mutation
  const createRelationshipMutation = useMutation({
    mutationFn: async (type: 'mobility' | 'stability') => {
      const relatedId = type === 'mobility' ? selectedMobilityId : selectedStabilityId;
      
      if (!selectedExerciseId || !relatedId) {
        throw new Error('Επιλέξτε άσκηση και ' + (type === 'mobility' ? 'mobility' : 'stability'));
      }

      if (selectedExerciseId === relatedId) {
        throw new Error('Δεν μπορείτε να συνδέσετε μια άσκηση με τον εαυτό της');
      }

      const { data, error } = await supabase
        .from('exercise_relationships')
        .insert([{
          exercise_id: selectedExerciseId,
          related_exercise_id: relatedId,
          relationship_type: type,
          order_index: 0
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, type) => {
      queryClient.invalidateQueries({ queryKey: ['exercise-relationships'] });
      toast.success('Η σύνδεση δημιουργήθηκε επιτυχώς');
      if (type === 'mobility') {
        setSelectedMobilityId('');
        setSelectedMobilityName('');
      } else {
        setSelectedStabilityId('');
        setSelectedStabilityName('');
      }
    },
    onError: (error: any) => {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        toast.error('Η σύνδεση υπάρχει ήδη');
      } else if (error.message.includes('εαυτό')) {
        toast.error(error.message);
      } else {
        toast.error('Σφάλμα κατά τη δημιουργία της σύνδεσης');
      }
    }
  });

  // Delete relationship
  const deleteRelationshipMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exercise_relationships')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-relationships'] });
      toast.success('Η σύνδεση διαγράφηκε επιτυχώς');
    },
    onError: () => {
      toast.error('Σφάλμα κατά τη διαγραφή της σύνδεσης');
    }
  });

  // Filter relationships by search term
  const filteredRelationships = relationships?.filter(rel => 
    rel.exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rel.related_exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group relationships by exercise
  const groupedRelationships = filteredRelationships?.reduce((acc, rel) => {
    const exerciseId = rel.exercise_id;
    if (!acc[exerciseId]) {
      acc[exerciseId] = {
        exerciseName: rel.exercise.name,
        relationships: []
      };
    }
    acc[exerciseId].relationships.push(rel);
    return acc;
  }, {} as Record<string, { exerciseName: string; relationships: ExerciseRelationship[] }>);

  if (isLoading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add Relationship Form */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Νέα Σύνδεση Άσκησης</CardTitle>
          <p className="text-sm text-gray-500 mt-2">
            Επιλέξτε άσκηση και συνδέστε την με mobility ή/και stability ασκήσεις
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Exercise Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Άσκηση</label>
            <div
              onClick={() => setExerciseDialogOpen(true)}
              className="flex items-center justify-between p-3 border border-gray-300 rounded-none cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <span className={selectedExerciseName ? 'text-sm' : 'text-sm text-gray-500'}>
                {selectedExerciseName || 'Επιλέξτε άσκηση'}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Mobility and Stability in same row */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Mobility */}
            <div className="space-y-2">
              <label className="text-sm font-medium mb-2 block">Mobility</label>
              <div className="flex gap-2">
                <div
                  onClick={() => setMobilityDialogOpen(true)}
                  className="flex-1 flex items-center justify-between p-3 border border-gray-300 rounded-none cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <span className={selectedMobilityName ? 'text-sm' : 'text-sm text-gray-500'}>
                    {selectedMobilityName || 'Επιλέξτε mobility'}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <Button
                  onClick={() => createRelationshipMutation.mutate('mobility')}
                  className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black shrink-0"
                  disabled={!selectedExerciseId || !selectedMobilityId}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stability */}
            <div className="space-y-2">
              <label className="text-sm font-medium mb-2 block">Stability</label>
              <div className="flex gap-2">
                <div
                  onClick={() => setStabilityDialogOpen(true)}
                  className="flex-1 flex items-center justify-between p-3 border border-gray-300 rounded-none cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <span className={selectedStabilityName ? 'text-sm' : 'text-sm text-gray-500'}>
                    {selectedStabilityName || 'Επιλέξτε stability'}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <Button
                  onClick={() => createRelationshipMutation.mutate('stability')}
                  className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black shrink-0"
                  disabled={!selectedExerciseId || !selectedStabilityId}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Αναζήτηση ασκήσεων..."
          className="pl-10 rounded-none"
        />
      </div>

      {/* Relationships by Exercise */}
      <div className="space-y-4">
        {Object.entries(groupedRelationships || {}).map(([exerciseId, { exerciseName, relationships }]) => (
          <Card key={exerciseId} className="rounded-none">
            <CardHeader>
              <CardTitle className="text-lg">{exerciseName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {relationships.map((rel) => (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 bg-gray-200 rounded-none font-medium">
                        {rel.relationship_type}
                      </span>
                      <span className="text-sm">{rel.related_exercise.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRelationshipMutation.mutate(rel.id)}
                      className="rounded-none text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!groupedRelationships || Object.keys(groupedRelationships).length === 0) && (
        <div className="text-center py-12 text-gray-500">
          Δεν υπάρχουν συνδέσεις. Δημιουργήστε την πρώτη σας σύνδεση!
        </div>
      )}

      {/* Search Dialogs */}
      <ExerciseSearchDialog
        isOpen={exerciseDialogOpen}
        onClose={() => setExerciseDialogOpen(false)}
        exercises={exercises}
        onSelect={(id, name) => {
          setSelectedExerciseId(id);
          setSelectedExerciseName(name);
        }}
        title="Επιλογή Άσκησης"
      />

      <ExerciseSearchDialog
        isOpen={mobilityDialogOpen}
        onClose={() => setMobilityDialogOpen(false)}
        exercises={mobilityExercises}
        onSelect={(id, name) => {
          setSelectedMobilityId(id);
          setSelectedMobilityName(name);
        }}
        title="Επιλογή Mobility Άσκησης"
      />

      <ExerciseSearchDialog
        isOpen={stabilityDialogOpen}
        onClose={() => setStabilityDialogOpen(false)}
        exercises={stabilityExercises}
        onSelect={(id, name) => {
          setSelectedStabilityId(id);
          setSelectedStabilityName(name);
        }}
        title="Επιλογή Stability Άσκησης"
      />
    </div>
  );
};