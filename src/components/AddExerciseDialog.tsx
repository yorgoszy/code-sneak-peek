
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface AddExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Κατηγορίες οργανωμένες σε σειρές
const categoryRows = [
  // Row 1: Body Part
  ["upper body", "lower body", "total body", "core", "cardio"],
  // Row 2: Movement Type
  ["push", "pull", "rotational"],
  // Row 3: Direction
  ["vertical", "horizontal", "linear", "lateral"],
  // Row 4: Stance
  ["bilateral", "unilateral", "ipsilateral"],
  // Row 5: Dominance/Anti
  ["hip dominate", "knee dominate", "antirotation", "antirotational", "antiextention", "antiflexion"],
  // Row 6: Training Type
  ["mobility", "stability", "activation", "intergration", "movement", "neural activation", "plyometric", "power", "strength", "endurance", "accesory", "oly lifting", "strongman"],
  // Row 7: Equipment - θα είναι όλα τα υπόλοιπα
];

export const AddExerciseDialog = ({ open, onOpenChange, onSuccess }: AddExerciseDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const { data, error } = await supabase
        .from('exercise_categories')
        .select('*')
        .order('type, name');

      if (error) {
        console.error('Categories fetch error:', error);
        throw error;
      }
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των κατηγοριών');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryType.trim()) {
      toast.error('Συμπληρώστε όνομα και τύπο κατηγορίας');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('exercise_categories')
        .insert({
          name: newCategoryName.trim(),
          type: newCategoryType.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('Category creation error:', error);
        throw error;
      }

      setCategories(prev => [...prev, data]);
      setNewCategoryName("");
      setNewCategoryType("");
      setShowAddCategory(false);
      toast.success('Η κατηγορία προστέθηκε επιτυχώς');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Σφάλμα κατά την προσθήκη της κατηγορίας');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Το όνομα της άσκησης είναι υποχρεωτικό');
      return;
    }

    if (selectedCategories.length === 0) {
      toast.error('Επιλέξτε τουλάχιστον μία κατηγορία');
      return;
    }

    try {
      setLoading(true);
      console.log('Creating exercise with data:', {
        name: name.trim(),
        description: description.trim() || null,
        video_url: videoUrl.trim() || null,
      });

      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercises')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          video_url: videoUrl.trim() || null,
        })
        .select()
        .single();

      if (exerciseError) {
        console.error('Exercise creation error:', exerciseError);
        throw exerciseError;
      }

      console.log('Exercise created:', exerciseData);

      const exerciseCategoryInserts = selectedCategories.map(categoryId => ({
        exercise_id: exerciseData.id,
        category_id: categoryId,
      }));

      console.log('Creating exercise categories:', exerciseCategoryInserts);

      const { error: relationError } = await supabase
        .from('exercise_to_category')
        .insert(exerciseCategoryInserts);

      if (relationError) {
        console.error('Exercise category relation error:', relationError);
        throw relationError;
      }

      toast.success('Η άσκηση προστέθηκε επιτυχώς');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error adding exercise:', error);
      toast.error(`Σφάλμα κατά την προσθήκη της άσκησης: ${error.message || 'Άγνωστο σφάλμα'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setVideoUrl("");
    setSelectedCategories([]);
    setShowAddCategory(false);
    setNewCategoryName("");
    setNewCategoryType("");
    onOpenChange(false);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Οργάνωση κατηγοριών σε σειρές
  const getCategorizedRows = () => {
    const allCategoryNames = categoryRows.flat();
    const filteredCategories = categories.filter(cat => cat.name !== "ζορ");
    
    // Βρες τις κατηγορίες για κάθε σειρά
    const rows = categoryRows.map(rowNames => 
      rowNames
        .map(name => filteredCategories.find(cat => cat.name.toLowerCase() === name.toLowerCase()))
        .filter(Boolean) as Category[]
    );
    
    // Equipment row: όλες οι κατηγορίες που δεν είναι στις προηγούμενες σειρές
    const equipmentCategories = filteredCategories.filter(cat => 
      !allCategoryNames.some(name => name.toLowerCase() === cat.name.toLowerCase())
    );
    
    return { rows, equipmentCategories };
  };

  const { rows, equipmentCategories } = getCategorizedRows();

  const rowLabels = [
    "Περιοχή Σώματος",
    "Τύπος Κίνησης",
    "Κατεύθυνση",
    "Στάση",
    "Dominance / Anti",
    "Τύπος Προπόνησης",
    "Equipment"
  ];

  // Capitalize first letter
  const formatCategoryName = (name: string) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">Προσθήκη Νέας Άσκησης</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name" className="text-xs">Όνομα *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="π.χ. Bench Press"
                className="rounded-none h-8 text-sm"
                required
              />
            </div>
            <div>
              <Label htmlFor="videoUrl" className="text-xs">URL Βίντεο</Label>
              <Input
                id="videoUrl"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className="rounded-none h-8 text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-xs">Περιγραφή</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Περιγραφή..."
              className="rounded-none resize-none text-sm"
              rows={2}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm font-medium">Κατηγορίες *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="rounded-none h-6 text-xs px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Νέα
              </Button>
            </div>

            {showAddCategory && (
              <div className="mb-3 p-2 border bg-gray-50">
                <div className="flex gap-2 items-end">
                  <Input
                    placeholder="Όνομα"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="rounded-none h-7 text-xs flex-1"
                  />
                  <Input
                    placeholder="Τύπος"
                    value={newCategoryType}
                    onChange={(e) => setNewCategoryType(e.target.value)}
                    className="rounded-none h-7 text-xs flex-1"
                  />
                  <Button type="button" size="sm" onClick={handleAddCategory} className="rounded-none h-7 text-xs px-2">
                    OK
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddCategory(false)} className="rounded-none h-7 text-xs px-2">
                    ✕
                  </Button>
                </div>
              </div>
            )}

            {loadingCategories ? (
              <p className="text-xs text-gray-500">Φόρτωση...</p>
            ) : (
              <div className="space-y-2">
                {rows.map((rowCategories, rowIndex) => (
                  rowCategories.length > 0 && (
                    <div key={rowIndex} className="border-b pb-2">
                      <h4 className="text-[10px] font-medium text-gray-500 mb-1">{rowLabels[rowIndex]}</h4>
                      <div className="flex flex-wrap gap-1">
                        {rowCategories.map(category => (
                          <div 
                            key={category.id} 
                            className={`px-2 py-0.5 border cursor-pointer transition-colors hover:bg-gray-100 ${
                              selectedCategories.includes(category.id) 
                                ? 'bg-blue-50 border-blue-400 text-blue-700' 
                                : 'bg-white border-gray-200'
                            }`}
                            onClick={() => handleCategoryClick(category.id)}
                          >
                            <span className="text-xs select-none">{formatCategoryName(category.name)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
                
                {/* Equipment Row */}
                {equipmentCategories.length > 0 && (
                  <div className="border-b pb-2">
                    <h4 className="text-[10px] font-medium text-gray-500 mb-1">{rowLabels[6]}</h4>
                    <div className="flex flex-wrap gap-1">
                      {equipmentCategories.map(category => (
                        <div 
                          key={category.id} 
                          className={`px-2 py-0.5 border cursor-pointer transition-colors hover:bg-gray-100 ${
                            selectedCategories.includes(category.id) 
                              ? 'bg-blue-50 border-blue-400 text-blue-700' 
                              : 'bg-white border-gray-200'
                          }`}
                          onClick={() => handleCategoryClick(category.id)}
                        >
                          <span className="text-xs select-none">{formatCategoryName(category.name)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selected categories summary */}
            {selectedCategories.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 border text-xs">
                <span className="font-medium text-blue-900">Επιλεγμένες ({selectedCategories.length}): </span>
                {selectedCategories.map(categoryId => {
                  const category = categories.find(c => c.id === categoryId);
                  return category ? formatCategoryName(category.name) : null;
                }).filter(Boolean).join(', ')}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={handleClose} className="rounded-none h-8">
              Ακύρωση
            </Button>
            <Button type="submit" size="sm" disabled={loading || loadingCategories} className="rounded-none h-8">
              {loading ? 'Προσθήκη...' : 'Προσθήκη'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
