import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Check } from "lucide-react";
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
  template_id?: string | null;
}

interface CategoryTemplate {
  id: string;
  name: string;
  category_type: string;
  min_age: number | null;
  max_age: number | null;
  min_weight: number | null;
  max_weight: number | null;
  gender: string | null;
}

interface CompetitionCategoriesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
  competitionName: string;
  federationId: string;
}

export const CompetitionCategoriesDialog: React.FC<CompetitionCategoriesDialogProps> = ({
  isOpen, onClose, competitionId, competitionName, federationId,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<CategoryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMode, setAddMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchTemplates();
    }
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

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('federation_category_templates')
      .select('*')
      .eq('federation_id', federationId)
      .order('sort_order');

    if (error) console.error(error);
    setTemplates((data as CategoryTemplate[]) || []);
  };

  const isTemplateAdded = (templateId: string) => {
    return categories.some(c => c.name === templates.find(t => t.id === templateId)?.name);
  };

  const handleAddFromTemplate = async (template: CategoryTemplate) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('federation_competition_categories').insert({
        competition_id: competitionId,
        name: template.name,
        category_type: template.category_type,
        min_age: template.min_age,
        max_age: template.max_age,
        min_weight: template.min_weight,
        max_weight: template.max_weight,
        gender: template.gender,
        sort_order: categories.length,
      });
      if (error) throw error;
      toast.success(`Η κατηγορία "${template.name}" προστέθηκε`);
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error('Σφάλμα');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAll = async () => {
    const toAdd = templates.filter(t => !isTemplateAdded(t.id));
    if (toAdd.length === 0) {
      toast.info('Όλες οι κατηγορίες έχουν ήδη προστεθεί');
      return;
    }
    setSaving(true);
    try {
      const inserts = toAdd.map((t, i) => ({
        competition_id: competitionId,
        name: t.name,
        category_type: t.category_type,
        min_age: t.min_age,
        max_age: t.max_age,
        min_weight: t.min_weight,
        max_weight: t.max_weight,
        gender: t.gender,
        sort_order: categories.length + i,
      }));
      const { error } = await supabase.from('federation_competition_categories').insert(inserts);
      if (error) throw error;
      toast.success(`Προστέθηκαν ${toAdd.length} κατηγορίες`);
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
      toast.success('Η κατηγορία αφαιρέθηκε');
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
            {/* Επιλογή από templates */}
            {!addMode && (
              <Button onClick={() => setAddMode(true)} variant="outline" className="rounded-none">
                <Plus className="h-4 w-4 mr-2" /> Προσθήκη Κατηγοριών
              </Button>
            )}

            {addMode && (
              <div className="border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Επιλέξτε κατηγορίες</h4>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-none" onClick={handleAddAll} disabled={saving}>
                      Προσθήκη Όλων
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-none" onClick={() => setAddMode(false)}>
                      Κλείσιμο
                    </Button>
                  </div>
                </div>

                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Δεν υπάρχουν κατηγορίες. Δημιουργήστε πρώτα κατηγορίες από το μενού "Διαχείριση Κατηγοριών".
                  </p>
                ) : (
                  <div className="space-y-1">
                    {templates.map(t => {
                      const added = isTemplateAdded(t.id);
                      return (
                        <div key={t.id}
                          className={`flex items-center justify-between p-2 border rounded-none cursor-pointer transition-colors ${added ? 'bg-muted opacity-60' : 'hover:bg-muted/50'}`}
                          onClick={() => !added && !saving && handleAddFromTemplate(t)}
                        >
                          <div className="flex items-center gap-2">
                            {added && <Check className="h-4 w-4 text-green-600" />}
                            <span className="text-sm font-medium">{t.name}</span>
                            <Badge variant="outline" className="rounded-none text-xs">{getTypeLabel(t.category_type)}</Badge>
                            <Badge variant="outline" className="rounded-none text-xs">{getGenderLabel(t.gender)}</Badge>
                          </div>
                          {!added && (
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Τρέχουσες κατηγορίες αγώνα */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Κατηγορίες αγώνα ({categories.length})</h4>
              {loading ? (
                <p className="text-muted-foreground text-center py-4">Φόρτωση...</p>
              ) : categories.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Δεν υπάρχουν κατηγορίες στον αγώνα</p>
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
