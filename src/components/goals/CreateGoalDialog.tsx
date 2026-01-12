import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import type { UserGoal } from '@/hooks/useUserGoals';

interface CreateGoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: Omit<UserGoal, 'id' | 'created_at' | 'updated_at' | 'current_value' | 'status' | 'completed_at'>) => void;
  userId: string;
  editingGoal?: UserGoal | null;
}

const goalTypes = [
  { value: 'workout_count', label: 'Αριθμός Προπονήσεων', unit: 'προπονήσεις' },
  { value: 'weight_loss', label: 'Απώλεια Βάρους', unit: 'kg' },
  { value: 'strength_gain', label: 'Αύξηση Δύναμης', unit: 'kg' },
  { value: 'attendance', label: 'Παρουσίες', unit: 'ημέρες' },
  { value: 'custom', label: 'Προσαρμοσμένο', unit: '' },
];

export const CreateGoalDialog: React.FC<CreateGoalDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userId,
  editingGoal,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState('custom');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title);
      setDescription(editingGoal.description || '');
      setGoalType(editingGoal.goal_type);
      setTargetValue(editingGoal.target_value?.toString() || '');
      setUnit(editingGoal.unit || '');
      setTargetDate(editingGoal.target_date || '');
    } else {
      resetForm();
    }
  }, [editingGoal, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGoalType('custom');
    setTargetValue('');
    setUnit('');
    setTargetDate('');
  };

  const handleGoalTypeChange = (value: string) => {
    setGoalType(value);
    const type = goalTypes.find(t => t.value === value);
    if (type) {
      setUnit(type.unit);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      user_id: userId,
      title,
      description: description || null,
      goal_type: goalType,
      target_value: targetValue ? parseFloat(targetValue) : null,
      unit: unit || null,
      start_date: new Date().toISOString().split('T')[0],
      target_date: targetDate || null,
    });

    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingGoal ? 'Επεξεργασία Στόχου' : 'Νέος Στόχος'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Τίτλος *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="π.χ. 10 προπονήσεις τον μήνα"
              className="rounded-none"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goalType">Τύπος Στόχου</Label>
            <Select value={goalType} onValueChange={handleGoalTypeChange}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {goalTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetValue">Στόχος</Label>
              <Input
                id="targetValue"
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="π.χ. 10"
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Μονάδα</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="π.χ. kg"
                className="rounded-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Ημερομηνία Λήξης</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Περιγραφή</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Προαιρετική περιγραφή του στόχου..."
              className="rounded-none"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-none">
              Ακύρωση
            </Button>
            <Button type="submit" className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black">
              {editingGoal ? 'Αποθήκευση' : 'Δημιουργία'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
