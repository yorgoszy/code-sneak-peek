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
  allowed_sections?: string[] | null;
  visit_count?: number | null;
  visit_expiry_months?: number | null;
}

interface BookingSection {
  id: string;
  name: string;
}

interface SubscriptionTypesTabProps {
  coachId: string;
}

export const SubscriptionTypesTab: React.FC<SubscriptionTypesTabProps> = ({ coachId }) => {
  const [types, setTypes] = useState<SubscriptionType[]>([]);
  const [bookingSections, setBookingSections] = useState<BookingSection[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<SubscriptionType | null>(null);
  const [editingType, setEditingType] = useState<SubscriptionType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration_months: '',
    visit_count: '',
    visit_expiry_months: '',
    mode: 'monthly' as 'monthly' | 'visits'
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

  const fetchBookingSections = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_sections')
        .select('id, name')
        .eq('coach_id', coachId)
        .eq('booking_type', 'gym_visit')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBookingSections(data || []);
    } catch (error) {
      console.error('Error fetching booking sections:', error);
    }
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  useEffect(() => {
    if (coachId) {
      fetchTypes();
      fetchBookingSections();
    }
  }, [coachId]);

  const handleOpenDialog = (type?: SubscriptionType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        price: type.price.toString(),
        duration_months: type.duration_months.toString(),
        visit_count: type.visit_count ? type.visit_count.toString() : '',
        visit_expiry_months: type.visit_expiry_months ? type.visit_expiry_months.toString() : '',
        mode: type.visit_count ? 'visits' : 'monthly'
      });
      setSelectedSections(type.allowed_sections || []);
    } else {
      setEditingType(null);
      setFormData({ name: '', price: '', duration_months: '', visit_count: '', visit_expiry_months: '', mode: 'monthly' });
      setSelectedSections([]);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const isVisits = formData.mode === 'visits';
    const visits = parseInt(formData.visit_count);
    const visitExpiry = parseInt(formData.visit_expiry_months);
    const months = parseInt(formData.duration_months);
    if (!formData.name || !formData.price || (isVisits ? !(visits > 0) || !(visitExpiry > 0) : !(months > 0))) {
      toast.error(isVisits ? 'Συμπληρώστε επισκέψεις και λήξη' : 'Συμπληρώστε όλα τα πεδία');
      return;
    }
    const visitFields = isVisits
      ? { visit_count: visits, visit_expiry_months: visitExpiry, subscription_mode: 'visit_based' }
      : { visit_count: null, visit_expiry_months: null, subscription_mode: 'time_based' };
    const durationValue = isVisits ? visitExpiry : months;

    try {
      if (editingType) {
        const { error } = await supabase
          .from('subscription_types')
          .update({
            name: formData.name,
            price: parseFloat(formData.price),
            duration_months: durationValue,
            allowed_sections: selectedSections.length > 0 ? selectedSections : null,
            ...visitFields
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
            duration_months: durationValue,
            coach_id: coachId,
            is_active: true,
            allowed_sections: selectedSections.length > 0 ? selectedSections : null,
            ...visitFields
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
          className="rounded-none bg-[var(--th-blue)] hover:bg-[var(--th-blue-hover)] text-[var(--th-white)]"
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
                    <p className="text-2xl font-bold text-[var(--th-blue)]">{type.price}€</p>
                    {!type.visit_count && (
                      <p className="text-sm text-muted-foreground">
                        {type.duration_months} {type.duration_months === 1 ? 'μήνας' : 'μήνες'}
                      </p>
                    )}
                    {type.visit_count ? (
                      <p className="text-xs text-muted-foreground">
                        {type.visit_count} επισκέψεις{type.visit_expiry_months ? ` · λήγουν σε ${type.visit_expiry_months} ${type.visit_expiry_months === 1 ? 'μήνα' : 'μήνες'}` : ''}
                      </p>
                    ) : null}
                    {type.allowed_sections && type.allowed_sections.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {type.allowed_sections.length} {type.allowed_sections.length === 1 ? 'τμήμα' : 'τμήματα'} booking
                      </p>
                    )}
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
            <div className="grid grid-cols-2 gap-0 border border-border">
              {([['monthly', 'Μηνιαία συνδρομή'], ['visits', 'Επισκέψεις']] as const).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFormData({ ...formData, mode: m })}
                  className={`py-2 text-sm rounded-none transition-colors ${formData.mode === m ? 'bg-[var(--th-blue)] text-[var(--th-white)]' : 'bg-background text-foreground hover:bg-muted'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className={`grid gap-3 ${formData.mode === 'visits' ? 'grid-cols-3' : 'grid-cols-2'}`}>
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
              {formData.mode === 'monthly' ? (
                <div className="space-y-2">
                  <Label>Διάρκεια (μήνες)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.duration_months}
                    onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                    placeholder="1"
                    className="rounded-none"
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Επισκέψεις</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.visit_count}
                      onChange={(e) => setFormData({ ...formData, visit_count: e.target.value })}
                      placeholder="10"
                      className="rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Λήξη (μήνες)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.visit_expiry_months}
                      onChange={(e) => setFormData({ ...formData, visit_expiry_months: e.target.value })}
                      placeholder="2"
                      className="rounded-none"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Τμήματα Booking</Label>
                <span className="text-[10px] text-muted-foreground">
                  Χωρίς επιλογή = όλα
                </span>
              </div>
              {bookingSections.length === 0 ? (
                <p className="text-xs text-muted-foreground">Δεν υπάρχουν τμήματα</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {bookingSections.map((section) => {
                    const isSelected = selectedSections.includes(section.id);
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className={`rounded-none border px-2 py-0.5 text-[11px] transition-colors ${
                          isSelected
                            ? 'bg-[var(--th-blue)] hover:bg-[var(--th-blue-hover)] text-[var(--th-white)] border-transparent'
                            : 'border-border hover:bg-accent'
                        }`}
                      >
                        {section.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-none">
              Ακύρωση
            </Button>
            <Button onClick={handleSave} className="bg-[#004aad] hover:bg-[#004aad]/90 text-white rounded-none">
              {editingType ? 'Αποθήκευση' : 'Δημιουργία'}
            </Button>
          </div>
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
