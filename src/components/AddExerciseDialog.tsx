
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
  ["upper body", "lower body", "total body"],
  // Row 2: Movement Type
  ["push", "pull", "rotational", "antirotation", "antirotational", "antiextention", "antiflexion"],
  // Row 3: Direction
  ["vertical", "horizontal", "linear", "lateral"],
  // Row 4: Stance
  ["bilateral", "unilateral", "ipsilateral"],
  // Row 5: Dominance
  ["hip dominate", "knee dominate"],
  // Row 6: Training Type
  ["mobility", "stability", "activation", "intergration", "movement", "neural activation", "plyometric", "power", "strength", "endurance", "accesory", "oly lifting", "strongman", "core", "cardio"],
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
    "Dominance",
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
      <DialogContent className="w-[95vw] max-w-3xl p-3 sm:p-4 max-h-[90vh] overflow-y-auto rounded-none">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-sm">Προσθήκη Νέας Άσκησης</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-1.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label htmlFor="name" className="text-[10px]">Όνομα *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="π.χ. Bench Press"
                className="rounded-none h-8 sm:h-7 text-xs"
                required
              />
            </div>
            <div>
              <Label htmlFor="videoUrl" className="text-[10px]">URL Βίντεο</Label>
              <Input
                id="videoUrl"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className="rounded-none h-8 sm:h-7 text-xs"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-[10px]">Περιγραφή</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Περιγραφή..."
              className="rounded-none resize-none text-xs py-1 min-h-0"
              rows={1}
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Κατηγορίες *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="rounded-none h-6 sm:h-5 text-[10px] px-2 sm:px-1.5"
              >
                <Plus className="h-3 w-3 sm:h-2.5 sm:w-2.5 mr-0.5" />
                Νέα
              </Button>
            </div>

            {showAddCategory && (
              <div className="mt-1 p-2 sm:p-1.5 border bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-1.5 sm:items-end">
                  <Input
                    placeholder="Όνομα"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="rounded-none h-8 sm:h-6 text-xs sm:text-[10px] flex-1"
                  />
                  <Input
                    placeholder="Τύπος"
                    value={newCategoryType}
                    onChange={(e) => setNewCategoryType(e.target.value)}
                    className="rounded-none h-8 sm:h-6 text-xs sm:text-[10px] flex-1"
                  />
                  <div className="flex gap-1.5">
                    <Button type="button" size="sm" onClick={handleAddCategory} className="rounded-none h-8 sm:h-6 text-xs sm:text-[10px] px-3 sm:px-1.5 flex-1 sm:flex-none">
                      OK
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddCategory(false)} className="rounded-none h-8 sm:h-6 text-xs sm:text-[10px] px-3 sm:px-1.5 flex-1 sm:flex-none">
                      ✕
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {loadingCategories ? (
              <p className="text-[10px] text-gray-500">Φόρτωση...</p>
            ) : (
              <div className="space-y-1.5 sm:space-y-1 mt-1">
                {rows.map((rowCategories, rowIndex) => (
                  rowCategories.length > 0 && (
                    <div key={rowIndex} className="border-b pb-1">
                      <h4 className="text-[10px] sm:text-[9px] font-medium text-gray-500 mb-0.5">{rowLabels[rowIndex]}</h4>
                      <div className="flex flex-wrap gap-1 sm:gap-0.5">
                        {rowCategories.map(category => (
                          <div 
                            key={category.id} 
                            className={`px-2 sm:px-1.5 py-0.5 sm:py-0 border cursor-pointer transition-colors hover:bg-gray-100 ${
                              selectedCategories.includes(category.id) 
                                ? 'bg-blue-50 border-blue-400 text-blue-700' 
                                : 'bg-white border-gray-200'
                            }`}
                            onClick={() => handleCategoryClick(category.id)}
                          >
                            <span className="text-[11px] sm:text-[10px] select-none leading-tight">{formatCategoryName(category.name)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
                
                {/* Equipment Row */}
                {equipmentCategories.length > 0 && (
                  <div className="border-b pb-1">
                    <h4 className="text-[10px] sm:text-[9px] font-medium text-gray-500 mb-0.5">{rowLabels[6]}</h4>
                    <div className="flex flex-wrap gap-1 sm:gap-0.5">
                      {equipmentCategories.map(category => (
                        <div 
                          key={category.id} 
                          className={`px-2 sm:px-1.5 py-0.5 sm:py-0 border cursor-pointer transition-colors hover:bg-gray-100 ${
                            selectedCategories.includes(category.id) 
                              ? 'bg-blue-50 border-blue-400 text-blue-700' 
                              : 'bg-white border-gray-200'
                          }`}
                          onClick={() => handleCategoryClick(category.id)}
                        >
                          <span className="text-[11px] sm:text-[10px] select-none leading-tight">{formatCategoryName(category.name)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selected categories summary */}
            {selectedCategories.length > 0 && (
              <div className="mt-1 p-1.5 sm:p-1 bg-blue-50 border text-[11px] sm:text-[10px]">
                <span className="font-medium text-blue-900">Επιλεγμένες ({selectedCategories.length}): </span>
                {selectedCategories.map(categoryId => {
                  const category = categories.find(c => c.id === categoryId);
                  return category ? formatCategoryName(category.name) : null;
                }).filter(Boolean).join(', ')}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 sm:gap-1.5 pt-2 sm:pt-1">
            <Button type="button" variant="outline" size="sm" onClick={handleClose} className="rounded-none h-9 sm:h-7 text-xs px-4 sm:px-3">
              Ακύρωση
            </Button>
            <Button type="submit" size="sm" disabled={loading || loadingCategories} className="rounded-none h-9 sm:h-7 text-xs px-4 sm:px-3">
              {loading ? 'Προσθήκη...' : 'Προσθήκη'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
