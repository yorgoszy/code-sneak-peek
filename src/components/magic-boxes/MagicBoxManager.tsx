import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Gift, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MagicBoxPrizeManager } from './MagicBoxPrizeManager';

interface MagicBox {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  is_free: boolean;
  created_at: string;
}

export const MagicBoxManager: React.FC = () => {
  const [magicBoxes, setMagicBoxes] = useState<MagicBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBox, setEditingBox] = useState<MagicBox | null>(null);
  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    is_free: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMagicBoxes();
  }, []);

  const fetchMagicBoxes = async () => {
    try {
      const { data, error } = await supabase
        .from('magic_boxes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMagicBoxes(data || []);
    } catch (error) {
      console.error('Error fetching magic boxes:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία φόρτωσης μαγικών κουτιών',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingBox) {
        const { error } = await supabase
          .from('magic_boxes')
          .update({
            name: formData.name,
            description: formData.description,
            is_active: formData.is_active,
            is_free: formData.is_free,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingBox.id);

        if (error) throw error;
        
        toast({
          title: 'Επιτυχία',
          description: 'Το μαγικό κουτί ενημερώθηκε επιτυχώς'
        });
      } else {
        const { error } = await supabase
          .from('magic_boxes')
          .insert({
            name: formData.name,
            description: formData.description,
            is_active: formData.is_active,
            is_free: formData.is_free
          });

        if (error) throw error;
        
        toast({
          title: 'Επιτυχία',
          description: 'Το μαγικό κουτί δημιουργήθηκε επιτυχώς'
        });
      }

      setFormData({ name: '', description: '', is_active: true, is_free: true });
      setEditingBox(null);
      setShowForm(false);
      fetchMagicBoxes();
    } catch (error) {
      console.error('Error saving magic box:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία αποθήκευσης μαγικού κουτιού',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (box: MagicBox) => {
    setEditingBox(box);
    setFormData({
      name: box.name,
      description: box.description,
      is_active: box.is_active,
      is_free: box.is_free
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Είστε σίγουρος ότι θέλετε να διαγράψετε αυτό το μαγικό κουτί;')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('magic_boxes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Επιτυχία',
        description: 'Το μαγικό κουτί διαγράφηκε επιτυχώς'
      });
      
      fetchMagicBoxes();
    } catch (error) {
      console.error('Error deleting magic box:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία διαγραφής μαγικού κουτιού',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', is_active: true, is_free: true });
    setEditingBox(null);
    setShowForm(false);
  };

  if (selectedBox) {
    return (
      <MagicBoxPrizeManager 
        magicBoxId={selectedBox} 
        onBack={() => setSelectedBox(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Διαχείριση Μαγικών Κουτιών</h2>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Νέο Μαγικό Κουτί
        </Button>
      </div>

      {showForm && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>
              {editingBox ? 'Επεξεργασία Μαγικού Κουτιού' : 'Νέο Μαγικό Κουτί'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Όνομα</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-none"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Περιγραφή</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Ενεργό</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_free"
                  checked={formData.is_free}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
                />
                <Label htmlFor="is_free">Δωρεάν</Label>
              </div>

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  {loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
                </Button>
                <Button
                  type="button"
                  onClick={resetForm}
                  variant="outline"
                  className="rounded-none"
                >
                  Ακύρωση
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {magicBoxes.map((box) => (
          <Card key={box.id} className="rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  {box.name}
                </div>
                <div className="flex gap-1">
                  {box.is_active && (
                    <Badge variant="default" className="bg-[#00ffba] text-black rounded-none">
                      Ενεργό
                    </Badge>
                  )}
                  {box.is_free && (
                    <Badge variant="secondary" className="rounded-none">
                      Δωρεάν
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{box.description}</p>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => setSelectedBox(box.id)}
                  size="sm"
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Δώρα
                </Button>
                <Button
                  onClick={() => handleEdit(box)}
                  size="sm"
                  variant="outline"
                  className="rounded-none"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Επεξ.
                </Button>
                <Button
                  onClick={() => handleDelete(box.id)}
                  size="sm"
                  variant="destructive"
                  className="rounded-none"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && magicBoxes.length === 0 && (
        <Card className="rounded-none">
          <CardContent className="text-center py-8">
            <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Δεν υπάρχουν μαγικά κουτιά</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};