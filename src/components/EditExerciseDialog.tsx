
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { categoryRows } from "@/utils/categoryRows";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  categories: { name: string; type: string }[];
}

interface EditExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: Exercise | null;
  onSuccess: () => void;
}

const rowLabels = [
  "Περιοχή Σώματος",
  "Τύπος Κίνησης",
  "Κατεύθυνση",
  "Στάση",
  "Dominance / Anti",
  "Τύπος Προπόνησης",
  "Equipment"
];

export const EditExerciseDialog = ({ open, onOpenChange, exercise, onSuccess }: EditExerciseDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    if (open && exercise) {
      setName(exercise.name);
      setDescription(exercise.description || "");
      setVideoUrl(exercise.video_url || "");
      fetchCategories();
    }
  }, [open, exercise]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      
      // Fetch all categories
      const { data: allCategories, error: categoriesError } = await supabase
        .from('exercise_categories')
        .select('*')
        .order('type, name');

      if (categoriesError) throw categoriesError;
      setCategories(allCategories || []);

      // Fetch exercise's current categories
      if (exercise) {
        const { data: exerciseCategories, error: exerciseCategoriesError } = await supabase
          .from('exercise_to_category')
          .select('category_id')
          .eq('exercise_id', exercise.id);

        if (exerciseCategoriesError) throw exerciseCategoriesError;
        setSelectedCategories(exerciseCategories?.map(ec => ec.category_id) || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των κατηγοριών');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!exercise) return;
    
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

      // Update exercise
      const { error: exerciseError } = await supabase
        .from('exercises')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          video_url: videoUrl.trim() || null,
        })
        .eq('id', exercise.id);

      if (exerciseError) throw exerciseError;

      // Delete existing category relationships
      const { error: deleteError } = await supabase
        .from('exercise_to_category')
        .delete()
        .eq('exercise_id', exercise.id);

      if (deleteError) throw deleteError;

      // Insert new category relationships
      const exerciseCategoryInserts = selectedCategories.map(categoryId => ({
        exercise_id: exercise.id,
        category_id: categoryId,
      }));

      const { error: relationError } = await supabase
        .from('exercise_to_category')
        .insert(exerciseCategoryInserts);

      if (relationError) throw relationError;

      toast.success('Η άσκηση ενημερώθηκε επιτυχώς');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error updating exercise:', error);
      toast.error('Σφάλμα κατά την ενημέρωση της άσκησης');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setVideoUrl("");
    setSelectedCategories([]);
    onOpenChange(false);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Organize categories into rows
  const getCategorizedRows = () => {
    const allCategoryNames = categoryRows.flat();
    const filteredCategories = categories.filter(cat => cat.name !== "ζορ");
    
    const rows = categoryRows.map(rowNames => 
      rowNames
        .map(name => filteredCategories.find(cat => cat.name.toLowerCase() === name.toLowerCase()))
        .filter(Boolean) as Category[]
    );
    
    // Equipment row: all categories not in previous rows
    const equipmentCategories = filteredCategories.filter(cat => 
      !allCategoryNames.some(name => name.toLowerCase() === cat.name.toLowerCase())
    );
    
    return { rows, equipmentCategories };
  };

  const { rows, equipmentCategories } = getCategorizedRows();

  if (!exercise) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Επεξεργασία Άσκησης</DialogTitle>
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
            <Label className="text-lg font-semibold">Κατηγορίες *</Label>

            {loadingCategories ? (
              <p className="text-sm text-gray-500 mt-2">Φόρτωση κατηγοριών...</p>
            ) : (
              <div className="space-y-4 mt-4">
                {rows.map((rowCategories, rowIndex) => (
                  rowCategories.length > 0 && (
                    <div key={rowIndex} className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {rowLabels[rowIndex]}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {rowCategories.map(category => (
                          <div 
                            key={category.id} 
                            className={`px-3 py-2 border cursor-pointer transition-colors hover:bg-gray-100 ${
                              selectedCategories.includes(category.id) 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-white border-gray-200'
                            }`}
                            onClick={() => handleCategoryClick(category.id)}
                          >
                            <span className="text-sm select-none font-medium">
                              {category.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
                
                {/* Equipment Row */}
                {equipmentCategories.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Equipment
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {equipmentCategories.map(category => (
                        <div 
                          key={category.id} 
                          className={`px-3 py-2 border cursor-pointer transition-colors hover:bg-gray-100 ${
                            selectedCategories.includes(category.id) 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-white border-gray-200'
                          }`}
                          onClick={() => handleCategoryClick(category.id)}
                        >
                          <span className="text-sm select-none font-medium">
                            {category.name}
                          </span>
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
              {loading ? 'Ενημέρωση...' : 'Ενημέρωση'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
