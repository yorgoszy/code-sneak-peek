import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Muscle {
  id: string;
  name: string;
  muscle_group: string | null;
}

export const MuscleList = () => {
  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMuscleName, setNewMuscleName] = useState('');
  const [newMuscleGroup, setNewMuscleGroup] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMuscles();
  }, []);

  const fetchMuscles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('muscles')
      .select('*')
      .order('name');
    
    if (error) {
      toast.error('Σφάλμα φόρτωσης μυών');
      console.error(error);
    } else {
      setMuscles(data || []);
    }
    setLoading(false);
  };

  const handleAddMuscle = async () => {
    if (!newMuscleName.trim()) {
      toast.error('Εισάγετε όνομα μυός');
      return;
    }

    const { error } = await supabase
      .from('muscles')
      .insert({ 
        name: newMuscleName.trim(),
        muscle_group: newMuscleGroup.trim() || null
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('Ο μυς υπάρχει ήδη');
      } else {
        toast.error('Σφάλμα προσθήκης μυός');
        console.error(error);
      }
    } else {
      toast.success('Ο μυς προστέθηκε');
      setNewMuscleName('');
      setNewMuscleGroup('');
      fetchMuscles();
    }
  };

  const handleDeleteMuscle = async (id: string, name: string) => {
    if (!confirm(`Διαγραφή του μυός "${name}";`)) return;

    const { error } = await supabase
      .from('muscles')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Σφάλμα διαγραφής');
      console.error(error);
    } else {
      toast.success('Ο μυς διαγράφηκε');
      fetchMuscles();
    }
  };

  const filteredMuscles = muscles.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.muscle_group && m.muscle_group.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const groupedMuscles = filteredMuscles.reduce((acc, muscle) => {
    const group = muscle.muscle_group || 'Χωρίς Κατηγορία';
    if (!acc[group]) acc[group] = [];
    acc[group].push(muscle);
    return acc;
  }, {} as Record<string, Muscle[]>);

  return (
    <Card className="rounded-none">
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <CardTitle className="flex items-center justify-between text-base sm:text-lg md:text-xl">
          <span>Τράπεζα Μυών ({muscles.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
        {/* Add new muscle */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Όνομα μυός..."
            value={newMuscleName}
            onChange={(e) => setNewMuscleName(e.target.value)}
            className="rounded-none text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleAddMuscle()}
          />
          <Input
            placeholder="Κατηγορία (προαιρετικό)..."
            value={newMuscleGroup}
            onChange={(e) => setNewMuscleGroup(e.target.value)}
            className="rounded-none text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleAddMuscle()}
          />
          <Button onClick={handleAddMuscle} className="rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Προσθήκη
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Αναζήτηση μυός..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-none pl-10"
          />
        </div>

        {/* Muscle list by group */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Φόρτωση...</div>
        ) : Object.keys(groupedMuscles).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Δεν βρέθηκαν μύες. Προσθέστε νέους μύες παραπάνω.
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {Object.entries(groupedMuscles).sort().map(([group, groupMuscles]) => (
              <div key={group} className="border border-gray-200 rounded-none">
                <div className="bg-gray-50 px-3 sm:px-4 py-2 font-semibold text-xs sm:text-sm border-b">
                  {group} ({groupMuscles.length})
                </div>
                <div className="p-2 flex flex-wrap gap-1.5 sm:gap-2">
                  {groupMuscles.map(muscle => (
                    <div 
                      key={muscle.id}
                      className="flex items-center gap-1.5 sm:gap-2 bg-white border px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm group hover:bg-gray-50"
                    >
                      <span className="truncate max-w-[150px] sm:max-w-none">{muscle.name}</span>
                      <button
                        onClick={() => handleDeleteMuscle(muscle.id, muscle.name)}
                        className="text-red-500 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
