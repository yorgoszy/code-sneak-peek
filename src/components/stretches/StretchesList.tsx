import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface Stretch {
  id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  duration_seconds: number | null;
}

export const StretchesList: React.FC = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    video_url: '',
    duration_seconds: 30
  });

  const queryClient = useQueryClient();

  // Fetch stretches
  const { data: stretches, isLoading } = useQuery({
    queryKey: ['stretches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stretches')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Stretch[];
    }
  });

  // Create stretch
  const createMutation = useMutation({
    mutationFn: async (newStretch: typeof formData) => {
      const { data, error } = await supabase
        .from('stretches')
        .insert([newStretch])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stretches'] });
      toast.success('Η διάταση δημιουργήθηκε επιτυχώς');
      resetForm();
    },
    onError: () => {
      toast.error('Σφάλμα κατά τη δημιουργία της διάτασης');
    }
  });

  // Update stretch
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<typeof formData> }) => {
      const { data, error } = await supabase
        .from('stretches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stretches'] });
      toast.success('Η διάταση ενημερώθηκε επιτυχώς');
      setEditingId(null);
      resetForm();
    },
    onError: () => {
      toast.error('Σφάλμα κατά την ενημέρωση της διάτασης');
    }
  });

  // Delete stretch
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stretches')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stretches'] });
      toast.success('Η διάταση διαγράφηκε επιτυχώς');
    },
    onError: () => {
      toast.error('Σφάλμα κατά τη διαγραφή της διάτασης');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      video_url: '',
      duration_seconds: 30
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (stretch: Stretch) => {
    setFormData({
      name: stretch.name,
      description: stretch.description || '',
      video_url: stretch.video_url || '',
      duration_seconds: stretch.duration_seconds || 30
    });
    setEditingId(stretch.id);
    setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Το όνομα είναι υποχρεωτικό');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, updates: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingId ? 'Επεξεργασία Διάτασης' : 'Νέα Διάταση'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="rounded-none"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Όνομα *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-none"
                  placeholder="π.χ. Διάταση Τετρακεφάλου"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Περιγραφή</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-none"
                  placeholder="Περιγραφή της διάτασης..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Video URL</label>
                <Input
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  className="rounded-none"
                  placeholder="https://..."
                  type="url"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Διάρκεια (δευτερόλεπτα)</label>
                <Input
                  value={formData.duration_seconds}
                  onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) || 0 })}
                  className="rounded-none"
                  type="number"
                  min="0"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black">
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Ενημέρωση' : 'Δημιουργία'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="rounded-none">
                  Ακύρωση
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add Button */}
      {!isAdding && !editingId && (
        <Button
          onClick={() => setIsAdding(true)}
          className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
        >
          <Plus className="h-4 w-4 mr-2" />
          Νέα Διάταση
        </Button>
      )}

      {/* Stretches List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stretches?.map((stretch) => (
          <Card key={stretch.id} className="rounded-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{stretch.name}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(stretch)}
                    className="rounded-none"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(stretch.id)}
                    className="rounded-none text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stretch.description && (
                <p className="text-sm text-gray-600 mb-2">{stretch.description}</p>
              )}
              {stretch.duration_seconds && (
                <p className="text-xs text-gray-500">
                  Διάρκεια: {stretch.duration_seconds} δευτερόλεπτα
                </p>
              )}
              {stretch.video_url && (
                <a
                  href={stretch.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#00ffba] hover:underline mt-2 inline-block"
                >
                  Προβολή Video
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {stretches?.length === 0 && !isAdding && (
        <div className="text-center py-12 text-gray-500">
          Δεν υπάρχουν διατάσεις. Δημιουργήστε την πρώτη σας διάταση!
        </div>
      )}
    </div>
  );
};
