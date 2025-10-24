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

interface Stretch {
  id: string;
  name: string;
}

interface ExerciseStretch {
  id: string;
  exercise_id: string;
  stretch_id: string;
  order_index: number;
  exercises: { name: string };
  stretches: { name: string };
}

export const ExerciseStretchLinks: React.FC = () => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [selectedStretchId, setSelectedStretchId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch exercises
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

  // Fetch stretches
  const { data: stretches } = useQuery({
    queryKey: ['stretches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stretches')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data as Stretch[];
    }
  });

  // Fetch exercise-stretch links
  const { data: links, isLoading } = useQuery({
    queryKey: ['exercise-stretches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_stretches')
        .select(`
          *,
          exercises (name),
          stretches (name)
        `)
        .order('exercise_id');
      
      if (error) throw error;
      return data as ExerciseStretch[];
    }
  });

  // Create link
  const createLinkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedExerciseId || !selectedStretchId) {
        throw new Error('Επιλέξτε άσκηση και διάταση');
      }

      const { data, error } = await supabase
        .from('exercise_stretches')
        .insert([{
          exercise_id: selectedExerciseId,
          stretch_id: selectedStretchId,
          order_index: 0
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-stretches'] });
      toast.success('Η σύνδεση δημιουργήθηκε επιτυχώς');
      setSelectedExerciseId('');
      setSelectedStretchId('');
    },
    onError: (error: any) => {
      if (error.message.includes('duplicate')) {
        toast.error('Η σύνδεση υπάρχει ήδη');
      } else {
        toast.error('Σφάλμα κατά τη δημιουργία της σύνδεσης');
      }
    }
  });

  // Delete link
  const deleteLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exercise_stretches')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-stretches'] });
      toast.success('Η σύνδεση διαγράφηκε επιτυχώς');
    },
    onError: () => {
      toast.error('Σφάλμα κατά τη διαγραφή της σύνδεσης');
    }
  });

  // Filter links by search term
  const filteredLinks = links?.filter(link => 
    link.exercises.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.stretches.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group links by exercise
  const groupedLinks = filteredLinks?.reduce((acc, link) => {
    const exerciseId = link.exercise_id;
    if (!acc[exerciseId]) {
      acc[exerciseId] = {
        exerciseName: link.exercises.name,
        stretches: []
      };
    }
    acc[exerciseId].stretches.push(link);
    return acc;
  }, {} as Record<string, { exerciseName: string; stretches: ExerciseStretch[] }>);

  if (isLoading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add Link Form */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Νέα Σύνδεση Άσκησης με Διάταση</CardTitle>
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
              <label className="text-sm font-medium mb-2 block">Διάταση</label>
              <Select value={selectedStretchId} onValueChange={setSelectedStretchId}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε διάταση" />
                </SelectTrigger>
                <SelectContent>
                  {stretches?.map((stretch) => (
                    <SelectItem key={stretch.id} value={stretch.id}>
                      {stretch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => createLinkMutation.mutate()}
                className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black w-full"
                disabled={!selectedExerciseId || !selectedStretchId}
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

      {/* Links by Exercise */}
      <div className="space-y-4">
        {Object.entries(groupedLinks || {}).map(([exerciseId, { exerciseName, stretches }]) => (
          <Card key={exerciseId} className="rounded-none">
            <CardHeader>
              <CardTitle className="text-lg">{exerciseName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stretches.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-none"
                  >
                    <span className="text-sm">{link.stretches.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteLinkMutation.mutate(link.id)}
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

      {(!groupedLinks || Object.keys(groupedLinks).length === 0) && (
        <div className="text-center py-12 text-gray-500">
          Δεν υπάρχουν συνδέσεις. Δημιουργήστε την πρώτη σας σύνδεση!
        </div>
      )}
    </div>
  );
};
