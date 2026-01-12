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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TrendingDown, 
  Dumbbell, 
  Calendar, 
  Zap, 
  ArrowUp,
  Timer,
  Activity,
  Scale
} from 'lucide-react';
import { UserSearchCombobox } from '@/components/users/UserSearchCombobox';
import type { UserGoalWithUser } from '@/hooks/useAllActiveGoals';

interface CreateGoalDialogWithUserSelectProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: any) => void;
  editingGoal?: UserGoalWithUser | null;
  coachId?: string;
}

const goalTypes = [
  { value: 'weight_loss', label: 'Απώλεια Βάρους', unit: 'kg', icon: TrendingDown, description: 'Παρακολούθηση από σωματομετρικά τεστ' },
  { value: 'strength_gain', label: 'Αύξηση Δύναμης', unit: 'kg', icon: Dumbbell, description: 'Παρακολούθηση από Force/Velocity profile' },
  { value: 'endurance_gain', label: 'Αύξηση Αντοχής', unit: 'km/h', icon: Zap, description: 'Παρακολούθηση από MAS test' },
  { value: 'jump_gain', label: 'Αύξηση Άλματος', unit: 'cm', icon: ArrowUp, description: 'Παρακολούθηση από αλτικό προφίλ' },
  { value: 'sprint_gain', label: 'Αύξηση Sprint', unit: 'sec', icon: Timer, description: 'Παρακολούθηση από τεστ σπριντ' },
  { value: 'functional_gain', label: 'Αύξηση Λειτουργικότητας', unit: 'points', icon: Activity, description: 'Παρακολούθηση από FMS test' },
  { value: 'body_composition', label: 'Αλλαγή Σύστασης Σώματος', unit: '', icon: Scale, description: 'Λίπος↓ Μυς↑ Οστά↑ Σπλαχνικό↓' },
  { value: 'attendance', label: 'Παρουσίες', unit: 'ημέρες', icon: Calendar, description: 'Παρακολούθηση προπονήσεων' },
  { value: 'custom', label: 'Προσαρμοσμένο', unit: '', icon: null, description: 'Δικός σας στόχος' },
];

export const CreateGoalDialogWithUserSelect: React.FC<CreateGoalDialogWithUserSelectProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingGoal,
  coachId,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState('weight_loss');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [attendanceSource, setAttendanceSource] = useState<'programs' | 'bookings'>('programs');

  useEffect(() => {
    if (editingGoal) {
      setSelectedUserId(editingGoal.user_id);
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
    setSelectedUserId('');
    setTitle('');
    setDescription('');
    setGoalType('weight_loss');
    setTargetValue('');
    setUnit('');
    setTargetDate('');
    setAttendanceSource('programs');
  };

  const handleGoalTypeChange = (value: string) => {
    setGoalType(value);
    const type = goalTypes.find(t => t.value === value);
    if (type) {
      setUnit(type.unit);
      if (!editingGoal) {
        setTitle(type.label);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId && !editingGoal) {
      return;
    }
    
    onSubmit({
      user_id: selectedUserId || editingGoal?.user_id,
      title,
      description: description || null,
      goal_type: goalType,
      target_value: targetValue ? parseFloat(targetValue) : null,
      unit: unit || null,
      start_date: new Date().toISOString().split('T')[0],
      target_date: targetDate || null,
      attendance_source: goalType === 'attendance' ? attendanceSource : undefined,
    });

    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">
            {editingGoal ? 'Επεξεργασία Στόχου' : 'Νέος Στόχος'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* User Selection - Only for new goals */}
          {!editingGoal && (
            <div className="space-y-1.5">
              <Label className="text-xs">Αθλητής *</Label>
              <UserSearchCombobox
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                placeholder="Επιλέξτε αθλητή..."
                coachId={coachId}
              />
            </div>
          )}

          {/* Goal Type Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs">Τύπος Στόχου</Label>
            <Select value={goalType} onValueChange={handleGoalTypeChange}>
              <SelectTrigger className="rounded-none h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none max-h-60">
                {goalTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="py-2">
                    <div className="flex items-center gap-2">
                      {type.icon && <type.icon className="w-4 h-4 text-[#00ffba]" />}
                      <div>
                        <div className="text-sm font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Attendance Source Selection */}
          {goalType === 'attendance' && (
            <div className="space-y-1.5 p-3 bg-muted/50 border">
              <Label className="text-xs font-medium">Πηγή Μέτρησης Παρουσιών</Label>
              <RadioGroup 
                value={attendanceSource} 
                onValueChange={(v) => setAttendanceSource(v as 'programs' | 'bookings')}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="programs" id="programs" />
                  <Label htmlFor="programs" className="text-sm cursor-pointer">
                    Από Ημερολόγιο Προπονήσεων
                    <span className="block text-xs text-muted-foreground">
                      Μετράει τις προπονήσεις που ολοκληρώθηκαν/χάθηκαν
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bookings" id="bookings" />
                  <Label htmlFor="bookings" className="text-sm cursor-pointer">
                    Από Επισκέψεις (Bookings)
                    <span className="block text-xs text-muted-foreground">
                      Μετράει τις κρατήσεις στο γυμναστήριο
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs">Τίτλος</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="π.χ. Απώλεια 5kg"
              className="rounded-none h-9 text-sm"
              required
            />
          </div>

          {/* Target Value & Unit - Only for certain goal types */}
          {(goalType === 'custom' || goalType === 'attendance') && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Στόχος</Label>
                <Input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="π.χ. 10"
                  className="rounded-none h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Μονάδα</Label>
                <Input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="π.χ. kg"
                  className="rounded-none h-9 text-sm"
                />
              </div>
            </div>
          )}

          {/* Target Date */}
          <div className="space-y-1.5">
            <Label className="text-xs">Ημερομηνία Λήξης</Label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="rounded-none h-9 text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs">Σημειώσεις (προαιρετικά)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Προαιρετική περιγραφή..."
              className="rounded-none text-sm min-h-[60px]"
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-none h-9 text-sm">
              Ακύρωση
            </Button>
            <Button 
              type="submit" 
              className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black h-9 text-sm"
              disabled={!editingGoal && !selectedUserId}
            >
              {editingGoal ? 'Αποθήκευση' : 'Δημιουργία'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
