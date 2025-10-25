import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Exercise {
  id: string;
  name: string;
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
  const [selectedRelatedExerciseId, setSelectedRelatedExerciseId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch all exercises
  const { data: exercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data as Exercise[];
    }
  });

  // Fetch mobility exercises (διατάσεις)
  const { data: mobilityExercises } = useQuery({
    queryKey: ['mobility-exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select(`
          id,
          name,
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

  // Create relationship
  const createRelationshipMutation = useMutation({
    mutationFn: async () => {
      if (!selectedExerciseId || !selectedRelatedExerciseId) {
        throw new Error('Επιλέξτε άσκηση και διάταση');
      }

      if (selectedExerciseId === selectedRelatedExerciseId) {
        throw new Error('Δεν μπορείτε να συνδέσετε μια άσκηση με τον εαυτό της');
      }

      const { data, error } = await supabase
        .from('exercise_relationships')
        .insert([{
          exercise_id: selectedExerciseId,
          related_exercise_id: selectedRelatedExerciseId,
          relationship_type: 'mobility',
          order_index: 0
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-relationships'] });
      toast.success('Η σύνδεση δημιουργήθηκε επιτυχώς');
      setSelectedExerciseId('');
      setSelectedRelatedExerciseId('');
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
          <CardTitle>Νέα Σύνδεση Άσκησης με Διάταση</CardTitle>
          <p className="text-sm text-gray-500 mt-2">
            Οι διατάσεις είναι όλες οι ασκήσεις που έχουν την κατηγορία "mobility"
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Άσκηση</label>
              <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε άσκηση" />
                </SelectTrigger>
                <SelectContent>
                  {exercises?.map((exercise) => (
                    <SelectItem key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Διάταση (Mobility)</label>
              <Select value={selectedRelatedExerciseId} onValueChange={setSelectedRelatedExerciseId}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε διάταση" />
                </SelectTrigger>
                <SelectContent>
                  {mobilityExercises?.map((exercise) => (
                    <SelectItem key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => createRelationshipMutation.mutate()}
                className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black w-full"
                disabled={!selectedExerciseId || !selectedRelatedExerciseId}
              >
                <Plus className="h-4 w-4 mr-2" />
                Προσθήκη Σύνδεσης
              </Button>
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
          placeholder="Αναζήτηση ασκήσεων ή διατάσεων..."
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
                    <span className="text-sm">{rel.related_exercise.name}</span>
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
    </div>
  );
};