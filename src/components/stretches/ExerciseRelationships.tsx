import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { ExerciseSelectionDialog } from '@/components/programs/builder/ExerciseSelectionDialog';

interface Exercise {
  id: string;
  name: string;
  description?: string;
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

// Σειρά προτεραιότητας για εμφάνιση
const RELATIONSHIP_ORDER = ['mobility', 'stability', 'activation', 'neural act', 'recovery'];

export const ExerciseRelationships: React.FC = () => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>('');
  const [selectedMobilityId, setSelectedMobilityId] = useState<string>('');
  const [selectedMobilityName, setSelectedMobilityName] = useState<string>('');
  const [selectedStabilityId, setSelectedStabilityId] = useState<string>('');
  const [selectedStabilityName, setSelectedStabilityName] = useState<string>('');
  const [selectedActivationId, setSelectedActivationId] = useState<string>('');
  const [selectedActivationName, setSelectedActivationName] = useState<string>('');
  const [selectedNeuralActId, setSelectedNeuralActId] = useState<string>('');
  const [selectedNeuralActName, setSelectedNeuralActName] = useState<string>('');
  const [selectedRecoveryId, setSelectedRecoveryId] = useState<string>('');
  const [selectedRecoveryName, setSelectedRecoveryName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [mobilityDialogOpen, setMobilityDialogOpen] = useState(false);
  const [stabilityDialogOpen, setStabilityDialogOpen] = useState(false);
  const [activationDialogOpen, setActivationDialogOpen] = useState(false);
  const [neuralActDialogOpen, setNeuralActDialogOpen] = useState(false);
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
  
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

  // Fetch exercises by category
  const fetchExercisesByCategory = async (categoryName: string) => {
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
      .eq('exercise_to_category.exercise_categories.name', categoryName)
      .order('name');
    
    if (error) throw error;
    return data as Exercise[];
  };

  // Fetch mobility exercises
  const { data: mobilityExercises } = useQuery({
    queryKey: ['mobility-exercises'],
    queryFn: () => fetchExercisesByCategory('mobility')
  });

  // Fetch stability exercises
  const { data: stabilityExercises } = useQuery({
    queryKey: ['stability-exercises'],
    queryFn: () => fetchExercisesByCategory('stability')
  });

  // Fetch activation exercises
  const { data: activationExercises } = useQuery({
    queryKey: ['activation-exercises'],
    queryFn: () => fetchExercisesByCategory('activation')
  });

  // Fetch neural act exercises
  const { data: neuralActExercises } = useQuery({
    queryKey: ['neural-act-exercises'],
    queryFn: () => fetchExercisesByCategory('neural act')
  });

  // Fetch recovery exercises
  const { data: recoveryExercises } = useQuery({
    queryKey: ['recovery-exercises'],
    queryFn: () => fetchExercisesByCategory('recovery')
  });

  // Fetch exercise relationships
  const { data: relationships, isLoading } = useQuery({
    queryKey: ['exercise-relationships'],
    queryFn: async () => {
      const { data: rels, error: relsError } = await supabase
        .from('exercise_relationships')
        .select('*')
        .order('exercise_id');
      
      if (relsError) throw relsError;
      if (!rels || rels.length === 0) return [];
      
      const exerciseIds = [...new Set([
        ...rels.map(r => r.exercise_id),
        ...rels.map(r => r.related_exercise_id)
      ])];
      
      const { data: exerciseNames, error: namesError } = await supabase
        .from('exercises')
        .select('id, name')
        .in('id', exerciseIds);
      
      if (namesError) throw namesError;
      
      const exerciseMap = new Map(exerciseNames?.map(e => [e.id, e.name]) || []);
      
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
    mutationFn: async (type: 'mobility' | 'stability' | 'activation' | 'neural act' | 'recovery') => {
      let relatedId = '';
      switch (type) {
        case 'mobility': relatedId = selectedMobilityId; break;
        case 'stability': relatedId = selectedStabilityId; break;
        case 'activation': relatedId = selectedActivationId; break;
        case 'neural act': relatedId = selectedNeuralActId; break;
        case 'recovery': relatedId = selectedRecoveryId; break;
      }
      
      if (!selectedExerciseId || !relatedId) {
        throw new Error(`Επιλέξτε άσκηση και ${type}`);
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
          order_index: RELATIONSHIP_ORDER.indexOf(type)
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, type) => {
      queryClient.invalidateQueries({ queryKey: ['exercise-relationships'] });
      toast.success('Η σύνδεση δημιουργήθηκε επιτυχώς');
      switch (type) {
        case 'mobility':
          setSelectedMobilityId('');
          setSelectedMobilityName('');
          break;
        case 'stability':
          setSelectedStabilityId('');
          setSelectedStabilityName('');
          break;
        case 'activation':
          setSelectedActivationId('');
          setSelectedActivationName('');
          break;
        case 'neural act':
          setSelectedNeuralActId('');
          setSelectedNeuralActName('');
          break;
        case 'recovery':
          setSelectedRecoveryId('');
          setSelectedRecoveryName('');
          break;
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

  // Group relationships by exercise and sort by type order
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

  // Sort relationships within each group
  if (groupedRelationships) {
    Object.values(groupedRelationships).forEach(group => {
      group.relationships.sort((a, b) => {
        const orderA = RELATIONSHIP_ORDER.indexOf(a.relationship_type);
        const orderB = RELATIONSHIP_ORDER.indexOf(b.relationship_type);
        return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
      });
    });
  }

  if (isLoading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  const relationshipTypes = [
    { type: 'mobility' as const, label: 'Mobility', selectedId: selectedMobilityId, selectedName: selectedMobilityName, exercises: mobilityExercises, dialogOpen: mobilityDialogOpen, setDialogOpen: setMobilityDialogOpen, setId: setSelectedMobilityId, setName: setSelectedMobilityName },
    { type: 'stability' as const, label: 'Stability', selectedId: selectedStabilityId, selectedName: selectedStabilityName, exercises: stabilityExercises, dialogOpen: stabilityDialogOpen, setDialogOpen: setStabilityDialogOpen, setId: setSelectedStabilityId, setName: setSelectedStabilityName },
    { type: 'activation' as const, label: 'Activation', selectedId: selectedActivationId, selectedName: selectedActivationName, exercises: activationExercises, dialogOpen: activationDialogOpen, setDialogOpen: setActivationDialogOpen, setId: setSelectedActivationId, setName: setSelectedActivationName },
    { type: 'neural act' as const, label: 'Neural Act', selectedId: selectedNeuralActId, selectedName: selectedNeuralActName, exercises: neuralActExercises, dialogOpen: neuralActDialogOpen, setDialogOpen: setNeuralActDialogOpen, setId: setSelectedNeuralActId, setName: setSelectedNeuralActName },
    { type: 'recovery' as const, label: 'Recovery', selectedId: selectedRecoveryId, selectedName: selectedRecoveryName, exercises: recoveryExercises, dialogOpen: recoveryDialogOpen, setDialogOpen: setRecoveryDialogOpen, setId: setSelectedRecoveryId, setName: setSelectedRecoveryName },
  ];

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Add Relationship Form */}
      <Card className="rounded-none">
        <CardHeader className="pb-3 pt-4 px-4 md:px-6">
          <CardTitle className="text-lg md:text-base">Νέα Σύνδεση Άσκησης</CardTitle>
          <p className="text-sm md:text-xs text-gray-500 mt-1">
            Επιλέξτε άσκηση και συνδέστε την με mobility, stability, activation ή/και neural act ασκήσεις
          </p>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-3 px-4 pb-4 md:px-6 md:pb-4">
          {/* Exercise Selection */}
          <div>
            <label className="text-sm md:text-xs font-medium mb-1.5 md:mb-1 block">Άσκηση</label>
            <div
              onClick={() => setExerciseDialogOpen(true)}
              className="flex items-center justify-between p-3 md:p-2 border border-gray-300 rounded-none cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <span className={selectedExerciseName ? 'text-sm md:text-xs' : 'text-sm md:text-xs text-gray-500'}>
                {selectedExerciseName || 'Επιλέξτε άσκηση'}
              </span>
              <ChevronRight className="h-4 w-4 md:h-3 md:w-3 text-gray-400" />
            </div>
          </div>

          {/* Relationship Types Grid */}
          <div className="grid gap-4 md:gap-3 grid-cols-1 sm:grid-cols-2">
            {relationshipTypes.map(({ type, label, selectedId, selectedName, dialogOpen, setDialogOpen, setId, setName }) => (
              <div key={type} className="space-y-1.5 md:space-y-1">
                <label className="text-sm md:text-xs font-medium mb-1.5 md:mb-1 block">{label}</label>
                <div className="flex gap-2">
                  <div
                    onClick={() => setDialogOpen(true)}
                    className="flex-1 flex items-center justify-between p-3 md:p-2 border border-gray-300 rounded-none cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <span className={selectedName ? 'text-sm md:text-xs' : 'text-sm md:text-xs text-gray-500'}>
                      {selectedName || `Επιλέξτε ${label.toLowerCase()}`}
                    </span>
                    <ChevronRight className="h-4 w-4 md:h-3 md:w-3 text-gray-400" />
                  </div>
                  <Button
                    onClick={() => createRelationshipMutation.mutate(type)}
                    className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black shrink-0 h-10 w-10 md:h-8 md:w-8 p-0"
                    disabled={!selectedExerciseId || !selectedId}
                  >
                    <Plus className="h-4 w-4 md:h-3 md:w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 md:h-4 md:w-4 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Αναζήτηση ασκήσεων..."
          className="pl-10 md:pl-10 h-12 md:h-10 text-base md:text-sm rounded-none"
        />
      </div>

      {/* Relationships by Exercise */}
      <div className="space-y-3 md:space-y-4">
        {Object.entries(groupedRelationships || {}).map(([exerciseId, { exerciseName, relationships }]) => (
          <Card key={exerciseId} className="rounded-none">
            <CardHeader className="py-3 px-4 md:py-2 md:px-3">
              <CardTitle className="text-base md:text-sm">{exerciseName}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 md:px-3 md:pb-3">
              <div className="space-y-2 md:space-y-1">
                {relationships.map((rel) => (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between p-3 md:p-2 bg-gray-50 border border-gray-200 rounded-none"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs md:text-[10px] px-2 py-1 md:px-1.5 md:py-0.5 bg-gray-200 rounded-none font-medium shrink-0">
                        {rel.relationship_type}
                      </span>
                      <span className="text-sm md:text-xs truncate">{rel.related_exercise.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRelationshipMutation.mutate(rel.id)}
                      className="rounded-none text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 md:h-6 md:w-6 p-0 shrink-0"
                    >
                      <Trash2 className="h-4 w-4 md:h-3 md:w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!groupedRelationships || Object.keys(groupedRelationships).length === 0) && (
        <div className="text-center py-16 md:py-12 text-gray-500">
          <p className="text-base md:text-sm">Δεν υπάρχουν συνδέσεις. Δημιουργήστε την πρώτη σας σύνδεση!</p>
        </div>
      )}

      {/* Exercise Selection Dialogs */}
      <ExerciseSelectionDialog
        open={exerciseDialogOpen}
        onOpenChange={setExerciseDialogOpen}
        exercises={exercises || []}
        onSelectExercise={(id) => {
          const exercise = exercises?.find(e => e.id === id);
          if (exercise) {
            setSelectedExerciseId(id);
            setSelectedExerciseName(exercise.name);
          }
        }}
      />

      {relationshipTypes.map(({ type, exercises: typeExercises, dialogOpen, setDialogOpen, setId, setName }) => (
        <ExerciseSelectionDialog
          key={type}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          exercises={typeExercises || []}
          onSelectExercise={(id) => {
            const exercise = typeExercises?.find(e => e.id === id);
            if (exercise) {
              setId(id);
              setName(exercise.name);
            }
          }}
        />
      ))}
    </div>
  );
};
