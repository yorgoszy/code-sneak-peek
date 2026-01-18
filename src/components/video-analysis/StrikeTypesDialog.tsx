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
                <CardContent className="pt-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Όνομα *</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="π.χ. Jab, Low Kick..."
                          className="rounded-none"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label>Κατηγορία *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ 
                            ...formData, 
                            category: value as CreateStrikeType['category'] 
                          })}
                        >
                          <SelectTrigger className="rounded-none">
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
                        <Label>Πλευρά</Label>
                        <Select
                          value={formData.side || 'none'}
                          onValueChange={(value) => setFormData({ 
                            ...formData, 
                            side: value === 'none' ? null : value as CreateStrikeType['side']
                          })}
                        >
                          <SelectTrigger className="rounded-none">
                            <SelectValue placeholder="Επιλέξτε..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Χωρίς πλευρά</SelectItem>
                            <SelectItem value="left">Αριστερό</SelectItem>
                            <SelectItem value="right">Δεξί</SelectItem>
                            <SelectItem value="both">Και τα δύο</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Περιγραφή</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Προαιρετική περιγραφή..."
                        className="rounded-none"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none">
                        {editingId ? 'Ενημέρωση' : 'Αποθήκευση'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm} className="rounded-none">
                        Ακύρωση
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
              <div className="space-y-4">
                {Object.entries(groupedStrikes).map(([category, strikes]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                      <div className={`w-3 h-3 ${getCategoryColor(category)} rounded-full`} />
                      {categoryLabels[category]}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {strikes.map((strike) => (
                        <Card key={strike.id} className="rounded-none">
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={`${getCategoryColor(strike.category)} text-white rounded-none`}>
                                {strike.name}
                              </Badge>
                              {strike.side && (
                                <span className="text-xs text-gray-500">
                                  ({sideLabels[strike.side]})
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(strike)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteClick(strike.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
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
