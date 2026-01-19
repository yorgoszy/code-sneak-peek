import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Target, Loader2 } from 'lucide-react';
import { useStrikeTypes, categoryLabels, sideLabels, StrikeType, CreateStrikeType } from '@/hooks/useStrikeTypes';

interface StrikeTypesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  coachId: string | null;
}

export const StrikeTypesDialog: React.FC<StrikeTypesDialogProps> = ({
  isOpen,
  onClose,
  coachId,
}) => {
  const { strikeTypes, loading, createStrikeType, updateStrikeType, deleteStrikeType } = useStrikeTypes(coachId);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateStrikeType>({
    name: '',
    category: 'punch',
    side: null,
    description: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'punch',
      side: null,
      description: '',
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (strikeType: StrikeType) => {
    setFormData({
      name: strikeType.name,
      category: strikeType.category,
      side: strikeType.side,
      description: strikeType.description || '',
    });
    setEditingId(strikeType.id);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    if (editingId) {
      await updateStrikeType(editingId, formData);
    } else {
      await createStrikeType(formData);
    }
    
    resetForm();
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteStrikeType(deleteId);
      setDeleteId(null);
    }
    setDeleteDialogOpen(false);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      punch: 'bg-red-500',
      kick: 'bg-blue-500',
      knee: 'bg-yellow-500',
      elbow: 'bg-purple-500',
      combo: 'bg-[#00ffba]',
      combo_kick_finish: 'bg-[#cb8954]',
    };
    return colors[category] || 'bg-gray-500';
  };

  // Group by category
  const groupedStrikes = strikeTypes.reduce((acc, strike) => {
    if (!acc[strike.category]) {
      acc[strike.category] = [];
    }
    acc[strike.category].push(strike);
    return acc;
  }, {} as Record<string, StrikeType[]>);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Διαχείριση Τύπων Χτυπημάτων
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add New Button */}
            {!isFormOpen && (
              <Button
                onClick={() => setIsFormOpen(true)}
                className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                <Plus className="w-4 h-4 mr-2" />
                Προσθήκη Νέου Χτυπήματος
              </Button>
            )}

            {/* Form */}
            {isFormOpen && (
              <Card className="rounded-none border-2 border-[#00ffba]">
                <CardContent className="p-3">
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Όνομα *</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="π.χ. Jab"
                          className="rounded-none h-9"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Κατηγορία *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ 
                            ...formData, 
                            category: value as CreateStrikeType['category'] 
                          })}
                        >
                          <SelectTrigger className="rounded-none h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="punch">Γροθιά</SelectItem>
                            <SelectItem value="kick">Κλωτσιά</SelectItem>
                            <SelectItem value="knee">Γόνατο</SelectItem>
                            <SelectItem value="elbow">Αγκώνας</SelectItem>
                            <SelectItem value="combo">Κόμπο</SelectItem>
                            <SelectItem value="combo_kick_finish">Κόμπο + Πόδι</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Πλευρά</Label>
                        <Select
                          value={formData.side || 'none'}
                          onValueChange={(value) => setFormData({ 
                            ...formData, 
                            side: value === 'none' ? null : value as CreateStrikeType['side']
                          })}
                        >
                          <SelectTrigger className="rounded-none h-9">
                            <SelectValue placeholder="Επιλέξτε..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-</SelectItem>
                            <SelectItem value="left">Αριστερό</SelectItem>
                            <SelectItem value="right">Δεξί</SelectItem>
                            <SelectItem value="both">Και τα δύο</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={resetForm} className="rounded-none h-8 text-xs">
                        Ακύρωση
                      </Button>
                      <Button type="submit" className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none h-8 text-xs">
                        {editingId ? 'Ενημέρωση' : 'Αποθήκευση'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Strike Types List */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#00ffba]" />
              </div>
            ) : strikeTypes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Δεν έχετε δημιουργήσει χτυπήματα ακόμα
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(groupedStrikes).map(([category, strikes]) => (
                  <div key={category} className="border border-gray-200 rounded-none p-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-2 h-2 ${getCategoryColor(category)} rounded-full`} />
                      <span className="text-xs font-semibold text-gray-600">{categoryLabels[category]}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                      {strikes.map((strike) => (
                        <div 
                          key={strike.id} 
                          className="flex items-center justify-between bg-gray-50 border border-gray-200 px-1.5 py-0.5 group hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <Badge className={`${getCategoryColor(strike.category)} text-white rounded-none text-[10px] px-1.5 py-0 shrink-0`}>
                              {strike.name}
                            </Badge>
                            {strike.side && (
                              <span className="text-[9px] text-gray-500 truncate">
                                ({sideLabels[strike.side]})
                              </span>
                            )}
                          </div>
                          <div className="flex shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(strike)}
                              className="h-5 w-5 p-0 opacity-50 hover:opacity-100"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteClick(strike.id)}
                              className="h-5 w-5 p-0 opacity-50 hover:opacity-100 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>
              Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90 rounded-none"
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
