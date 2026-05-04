import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { UserSearchCombobox } from '@/components/users/UserSearchCombobox';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useSafeCoachContext } from '@/contexts/CoachContext';

interface Fight {
  id: string;
  user_id?: string | null;
  opponent_name: string | null;
  fight_date: string;
  result: string | null;
  fight_type: string | null;
  total_rounds: number | null;
  round_duration_seconds: number | null;
  location: string | null;
  weight_class: string | null;
  notes: string | null;
  video_url: string | null;
  our_corner?: 'red' | 'blue' | null;
}

interface FightEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fight: Fight | null;
  onSave: () => void;
}

export const FightEditDialog: React.FC<FightEditDialogProps> = ({
  isOpen,
  onClose,
  fight,
  onSave,
}) => {
  const { userProfile, isAdmin } = useRoleCheck();
  const coachContext = useSafeCoachContext();
  // Admins see ALL users (no coach filter)
  const isAdminUser = isAdmin();
  const coachId = isAdminUser ? null : (coachContext?.coachId || userProfile?.id || null);

  const [formData, setFormData] = useState({
    user_id: '',
    our_corner: 'red' as 'red' | 'blue',
    opponent_name: '',
    fight_date: '',
    result: '',
    fight_type: '',
    total_rounds: '',
    round_duration_seconds: '',
    location: '',
    weight_class: '',
    notes: '',
    video_url: '',
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (fight) {
      setFormData({
        user_id: fight.user_id || '',
        our_corner: (fight.our_corner === 'blue' ? 'blue' : 'red'),
        opponent_name: fight.opponent_name || '',
        fight_date: fight.fight_date || '',
        result: fight.result || '',
        fight_type: fight.fight_type || '',
        total_rounds: fight.total_rounds?.toString() || '',
        round_duration_seconds: fight.round_duration_seconds?.toString() || '',
        location: fight.location || '',
        weight_class: fight.weight_class || '',
        notes: fight.notes || '',
        video_url: fight.video_url || '',
      });
    }
  }, [fight]);

  const handleSave = async () => {
    if (!fight) return;
    if (!formData.user_id) {
      toast({ title: 'Σφάλμα', description: 'Απαιτείται ο αθλητής μας', variant: 'destructive' });
      return;
    }

    const opponentName = formData.opponent_name.trim() || 'Αντίπαλος';
    const safeFightType = ['training', 'sparring', 'competition'].includes(formData.fight_type)
      ? formData.fight_type
      : 'competition';
    const safeResult = ['win', 'loss', 'draw', 'no_contest'].includes(formData.result)
      ? formData.result
      : formData.result
        ? 'no_contest'
        : null;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('muaythai_fights')
        .update({
          user_id: formData.user_id,
          our_corner: formData.our_corner,
          opponent_name: opponentName,
          fight_date: formData.fight_date,
          result: safeResult,
          fight_type: safeFightType,
          total_rounds: formData.total_rounds ? parseInt(formData.total_rounds) : null,
          round_duration_seconds: formData.round_duration_seconds ? parseInt(formData.round_duration_seconds) : null,
          location: formData.location || null,
          weight_class: formData.weight_class || null,
          notes: formData.notes || null,
          video_url: formData.video_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', fight.id);

      if (error) throw error;

      toast({ title: 'Επιτυχία', description: 'Ο αγώνας ενημερώθηκε' });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating fight:', error);
      toast({ title: 'Σφάλμα', description: 'Αποτυχία ενημέρωσης αγώνα', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!fight) return null;

  const ourCornerColor = formData.our_corner === 'red' ? 'red' : 'blue';
  const oppCornerColor = formData.our_corner === 'red' ? 'blue' : 'red';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Επεξεργασία Αγώνα</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Corner toggle */}
          <div>
            <Label>Γωνία αθλητή μας</Label>
            <div className="flex items-center border border-input h-9 mt-1 w-fit">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, our_corner: 'red' })}
                className={`h-full px-3 text-xs font-semibold transition-colors ${formData.our_corner === 'red' ? 'bg-red-600 text-white' : 'bg-background text-red-600 hover:bg-red-50'}`}
              >
                Κόκκινη
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, our_corner: 'blue' })}
                className={`h-full px-3 text-xs font-semibold transition-colors ${formData.our_corner === 'blue' ? 'bg-blue-600 text-white' : 'bg-background text-blue-600 hover:bg-blue-50'}`}
              >
                Μπλε
              </button>
            </div>
          </div>

          {/* Κόκκινη γωνία - ΠΑΝΤΑ ΠΡΩΤΗ */}
          <div>
            <Label className="text-red-600">
              Κόκκινη γωνία {formData.our_corner === 'red' ? '(αθλητής μας) *' : '(αντίπαλος)'}
            </Label>
            {formData.our_corner === 'red' ? (
              <UserSearchCombobox
                value={formData.user_id}
                onValueChange={(v) => setFormData({ ...formData, user_id: v })}
                placeholder="Επιλέξτε αθλητή..."
                coachId={coachId || undefined}
                adminOwned={isAdmin()}
              />
            ) : (
              <Input
                value={formData.opponent_name}
                onChange={(e) => setFormData({ ...formData, opponent_name: e.target.value })}
                placeholder="Όνομα αντιπάλου"
                className="rounded-none"
              />
            )}
          </div>

          {/* Μπλε γωνία - ΠΑΝΤΑ ΔΕΥΤΕΡΗ */}
          <div>
            <Label className="text-blue-600">
              Μπλε γωνία {formData.our_corner === 'blue' ? '(αθλητής μας) *' : '(αντίπαλος)'}
            </Label>
            {formData.our_corner === 'blue' ? (
              <UserSearchCombobox
                value={formData.user_id}
                onValueChange={(v) => setFormData({ ...formData, user_id: v })}
                placeholder="Επιλέξτε αθλητή..."
                coachId={coachId || undefined}
                adminOwned={isAdmin()}
              />
            ) : (
              <Input
                value={formData.opponent_name}
                onChange={(e) => setFormData({ ...formData, opponent_name: e.target.value })}
                placeholder="Όνομα αντιπάλου"
                className="rounded-none"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ημερομηνία *</Label>
              <Input
                type="date"
                value={formData.fight_date}
                onChange={(e) => setFormData({ ...formData, fight_date: e.target.value })}
                className="rounded-none"
              />
            </div>
            <div>
              <Label>Αποτέλεσμα</Label>
              <Select
                value={formData.result}
                onValueChange={(value) => setFormData({ ...formData, result: value })}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="win">Νίκη</SelectItem>
                  <SelectItem value="loss">Ήττα</SelectItem>
                  <SelectItem value="draw">Ισοπαλία</SelectItem>
                  <SelectItem value="no_contest">Άκυρος</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Τύπος Αγώνα</Label>
              <Select
                value={formData.fight_type}
                onValueChange={(value) => setFormData({ ...formData, fight_type: value })}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="competition">Αγώνας</SelectItem>
                  <SelectItem value="training">Προπόνηση</SelectItem>
                  <SelectItem value="sparring">Sparring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Κατηγορία Βάρους</Label>
              <Input
                value={formData.weight_class}
                onChange={(e) => setFormData({ ...formData, weight_class: e.target.value })}
                placeholder="π.χ. 67kg"
                className="rounded-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Αριθμός Γύρων</Label>
              <Input
                type="number"
                value={formData.total_rounds}
                onChange={(e) => setFormData({ ...formData, total_rounds: e.target.value })}
                placeholder="π.χ. 3"
                className="rounded-none"
              />
            </div>
            <div>
              <Label>Διάρκεια Γύρου (δευτ.)</Label>
              <Input
                type="number"
                value={formData.round_duration_seconds}
                onChange={(e) => setFormData({ ...formData, round_duration_seconds: e.target.value })}
                placeholder="π.χ. 180"
                className="rounded-none"
              />
            </div>
          </div>

          <div>
            <Label>Τοποθεσία</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Πόλη / Χώρα"
              className="rounded-none"
            />
          </div>

          <div>
            <Label>Video URL</Label>
            <Input
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="https://..."
              className="rounded-none"
            />
          </div>

          <div>
            <Label>Σημειώσεις</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Παρατηρήσεις..."
              className="rounded-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-none">
            Ακύρωση
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !formData.fight_date || !formData.user_id}
            className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Αποθήκευση
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
