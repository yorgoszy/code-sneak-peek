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

interface Fight {
  id: string;
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
  onSave 
}) => {
  const [formData, setFormData] = useState({
    opponent_name: '',
    fight_date: '',
    result: '',
    fight_type: '',
    total_rounds: '',
    round_duration_seconds: '',
    location: '',
    weight_class: '',
    notes: '',
    video_url: ''
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (fight) {
      setFormData({
        opponent_name: fight.opponent_name || '',
        fight_date: fight.fight_date || '',
        result: fight.result || '',
        fight_type: fight.fight_type || '',
        total_rounds: fight.total_rounds?.toString() || '',
        round_duration_seconds: fight.round_duration_seconds?.toString() || '',
        location: fight.location || '',
        weight_class: fight.weight_class || '',
        notes: fight.notes || '',
        video_url: fight.video_url || ''
      });
    }
  }, [fight]);

  const handleSave = async () => {
    if (!fight) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('muaythai_fights')
        .update({
          opponent_name: formData.opponent_name || null,
          fight_date: formData.fight_date,
          result: formData.result || null,
          fight_type: formData.fight_type || null,
          total_rounds: formData.total_rounds ? parseInt(formData.total_rounds) : null,
          round_duration_seconds: formData.round_duration_seconds ? parseInt(formData.round_duration_seconds) : null,
          location: formData.location || null,
          weight_class: formData.weight_class || null,
          notes: formData.notes || null,
          video_url: formData.video_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', fight.id);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Ο αγώνας ενημερώθηκε"
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating fight:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία ενημέρωσης αγώνα",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!fight) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Επεξεργασία Αγώνα</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Αντίπαλος</Label>
              <Input
                value={formData.opponent_name}
                onChange={(e) => setFormData({ ...formData, opponent_name: e.target.value })}
                placeholder="Όνομα αντιπάλου"
                className="rounded-none"
              />
            </div>
            <div>
              <Label>Ημερομηνία *</Label>
              <Input
                type="date"
                value={formData.fight_date}
                onChange={(e) => setFormData({ ...formData, fight_date: e.target.value })}
                className="rounded-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="amateur">Ερασιτεχνικός</SelectItem>
                  <SelectItem value="professional">Επαγγελματικός</SelectItem>
                  <SelectItem value="sparring">Sparring</SelectItem>
                </SelectContent>
              </Select>
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

          <div className="grid grid-cols-2 gap-4">
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
              <Label>Κατηγορία Βάρους</Label>
              <Input
                value={formData.weight_class}
                onChange={(e) => setFormData({ ...formData, weight_class: e.target.value })}
                placeholder="π.χ. 67kg"
                className="rounded-none"
              />
            </div>
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
            disabled={saving || !formData.fight_date}
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
