
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export const AddExerciseDialog = ({ open, onOpenChange, onSuccess }: AddExerciseDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

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
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των κατηγοριών');
    } finally {
      setLoadingCategories(false);
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

      // Insert the exercise
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercises')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          video_url: videoUrl.trim() || null,
        })
        .select()
        .single();

      if (exerciseError) throw exerciseError;

      // Insert the exercise-category relationships
      const exerciseCategoryInserts = selectedCategories.map(categoryId => ({
        exercise_id: exerciseData.id,
        category_id: categoryId,
      }));

      const { error: relationError } = await supabase
        .from('exercise_to_category')
        .insert(exerciseCategoryInserts);

      if (relationError) throw relationError;

      toast.success('Η άσκηση προστέθηκε επιτυχώς');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error adding exercise:', error);
      toast.error('Σφάλμα κατά την προσθήκη της άσκησης');
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

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryId]);
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Προσθήκη Νέας Άσκησης</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <Label className="text-base font-medium">Κατηγορίες *</Label>
            {loadingCategories ? (
              <p className="text-sm text-gray-500 mt-2">Φόρτωση κατηγοριών...</p>
            ) : (
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={category.id}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={(checked) => 
                        handleCategoryChange(category.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={category.id} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {category.name}
                      <span className="text-gray-500 ml-1">({category.type})</span>
                    </Label>
                  </div>
                ))}
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
