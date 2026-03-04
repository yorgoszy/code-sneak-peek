import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Check, ChevronDown, ChevronRight } from "lucide-react";
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

const getAgeGroup = (name: string): string => {
  if (name.startsWith('Ενήλικοι')) return 'Ενήλικοι 18+';
  if (name.startsWith('U23')) return 'U23 (18-23)';
  if (name.startsWith('Νέοι 16-17')) return 'Νέοι 16-17';
  if (name.startsWith('Νέοι 14-15')) return 'Νέοι 14-15';
  if (name.startsWith('Νέοι 12-13')) return 'Νέοι 12-13';
  if (name.startsWith('Νέοι 10-11')) return 'Νέοι 10-11';
  if (name.startsWith('Νέοι 8-9')) return 'Νέοι 8-9';
  if (name.startsWith('Νέοι 5-7')) return 'Νέοι 5-7';
  return 'Άλλες';
};

const AGE_GROUP_ORDER = [
  'Ενήλικοι 18+', 'U23 (18-23)', 'Νέοι 16-17', 'Νέοι 14-15',
  'Νέοι 12-13', 'Νέοι 10-11', 'Νέοι 8-9', 'Νέοι 5-7', 'Άλλες'
];

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
  const [expandedTemplateGroups, setExpandedTemplateGroups] = useState<Set<string>>(new Set());
  const [expandedCategoryGroups, setExpandedCategoryGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) { fetchCategories(); fetchTemplates(); }
  }, [isOpen, competitionId]);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('federation_competition_categories')
      .select('*').eq('competition_id', competitionId).order('sort_order');
    if (error) { console.error(error); toast.error('Σφάλμα φόρτωσης'); }
    setCategories((data as Category[]) || []);
    setLoading(false);
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('federation_category_templates')
      .select('*').eq('federation_id', federationId).order('sort_order');
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
        competition_id: competitionId, name: template.name, category_type: template.category_type,
        min_age: template.min_age, max_age: template.max_age, min_weight: template.min_weight,
        max_weight: template.max_weight, gender: template.gender, sort_order: categories.length,
      });
      if (error) throw error;
      toast.success(`Η κατηγορία "${template.name}" προστέθηκε`);
      fetchCategories();
    } catch (error) { console.error(error); toast.error('Σφάλμα'); }
    finally { setSaving(false); }
  };

  const handleAddGroupFromTemplates = async (groupTemplates: CategoryTemplate[]) => {
    const toAdd = groupTemplates.filter(t => !isTemplateAdded(t.id));
    if (toAdd.length === 0) { toast.info('Όλες οι κατηγορίες αυτής της ομάδας έχουν ήδη προστεθεί'); return; }
    setSaving(true);
    try {
      const inserts = toAdd.map((t, i) => ({
        competition_id: competitionId, name: t.name, category_type: t.category_type,
        min_age: t.min_age, max_age: t.max_age, min_weight: t.min_weight,
        max_weight: t.max_weight, gender: t.gender, sort_order: categories.length + i,
      }));
      const { error } = await supabase.from('federation_competition_categories').insert(inserts);
      if (error) throw error;
      toast.success(`Προστέθηκαν ${toAdd.length} κατηγορίες`);
      fetchCategories();
    } catch (error) { console.error(error); toast.error('Σφάλμα'); }
    finally { setSaving(false); }
  };

  const handleAddAll = async () => {
    const toAdd = templates.filter(t => !isTemplateAdded(t.id));
    if (toAdd.length === 0) { toast.info('Όλες οι κατηγορίες έχουν ήδη προστεθεί'); return; }
    setSaving(true);
    try {
      const inserts = toAdd.map((t, i) => ({
        competition_id: competitionId, name: t.name, category_type: t.category_type,
        min_age: t.min_age, max_age: t.max_age, min_weight: t.min_weight,
        max_weight: t.max_weight, gender: t.gender, sort_order: categories.length + i,
      }));
      const { error } = await supabase.from('federation_competition_categories').insert(inserts);
      if (error) throw error;
      toast.success(`Προστέθηκαν ${toAdd.length} κατηγορίες`);
      fetchCategories();
    } catch (error) { console.error(error); toast.error('Σφάλμα'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      const { error } = await supabase.from('federation_competition_categories').delete().eq('id', categoryToDelete);
      if (error) throw error;
      toast.success('Η κατηγορία αφαιρέθηκε');
      setDeleteDialogOpen(false); setCategoryToDelete(null); fetchCategories();
    } catch (error) { console.error(error); toast.error('Σφάλμα'); }
  };

  const toggleTemplateGroup = (group: string) => {
    setExpandedTemplateGroups(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const toggleCategoryGroup = (group: string) => {
    setExpandedCategoryGroups(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const getGenderLabel = (g: string | null) => {
    const labels: Record<string, string> = { male: 'Άνδρες', female: 'Γυναίκες', mixed: 'Μικτή' };
    return labels[g || 'mixed'] || g;
  };

  // Group templates
  const groupedTemplates = templates.reduce<Record<string, CategoryTemplate[]>>((acc, t) => {
    const group = getAgeGroup(t.name);
    (acc[group] = acc[group] || []).push(t);
    return acc;
  }, {});

  // Group categories
  const groupedCategories = categories.reduce<Record<string, Category[]>>((acc, c) => {
    const group = getAgeGroup(c.name);
    (acc[group] = acc[group] || []).push(c);
    return acc;
  }, {});

  const sortedTemplateGroups = AGE_GROUP_ORDER.filter(g => groupedTemplates[g]?.length > 0);
  const sortedCategoryGroups = AGE_GROUP_ORDER.filter(g => groupedCategories[g]?.length > 0);

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
                    {sortedTemplateGroups.map(group => {
                      const items = groupedTemplates[group];
                      const isExpanded = expandedTemplateGroups.has(group);
                      const allAdded = items.every(t => isTemplateAdded(t.id));
                      const addedCount = items.filter(t => isTemplateAdded(t.id)).length;

                      return (
                        <div key={group} className="border rounded-none">
                          <div className="flex items-center justify-between p-2 hover:bg-muted/50">
                            <button onClick={() => toggleTemplateGroup(group)} className="flex items-center gap-2 flex-1">
                              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                              <span className="text-sm font-medium">{group}</span>
                              <Badge variant="outline" className="rounded-none text-xs">
                                {addedCount}/{items.length}
                              </Badge>
                            </button>
                            {!allAdded && (
                              <Button size="sm" variant="ghost" className="rounded-none text-xs h-7"
                                onClick={() => handleAddGroupFromTemplates(items)} disabled={saving}>
                                <Plus className="h-3 w-3 mr-1" /> Όλη η ομάδα
                              </Button>
                            )}
                            {allAdded && <Check className="h-4 w-4 text-green-600 mr-2" />}
                          </div>

                          {isExpanded && (
                            <div className="border-t p-2">
                              {['male', 'female'].map(g => {
                                const genderItems = items.filter(t => t.gender === g);
                                if (genderItems.length === 0) return null;
                                return (
                                  <div key={g} className="mb-2">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                      {g === 'male' ? '♂ Άνδρες' : '♀ Γυναίκες'}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {genderItems.map(t => {
                                        const added = isTemplateAdded(t.id);
                                        return (
                                          <Badge key={t.id} variant={added ? "secondary" : "outline"}
                                            className={`rounded-none text-xs cursor-pointer transition-colors ${added ? 'opacity-60' : 'hover:bg-muted'}`}
                                            onClick={() => !added && !saving && handleAddFromTemplate(t)}
                                          >
                                            {added && <Check className="h-3 w-3 mr-1" />}
                                            {t.max_weight ? `-${t.max_weight}kg` : `+${t.min_weight}kg`}
                                          </Badge>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
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
                <div className="space-y-1">
                  {sortedCategoryGroups.map(group => {
                    const items = groupedCategories[group];
                    const isExpanded = expandedCategoryGroups.has(group);

                    return (
                      <div key={group} className="border rounded-none">
                        <button onClick={() => toggleCategoryGroup(group)}
                          className="w-full flex items-center justify-between p-2 hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <span className="text-sm font-medium">{group}</span>
                            <Badge variant="outline" className="rounded-none text-xs">{items.length}</Badge>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t p-2">
                            {['male', 'female'].map(g => {
                              const genderItems = items.filter(c => c.gender === g);
                              if (genderItems.length === 0) return null;
                              return (
                                <div key={g} className="mb-2">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    {g === 'male' ? '♂ Άνδρες' : '♀ Γυναίκες'}
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {genderItems.map(cat => (
                                      <div key={cat.id} className="group relative">
                                        <Badge variant="outline" className="rounded-none text-xs pr-6">
                                          {cat.max_weight ? `-${cat.max_weight}kg` : `+${cat.min_weight}kg`}
                                        </Badge>
                                        <button
                                          onClick={() => { setCategoryToDelete(cat.id); setDeleteDialogOpen(true); }}
                                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Trash2 className="h-3 w-3 text-destructive" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                            {items.filter(c => c.gender !== 'male' && c.gender !== 'female').length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Μικτή</p>
                                <div className="flex flex-wrap gap-1">
                                  {items.filter(c => c.gender !== 'male' && c.gender !== 'female').map(cat => (
                                    <div key={cat.id} className="group relative">
                                      <Badge variant="outline" className="rounded-none text-xs pr-6">{cat.name}</Badge>
                                      <button
                                        onClick={() => { setCategoryToDelete(cat.id); setDeleteDialogOpen(true); }}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
