import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Settings, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CategoryTemplate {
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

interface CategoryTemplatesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  federationId: string;
}

const getAgeGroup = (t: CategoryTemplate): string => {
  if (t.name.startsWith('Ενήλικοι')) return 'Ενήλικοι 18-40';
  if (t.name.startsWith('U23')) return 'U23 (18-23)';
  if (t.name.startsWith('Βετεράνοι') || t.name.startsWith('40+')) return 'Βετεράνοι 40+';
  if (t.name.startsWith('Νέοι 16-17')) return 'Νέοι 16-17';
  if (t.name.startsWith('Νέοι 14-15')) return 'Νέοι 14-15';
  if (t.name.startsWith('Νέοι 12-13')) return 'Νέοι 12-13';
  if (t.name.startsWith('Νέοι 10-11')) return 'Νέοι 10-11';
  if (t.name.startsWith('Νέοι 8-9')) return 'Νέοι 8-9';
  if (t.name.startsWith('Νέοι 5-7')) return 'Νέοι 5-7';
  return name;
};

const AGE_GROUP_ORDER = [
  'Ενήλικοι 18-40', 'U23 (18-23)', 'Βετεράνοι 40+', 'Νέοι 16-17', 'Νέοι 14-15',
  'Νέοι 12-13', 'Νέοι 10-11', 'Νέοι 8-9', 'Νέοι 5-7'
];

export const CategoryTemplatesDialog: React.FC<CategoryTemplatesDialogProps> = ({
  isOpen, onClose, federationId,
}) => {
  const [templates, setTemplates] = useState<CategoryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMode, setAddMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const [name, setName] = useState('');
  const [categoryType, setCategoryType] = useState('combined');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [gender, setGender] = useState('mixed');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) fetchTemplates();
  }, [isOpen, federationId]);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('federation_category_templates')
      .select('*')
      .eq('federation_id', federationId)
      .order('sort_order');

    if (error) { console.error(error); toast.error('Σφάλμα φόρτωσης'); }
    setTemplates((data as CategoryTemplate[]) || []);
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
      const { error } = await supabase.from('federation_category_templates').insert({
        federation_id: federationId, name, category_type: categoryType,
        min_age: minAge ? parseInt(minAge) : null, max_age: maxAge ? parseInt(maxAge) : null,
        min_weight: minWeight ? parseFloat(minWeight) : null, max_weight: maxWeight ? parseFloat(maxWeight) : null,
        gender, sort_order: templates.length,
      });
      if (error) throw error;
      toast.success('Η κατηγορία προστέθηκε');
      resetForm(); fetchTemplates();
    } catch (error) { console.error(error); toast.error('Σφάλμα'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    try {
      const { error } = await supabase.from('federation_category_templates').delete().eq('id', templateToDelete);
      if (error) throw error;
      toast.success('Η κατηγορία διαγράφηκε');
      setDeleteDialogOpen(false); setTemplateToDelete(null); fetchTemplates();
    } catch (error) { console.error(error); toast.error('Σφάλμα'); }
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
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
  const grouped = templates.reduce<Record<string, CategoryTemplate[]>>((acc, t) => {
    const group = getAgeGroup(t);
    (acc[group] = acc[group] || []).push(t);
    return acc;
  }, {});

  const sortedGroups = AGE_GROUP_ORDER.filter(g => grouped[g]?.length > 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Διαχείριση Κατηγοριών Αγώνων
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Δημιουργήστε κατηγορίες που θα είναι διαθέσιμες σε όλους τους αγώνες
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {!addMode && (
              <Button onClick={() => setAddMode(true)} variant="outline" className="rounded-none">
                <Plus className="h-4 w-4 mr-2" /> Νέα Κατηγορία
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
                    <div><Label>Ηλικία από</Label><Input type="number" value={minAge} onChange={e => setMinAge(e.target.value)} className="rounded-none" /></div>
                    <div><Label>Ηλικία έως</Label><Input type="number" value={maxAge} onChange={e => setMaxAge(e.target.value)} className="rounded-none" /></div>
                  </div>
                )}
                {(categoryType === 'weight' || categoryType === 'combined') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Βάρος από (kg)</Label><Input type="number" step="0.1" value={minWeight} onChange={e => setMinWeight(e.target.value)} className="rounded-none" /></div>
                    <div><Label>Βάρος έως (kg)</Label><Input type="number" step="0.1" value={maxWeight} onChange={e => setMaxWeight(e.target.value)} className="rounded-none" /></div>
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
            ) : templates.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Δεν υπάρχουν κατηγορίες.</p>
            ) : (
              <div className="space-y-2">
                {sortedGroups.map(group => {
                  const items = grouped[group];
                  const isExpanded = expandedGroups.has(group);
                  const maleCount = items.filter(t => t.gender === 'male').length;
                  const femaleCount = items.filter(t => t.gender === 'female').length;

                  return (
                    <div key={group} className="border rounded-none">
                      <button
                        onClick={() => toggleGroup(group)}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="font-semibold text-sm">{group}</span>
                          <Badge variant="outline" className="rounded-none text-xs">{items.length} κατηγορίες</Badge>
                        </div>
                        <div className="flex gap-1">
                          {maleCount > 0 && <Badge variant="outline" className="rounded-none text-xs">♂ {maleCount}</Badge>}
                          {femaleCount > 0 && <Badge variant="outline" className="rounded-none text-xs">♀ {femaleCount}</Badge>}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t">
                          {['male', 'female'].map(g => {
                            const genderItems = items.filter(t => t.gender === g);
                            if (genderItems.length === 0) return null;
                            return (
                              <div key={g} className="p-3">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  {g === 'male' ? '♂ Άνδρες' : '♀ Γυναίκες'}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {genderItems.map(t => (
                                    <div key={t.id} className="group relative">
                                      <Badge variant="outline" className="rounded-none text-xs pr-6">
                                        {t.max_weight ? `-${t.max_weight}kg` : `+${t.min_weight}kg`}
                                      </Badge>
                                      <button
                                        onClick={() => { setTemplateToDelete(t.id); setDeleteDialogOpen(true); }}
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
                          {items.filter(t => t.gender !== 'male' && t.gender !== 'female').length > 0 && (
                            <div className="p-3">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Μικτή</p>
                              <div className="flex flex-wrap gap-1">
                                {items.filter(t => t.gender !== 'male' && t.gender !== 'female').map(t => (
                                  <div key={t.id} className="group relative">
                                    <Badge variant="outline" className="rounded-none text-xs pr-6">
                                      {t.name}
                                    </Badge>
                                    <button
                                      onClick={() => { setTemplateToDelete(t.id); setDeleteDialogOpen(true); }}
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
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>Η κατηγορία θα διαγραφεί από τη λίστα προτύπων.</AlertDialogDescription>
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
