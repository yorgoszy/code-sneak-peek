import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubscriptionType {
  id: string;
  name: string;
  price: number;
  duration_months: number;
  coach_id: string;
  is_active: boolean;
}

interface SubscriptionTypesTabProps {
  coachId: string;
}

export const SubscriptionTypesTab: React.FC<SubscriptionTypesTabProps> = ({ coachId }) => {
  const [types, setTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<SubscriptionType | null>(null);
  const [editingType, setEditingType] = useState<SubscriptionType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration_months: ''
  });

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_types')
        .select('*')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTypes(data || []);
    } catch (error) {
      console.error('Error fetching subscription types:', error);
      toast.error('Σφάλμα φόρτωσης τύπων');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (coachId) {
      fetchTypes();
    }
  }, [coachId]);

  const handleOpenDialog = (type?: SubscriptionType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        price: type.price.toString(),
        duration_months: type.duration_months.toString()
      });
    } else {
      setEditingType(null);
      setFormData({ name: '', price: '', duration_months: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.duration_months) {
      toast.error('Συμπληρώστε όλα τα πεδία');
      return;
    }

    try {
      if (editingType) {
        const { error } = await supabase
          .from('subscription_types')
          .update({
            name: formData.name,
            price: parseFloat(formData.price),
            duration_months: parseInt(formData.duration_months)
          })
          .eq('id', editingType.id);

        if (error) throw error;
        toast.success('Ο τύπος ενημερώθηκε');
      } else {
        const { error } = await supabase
          .from('subscription_types')
          .insert({
            name: formData.name,
            price: parseFloat(formData.price),
            duration_months: parseInt(formData.duration_months),
            coach_id: coachId,
            is_active: true
          });

        if (error) throw error;
        toast.success('Ο τύπος δημιουργήθηκε');
      }

      setDialogOpen(false);
      fetchTypes();
    } catch (error) {
      console.error('Error saving subscription type:', error);
      toast.error('Σφάλμα αποθήκευσης');
    }
  };

  const openDeleteDialog = (type: SubscriptionType) => {
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!typeToDelete) return;

    try {
      const { error } = await supabase
        .from('subscription_types')
        .delete()
        .eq('id', typeToDelete.id);

      if (error) throw error;
      toast.success('Ο τύπος διαγράφηκε');
      setDeleteDialogOpen(false);
      setTypeToDelete(null);
      fetchTypes();
    } catch (error) {
      console.error('Error deleting subscription type:', error);
      toast.error('Σφάλμα διαγραφής');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Φόρτωση...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
        >
          <Plus className="h-4 w-4 mr-2" />
          Νέος Τύπος
        </Button>
      </div>

      {types.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Δεν υπάρχουν τύποι συνδρομών
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {types.map((type) => (
            <Card key={type.id} className="rounded-none">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{type.name}</h3>
                    <p className="text-2xl font-bold text-[#00ffba]">{type.price}€</p>
                    <p className="text-sm text-muted-foreground">
                      {type.duration_months} {type.duration_months === 1 ? 'μήνας' : 'μήνες'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleOpenDialog(type)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openDeleteDialog(type)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Επεξεργασία Τύπου' : 'Νέος Τύπος Συνδρομής'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Όνομα</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="π.χ. Μηνιαία Συνδρομή"
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Τιμή (€)</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Διάρκεια (μήνες)</Label>
              <Input
                type="number"
                value={formData.duration_months}
                onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                placeholder="1"
                className="rounded-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-none">
              Ακύρωση
            </Button>
            <Button onClick={handleSave} className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none">
              {editingType ? 'Αποθήκευση' : 'Δημιουργία'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>
              Θέλετε να διαγράψετε τον τύπο "{typeToDelete?.name}";
              Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 rounded-none"
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
