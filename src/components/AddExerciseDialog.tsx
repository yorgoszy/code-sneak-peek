
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Προσθήκη Νέας Άσκησης</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Όνομα Άσκησης *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="π.χ. Bench Press"
                className="rounded-none"
                required
              />
            </div>

            <div>
              <Label htmlFor="videoUrl">URL Βίντεο</Label>
              <Input
                id="videoUrl"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="rounded-none"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Περιγραφή</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Περιγραφή της άσκησης..."
              className="rounded-none resize-none"
              rows={3}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <Label className="text-lg font-semibold">Κατηγορίες *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="rounded-none"
              >
                <Plus className="h-4 w-4 mr-1" />
                Νέα Κατηγορία
              </Button>
            </div>

            {showAddCategory && (
              <div className="mb-6 p-4 border bg-gray-50">
                <div className="space-y-3">
                  <Input
                    placeholder="Όνομα κατηγορίας"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="rounded-none"
                  />
                  <Input
                    placeholder="Τύπος κατηγορίας (π.χ. upper body)"
                    value={newCategoryType}
                    onChange={(e) => setNewCategoryType(e.target.value)}
                    className="rounded-none"
                  />
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCategory}
                      className="rounded-none"
                    >
                      Προσθήκη
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddCategory(false)}
                      className="rounded-none"
                    >
                      Ακύρωση
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {loadingCategories ? (
              <p className="text-sm text-gray-500 mt-2">Φόρτωση κατηγοριών...</p>
            ) : (
              <div className="space-y-4">
                {rows.map((rowCategories, rowIndex) => (
                  rowCategories.length > 0 && (
                    <div key={rowIndex} className="border-b pb-3">
                      <h4 className="text-xs font-medium text-gray-500 mb-2">{rowLabels[rowIndex]}</h4>
                      <div className="flex flex-wrap gap-2">
                        {rowCategories.map(category => (
                          <div 
                            key={category.id} 
                            className={`px-3 py-1.5 border cursor-pointer transition-colors hover:bg-gray-100 ${
                              selectedCategories.includes(category.id) 
                                ? 'bg-blue-50 border-blue-400 text-blue-700' 
                                : 'bg-white border-gray-200'
                            }`}
                            onClick={() => handleCategoryClick(category.id)}
                          >
                            <span className="text-sm select-none">{category.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
                
                {/* Equipment Row */}
                {equipmentCategories.length > 0 && (
                  <div className="border-b pb-3">
                    <h4 className="text-xs font-medium text-gray-500 mb-2">{rowLabels[6]}</h4>
                    <div className="flex flex-wrap gap-2">
                      {equipmentCategories.map(category => (
                        <div 
                          key={category.id} 
                          className={`px-3 py-1.5 border cursor-pointer transition-colors hover:bg-gray-100 ${
                            selectedCategories.includes(category.id) 
                              ? 'bg-blue-50 border-blue-400 text-blue-700' 
                              : 'bg-white border-gray-200'
                          }`}
                          onClick={() => handleCategoryClick(category.id)}
                        >
                          <span className="text-sm select-none">{category.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show selected categories summary */}
            {selectedCategories.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border">
                <h4 className="font-medium text-sm text-blue-900 mb-2">
                  Επιλεγμένες Κατηγορίες ({selectedCategories.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {selectedCategories.map(categoryId => {
                    const category = categories.find(c => c.id === categoryId);
                    return category ? (
                      <span 
                        key={categoryId}
                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1"
                      >
                        {category.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="rounded-none"
            >
              Ακύρωση
            </Button>
            <Button 
              type="submit" 
              disabled={loading || loadingCategories}
              className="rounded-none"
            >
              {loading ? 'Προσθήκη...' : 'Προσθήκη'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
