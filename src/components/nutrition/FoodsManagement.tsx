import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Search, Utensils, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Food {
  id: string;
  name: string;
  category: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number | null;
  portion_size: number | null;
  portion_unit: string | null;
}

const FOOD_CATEGORIES = [
  { value: 'protein', label: 'Πρωτεΐνες' },
  { value: 'carbs', label: 'Υδατάνθρακες' },
  { value: 'vegetables', label: 'Λαχανικά' },
  { value: 'fruits', label: 'Φρούτα' },
  { value: 'dairy', label: 'Γαλακτοκομικά' },
  { value: 'fats', label: 'Λίπη' },
  { value: 'snacks', label: 'Σνακ' },
  { value: 'beverages', label: 'Ποτά' },
  { value: 'general', label: 'Γενικά' },
];

export const FoodsManagement: React.FC = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'general',
    calories_per_100g: '',
    protein_per_100g: '',
    carbs_per_100g: '',
    fat_per_100g: '',
    fiber_per_100g: '',
    portion_size: '100',
    portion_unit: 'g'
  });

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .order('name');

      if (error) throw error;
      setFoods(data || []);
    } catch (error) {
      console.error('Error fetching foods:', error);
      toast.error('Σφάλμα κατά τη φόρτωση φαγητών');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Εισάγετε όνομα φαγητού');
      return;
    }

    try {
      const foodData = {
        name: formData.name.trim(),
        category: formData.category,
        calories_per_100g: parseFloat(formData.calories_per_100g) || 0,
        protein_per_100g: parseFloat(formData.protein_per_100g) || 0,
        carbs_per_100g: parseFloat(formData.carbs_per_100g) || 0,
        fat_per_100g: parseFloat(formData.fat_per_100g) || 0,
        fiber_per_100g: parseFloat(formData.fiber_per_100g) || 0,
        portion_size: parseFloat(formData.portion_size) || 100,
        portion_unit: formData.portion_unit || 'g'
      };

      if (editingFood) {
        const { error } = await supabase
          .from('foods')
          .update(foodData)
          .eq('id', editingFood.id);

        if (error) throw error;
        toast.success('Το φαγητό ενημερώθηκε');
      } else {
        const { error } = await supabase
          .from('foods')
          .insert([foodData]);

        if (error) throw error;
        toast.success('Το φαγητό προστέθηκε');
      }

      resetForm();
      fetchFoods();
    } catch (error) {
      console.error('Error saving food:', error);
      toast.error('Σφάλμα κατά την αποθήκευση');
    }
  };

  const handleDelete = async (foodId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το φαγητό;')) return;

    try {
      const { error } = await supabase
        .from('foods')
        .delete()
        .eq('id', foodId);

      if (error) throw error;
      
      setFoods(prev => prev.filter(f => f.id !== foodId));
      toast.success('Το φαγητό διαγράφηκε');
    } catch (error) {
      console.error('Error deleting food:', error);
      toast.error('Σφάλμα κατά τη διαγραφή');
    }
  };

  const handleEdit = (food: Food) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      category: food.category || 'general',
      calories_per_100g: food.calories_per_100g.toString(),
      protein_per_100g: food.protein_per_100g.toString(),
      carbs_per_100g: food.carbs_per_100g.toString(),
      fat_per_100g: food.fat_per_100g.toString(),
      fiber_per_100g: (food.fiber_per_100g || 0).toString(),
      portion_size: (food.portion_size || 100).toString(),
      portion_unit: food.portion_unit || 'g'
    });
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'general',
      calories_per_100g: '',
      protein_per_100g: '',
      carbs_per_100g: '',
      fat_per_100g: '',
      fiber_per_100g: '',
      portion_size: '100',
      portion_unit: 'g'
    });
    setEditingFood(null);
    setIsAddDialogOpen(false);
  };

  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (category: string | null) => {
    return FOOD_CATEGORIES.find(c => c.value === category)?.label || category || 'Γενικά';
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Φόρτωση φαγητών...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Αναζήτηση φαγητού..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-none"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px] rounded-none">
              <SelectValue placeholder="Κατηγορία" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all">Όλες οι κατηγορίες</SelectItem>
              {FOOD_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setIsAddDialogOpen(true)} 
            className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Νέο Φαγητό
          </Button>
        </div>

        {filteredFoods.length === 0 ? (
          <Card className="rounded-none">
            <CardContent className="p-8 text-center">
              <Utensils className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Δεν βρέθηκαν φαγητά
              </h3>
              <p className="text-gray-500">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Δοκιμάστε διαφορετικά κριτήρια αναζήτησης' 
                  : 'Προσθέστε το πρώτο σας φαγητό'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredFoods.map((food) => (
              <Card key={food.id} className="rounded-none">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{food.name}</h4>
                      <Badge variant="outline" className="rounded-none text-xs mt-1">
                        {getCategoryLabel(food.category)}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(food)}
                        className="rounded-none h-7 w-7 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(food.id)}
                        className="rounded-none h-7 w-7 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-center text-xs mt-3">
                    <div className="bg-gray-50 p-2 rounded-none">
                      <div className="font-semibold text-[#00ffba]">{food.calories_per_100g}</div>
                      <div className="text-gray-500">kcal</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-none">
                      <div className="font-semibold text-blue-600">{food.protein_per_100g}g</div>
                      <div className="text-gray-500">Π</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-none">
                      <div className="font-semibold text-orange-600">{food.carbs_per_100g}g</div>
                      <div className="text-gray-500">Υ</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-none">
                      <div className="font-semibold text-yellow-600">{food.fat_per_100g}g</div>
                      <div className="text-gray-500">Λ</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    ανά {food.portion_size || 100}{food.portion_unit || 'g'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle>
              {editingFood ? 'Επεξεργασία Φαγητού' : 'Νέο Φαγητό'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Όνομα</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="π.χ. Κοτόπουλο στήθος"
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Κατηγορία</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {FOOD_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Θερμίδες (kcal)</Label>
                <Input
                  type="number"
                  value={formData.calories_per_100g}
                  onChange={(e) => setFormData(prev => ({ ...prev, calories_per_100g: e.target.value }))}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Πρωτεΐνη (g)</Label>
                <Input
                  type="number"
                  value={formData.protein_per_100g}
                  onChange={(e) => setFormData(prev => ({ ...prev, protein_per_100g: e.target.value }))}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Υδατάνθρακες (g)</Label>
                <Input
                  type="number"
                  value={formData.carbs_per_100g}
                  onChange={(e) => setFormData(prev => ({ ...prev, carbs_per_100g: e.target.value }))}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Λίπη (g)</Label>
                <Input
                  type="number"
                  value={formData.fat_per_100g}
                  onChange={(e) => setFormData(prev => ({ ...prev, fat_per_100g: e.target.value }))}
                  className="rounded-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={resetForm} className="flex-1 rounded-none">
                Ακύρωση
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
              >
                {editingFood ? 'Αποθήκευση' : 'Προσθήκη'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
