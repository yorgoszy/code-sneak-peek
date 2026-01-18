import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { RoundRecordingStep } from './RoundRecordingStep';

interface FightRecordingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  coachId?: string;
  onSuccess?: () => void;
}

type Step = 'basic-info' | 'round-recording' | 'review';

export const FightRecordingDialog: React.FC<FightRecordingDialogProps> = ({
  isOpen,
  onClose,
  userId,
  coachId,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>('basic-info');
  const [saving, setSaving] = useState(false);
  
  // Basic info
  const [opponentName, setOpponentName] = useState('');
  const [fightDate, setFightDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fightType, setFightType] = useState<'training' | 'sparring' | 'competition'>('sparring');
  const [totalRounds, setTotalRounds] = useState(3);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  
  // Fight & round data
  const [fightId, setFightId] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundsData, setRoundsData] = useState<any[]>([]);

  const handleCreateFight = async () => {
    if (!opponentName.trim()) {
      toast.error('Παρακαλώ εισάγετε το όνομα του αντιπάλου');
      return;
    }

    setSaving(true);
    try {
      const { data: fight, error } = await supabase
        .from('muaythai_fights')
        .insert({
          user_id: userId,
          coach_id: coachId,
          opponent_name: opponentName,
          fight_date: fightDate,
          fight_type: fightType,
          total_rounds: totalRounds,
          location: location || null,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setFightId(fight.id);
      
      // Create rounds
      const roundsToCreate = Array.from({ length: totalRounds }, (_, i) => ({
        fight_id: fight.id,
        round_number: i + 1,
        duration_seconds: 180, // 3 minutes default
      }));

      const { error: roundsError } = await supabase
        .from('muaythai_rounds')
        .insert(roundsToCreate);

      if (roundsError) throw roundsError;

      toast.success('Ο αγώνας δημιουργήθηκε!');
      setStep('round-recording');
    } catch (error: any) {
      console.error('Error creating fight:', error);
      toast.error('Σφάλμα κατά τη δημιουργία του αγώνα');
    } finally {
      setSaving(false);
    }
  };

  const handleRoundComplete = (roundData: any) => {
    setRoundsData(prev => [...prev, { round: currentRound, ...roundData }]);
    
    if (currentRound < totalRounds) {
      setCurrentRound(prev => prev + 1);
    } else {
      setStep('review');
    }
  };

  const handleFinish = () => {
    toast.success('Η καταγραφή ολοκληρώθηκε!');
    onSuccess?.();
    handleClose();
  };

  const handleClose = () => {
    setStep('basic-info');
    setFightId(null);
    setCurrentRound(1);
    setRoundsData([]);
    setOpponentName('');
    setFightDate(format(new Date(), 'yyyy-MM-dd'));
    setFightType('sparring');
    setTotalRounds(3);
    setLocation('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-none">
        <DialogHeader className="relative">
          <DialogTitle>
            {step === 'basic-info' && 'Νέος Αγώνας'}
            {step === 'round-recording' && `Γύρος ${currentRound} από ${totalRounds}`}
            {step === 'review' && 'Ανασκόπηση Αγώνα'}
          </DialogTitle>
          <DialogClose className="absolute right-0 top-0 rounded-none opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        {step === 'basic-info' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Αντίπαλος *</Label>
                <Input
                  value={opponentName}
                  onChange={(e) => setOpponentName(e.target.value)}
                  placeholder="Όνομα αντιπάλου"
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Ημερομηνία</Label>
                <Input
                  type="date"
                  value={fightDate}
                  onChange={(e) => setFightDate(e.target.value)}
                  className="rounded-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Τύπος</Label>
                <Select value={fightType} onValueChange={(v: any) => setFightType(v)}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="training">Προπόνηση</SelectItem>
                    <SelectItem value="sparring">Sparring</SelectItem>
                    <SelectItem value="competition">Αγώνας</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Αριθμός Γύρων</Label>
                <Select value={totalRounds.toString()} onValueChange={(v) => setTotalRounds(parseInt(v))}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n} γύροι</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Τοποθεσία</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Τοποθεσία αγώνα"
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Σημειώσεις</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Επιπλέον σημειώσεις..."
                className="rounded-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose} className="rounded-none">
                Ακύρωση
              </Button>
              <Button 
                onClick={handleCreateFight} 
                disabled={saving}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                {saving ? 'Αποθήκευση...' : 'Έναρξη Καταγραφής'}
              </Button>
            </div>
          </div>
        )}

        {step === 'round-recording' && fightId && (
          <RoundRecordingStep
            fightId={fightId}
            roundNumber={currentRound}
            totalRounds={totalRounds}
            onComplete={handleRoundComplete}
            onBack={() => currentRound > 1 && setCurrentRound(prev => prev - 1)}
          />
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-none">
              <h3 className="font-semibold mb-2">Σύνοψη Αγώνα</h3>
              <p className="text-sm text-gray-600">
                <strong>Αντίπαλος:</strong> {opponentName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Γύροι:</strong> {totalRounds}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Καταγεγραμμένα δεδομένα:</strong> {roundsData.length} γύροι
              </p>
            </div>

            {roundsData.map((rd, i) => (
              <div key={i} className="bg-white border p-3 rounded-none">
                <h4 className="font-medium">Γύρος {rd.round}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs sm:text-sm">Χτυπήματα:</span>{' '}
                    <span className="font-medium">{rd.totalStrikes || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs sm:text-sm">Επιτυχημένα:</span>{' '}
                    <span className="font-medium text-green-600">{rd.landedStrikes || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs sm:text-sm">Άμυνες:</span>{' '}
                    <span className="font-medium">{rd.totalDefenses || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs sm:text-sm">Επιτυχημένες:</span>{' '}
                    <span className="font-medium text-blue-600">{rd.successfulDefenses || 0}</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setStep('round-recording')}
                className="rounded-none"
              >
                Πίσω
              </Button>
              <Button 
                onClick={handleFinish}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                Ολοκλήρωση
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
