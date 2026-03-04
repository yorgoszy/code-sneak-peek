import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Category {
  id: string;
  name: string;
  category_type: string;
  min_age: number | null;
  max_age: number | null;
  min_weight: number | null;
  max_weight: number | null;
  gender: string | null;
  sort_order: number;
}

interface CompetitionCategoriesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
  competitionName: string;
}

export const CompetitionCategoriesDialog: React.FC<CompetitionCategoriesDialogProps> = ({
  isOpen, onClose, competitionId, competitionName,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMode, setAddMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [categoryType, setCategoryType] = useState('combined');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [gender, setGender] = useState('mixed');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) fetchCategories();
  }, [isOpen, competitionId]);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('federation_competition_categories')
      .select('*')
      .eq('competition_id', competitionId)
      .order('sort_order');

    if (error) { console.error(error); toast.error('Σφάλμα φόρτωσης'); }
    setCategories((data as Category[]) || []);
    setLoading(false);
  };

  const resetForm = () => {
    setName(''); setCategoryType('combined');
    setMinAge(''); setMaxAge('');
    setMinWeight(''); setMaxWeight('');
    setGender('mixed'); setAddMode(false);
  };

  const handleAdd = async () => {
    if (!name) { toast.error('Συμπληρώστε όνομα κατηγορίας'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('federation_competition_categories').insert({
        competition_id: competitionId,
        name,
        category_type: categoryType,
        min_age: minAge ? parseInt(minAge) : null,
        max_age: maxAge ? parseInt(maxAge) : null,
        min_weight: minWeight ? parseFloat(minWeight) : null,
        max_weight: maxWeight ? parseFloat(maxWeight) : null,
        gender,
        sort_order: categories.length,
      });
      if (error) throw error;
      toast.success('Η κατηγορία προστέθηκε');
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error('Σφάλμα');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      const { error } = await supabase.from('federation_competition_categories').delete().eq('id', categoryToDelete);
      if (error) throw error;
      toast.success('Η κατηγορία διαγράφηκε');
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error('Σφάλμα');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = { age: 'Ηλικίας', weight: 'Κιλών', combined: 'Ηλικίας/Κιλών' };
    return labels[type] || type;
  };

  const getGenderLabel = (g: string | null) => {
    const labels: Record<string, string> = { male: 'Άνδρες', female: 'Γυναίκες', mixed: 'Μικτή' };
    return labels[g || 'mixed'] || g;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle>Κατηγορίες - {competitionName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!addMode && (
              <Button onClick={() => setAddMode(true)} variant="outline" className="rounded-none">
                <Plus className="h-4 w-4 mr-2" /> Προσθήκη Κατηγορίας
              </Button>
            )}

            {addMode && (
              <div className="border p-4 space-y-3">
                <div>
                  <Label>Όνομα *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="π.χ. Juniors -60kg" className="rounded-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Τύπος</Label>
                    <Select value={categoryType} onValueChange={setCategoryType}>
                      <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="age">Ηλικίας</SelectItem>
                        <SelectItem value="weight">Κιλών</SelectItem>
                        <SelectItem value="combined">Ηλικίας/Κιλών</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Φύλο</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="male">Άνδρες</SelectItem>
                        <SelectItem value="female">Γυναίκες</SelectItem>
                        <SelectItem value="mixed">Μικτή</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {(categoryType === 'age' || categoryType === 'combined') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Ηλικία από</Label>
                      <Input type="number" value={minAge} onChange={e => setMinAge(e.target.value)} className="rounded-none" />
                    </div>
                    <div>
                      <Label>Ηλικία έως</Label>
                      <Input type="number" value={maxAge} onChange={e => setMaxAge(e.target.value)} className="rounded-none" />
                    </div>
                  </div>
                )}
                {(categoryType === 'weight' || categoryType === 'combined') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Βάρος από (kg)</Label>
                      <Input type="number" step="0.1" value={minWeight} onChange={e => setMinWeight(e.target.value)} className="rounded-none" />
                    </div>
                    <div>
                      <Label>Βάρος έως (kg)</Label>
                      <Input type="number" step="0.1" value={maxWeight} onChange={e => setMaxWeight(e.target.value)} className="rounded-none" />
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleAdd} disabled={saving} className="rounded-none bg-foreground text-background hover:bg-foreground/90">
                    {saving ? 'Αποθήκευση...' : 'Προσθήκη'}
                  </Button>
                  <Button variant="outline" onClick={resetForm} className="rounded-none">Ακύρωση</Button>
                </div>
              </div>
            )}

            {loading ? (
              <p className="text-muted-foreground text-center py-4">Φόρτωση...</p>
            ) : categories.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Δεν υπάρχουν κατηγορίες</p>
            ) : (
              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3 border rounded-none">
                    <div>
                      <span className="font-medium text-sm">{cat.name}</span>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="rounded-none text-xs">{getTypeLabel(cat.category_type)}</Badge>
                        <Badge variant="outline" className="rounded-none text-xs">{getGenderLabel(cat.gender)}</Badge>
                        {(cat.min_age != null || cat.max_age != null) && (
                          <Badge variant="outline" className="rounded-none text-xs">
                            {cat.min_age ?? '?'}-{cat.max_age ?? '?'} ετών
                          </Badge>
                        )}
                        {(cat.min_weight != null || cat.max_weight != null) && (
                          <Badge variant="outline" className="rounded-none text-xs">
                            {cat.min_weight ?? '?'}-{cat.max_weight ?? '?'} kg
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-none text-destructive" onClick={() => {
                      setCategoryToDelete(cat.id);
                      setDeleteDialogOpen(true);
                    }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>Η κατηγορία και οι δηλώσεις σε αυτήν θα διαγραφούν.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-none">Διαγραφή</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
