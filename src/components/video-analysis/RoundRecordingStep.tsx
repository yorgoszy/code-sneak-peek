import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Target, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RoundRecordingStepProps {
  fightId: string;
  roundNumber: number;
  totalRounds: number;
  onComplete: (data: any) => void;
  onBack: () => void;
}

interface StrikeCount {
  type: 'punch' | 'kick' | 'knee' | 'elbow';
  side: 'left' | 'right';
  landed: number;
  missed: number;
}

interface DefenseCount {
  type: 'block' | 'dodge' | 'parry' | 'clinch';
  successful: number;
  failed: number;
}

export const RoundRecordingStep: React.FC<RoundRecordingStepProps> = ({
  fightId,
  roundNumber,
  totalRounds,
  onComplete,
  onBack,
}) => {
  const [saving, setSaving] = useState(false);
  const [roundId, setRoundId] = useState<string | null>(null);

  // Strike counters
  const [strikes, setStrikes] = useState<StrikeCount[]>([
    { type: 'punch', side: 'left', landed: 0, missed: 0 },
    { type: 'punch', side: 'right', landed: 0, missed: 0 },
    { type: 'kick', side: 'left', landed: 0, missed: 0 },
    { type: 'kick', side: 'right', landed: 0, missed: 0 },
    { type: 'knee', side: 'left', landed: 0, missed: 0 },
    { type: 'knee', side: 'right', landed: 0, missed: 0 },
    { type: 'elbow', side: 'left', landed: 0, missed: 0 },
    { type: 'elbow', side: 'right', landed: 0, missed: 0 },
  ]);

  // Defense counters
  const [defenses, setDefenses] = useState<DefenseCount[]>([
    { type: 'block', successful: 0, failed: 0 },
    { type: 'dodge', successful: 0, failed: 0 },
    { type: 'parry', successful: 0, failed: 0 },
    { type: 'clinch', successful: 0, failed: 0 },
  ]);

  useEffect(() => {
    fetchRoundId();
  }, [fightId, roundNumber]);

  const fetchRoundId = async () => {
    const { data } = await supabase
      .from('muaythai_rounds')
      .select('id')
      .eq('fight_id', fightId)
      .eq('round_number', roundNumber)
      .single();
    
    if (data) setRoundId(data.id);
  };

  const updateStrike = (index: number, field: 'landed' | 'missed', delta: number) => {
    setStrikes(prev => prev.map((s, i) => {
      if (i === index) {
        const newValue = Math.max(0, s[field] + delta);
        return { ...s, [field]: newValue };
      }
      return s;
    }));
  };

  const updateDefense = (index: number, field: 'successful' | 'failed', delta: number) => {
    setDefenses(prev => prev.map((d, i) => {
      if (i === index) {
        const newValue = Math.max(0, d[field] + delta);
        return { ...d, [field]: newValue };
      }
      return d;
    }));
  };

  const handleSaveRound = async () => {
    if (!roundId) {
      toast.error('Δεν βρέθηκε ο γύρος');
      return;
    }

    setSaving(true);
    try {
      // Save strikes
      const strikeRecords: any[] = [];
      strikes.forEach((s) => {
        // Add landed strikes
        for (let i = 0; i < s.landed; i++) {
          strikeRecords.push({
            round_id: roundId,
            strike_type: s.type,
            side: s.side,
            landed: true,
            timestamp_in_round: 0,
          });
        }
        // Add missed strikes
        for (let i = 0; i < s.missed; i++) {
          strikeRecords.push({
            round_id: roundId,
            strike_type: s.type,
            side: s.side,
            landed: false,
            timestamp_in_round: 0,
          });
        }
      });

      if (strikeRecords.length > 0) {
        const { error: strikesError } = await supabase
          .from('muaythai_strikes')
          .insert(strikeRecords);
        if (strikesError) throw strikesError;
      }

      // Save defenses
      const defenseRecords: any[] = [];
      defenses.forEach((d) => {
        // Add successful defenses
        for (let i = 0; i < d.successful; i++) {
          defenseRecords.push({
            round_id: roundId,
            defense_type: d.type,
            successful: true,
            timestamp_in_round: 0,
          });
        }
        // Add failed defenses
        for (let i = 0; i < d.failed; i++) {
          defenseRecords.push({
            round_id: roundId,
            defense_type: d.type,
            successful: false,
            timestamp_in_round: 0,
          });
        }
      });

      if (defenseRecords.length > 0) {
        const { error: defensesError } = await supabase
          .from('muaythai_defenses')
          .insert(defenseRecords);
        if (defensesError) throw defensesError;
      }

      // Calculate totals for summary
      const totalStrikes = strikes.reduce((sum, s) => sum + s.landed + s.missed, 0);
      const landedStrikes = strikes.reduce((sum, s) => sum + s.landed, 0);
      const totalDefenses = defenses.reduce((sum, d) => sum + d.successful + d.failed, 0);
      const successfulDefenses = defenses.reduce((sum, d) => sum + d.successful, 0);

      toast.success(`Γύρος ${roundNumber} αποθηκεύτηκε!`);
      
      // Reset for next round
      setStrikes(prev => prev.map(s => ({ ...s, landed: 0, missed: 0 })));
      setDefenses(prev => prev.map(d => ({ ...d, successful: 0, failed: 0 })));

      onComplete({
        totalStrikes,
        landedStrikes,
        totalDefenses,
        successfulDefenses,
      });
    } catch (error: any) {
      console.error('Error saving round:', error);
      toast.error('Σφάλμα κατά την αποθήκευση');
    } finally {
      setSaving(false);
    }
  };

  const strikeLabels: Record<string, string> = {
    punch: 'Γροθιά',
    kick: 'Κλωτσιά',
    knee: 'Γόνατο',
    elbow: 'Αγκώνας',
  };

  const sideLabels: Record<string, string> = {
    left: 'Αριστερό',
    right: 'Δεξί',
  };

  const defenseLabels: Record<string, string> = {
    block: 'Block',
    dodge: 'Dodge',
    parry: 'Parry',
    clinch: 'Clinch',
  };

  const CounterButton = ({ 
    value, 
    onIncrement, 
    onDecrement,
    label,
    color = 'green'
  }: { 
    value: number; 
    onIncrement: () => void; 
    onDecrement: () => void;
    label: string;
    color?: 'green' | 'red' | 'blue';
  }) => {
    const colorClasses = {
      green: 'bg-green-100 text-green-700',
      red: 'bg-red-100 text-red-700',
      blue: 'bg-blue-100 text-blue-700',
    };

    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 w-16">{label}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={onDecrement}
          className="h-8 w-8 p-0 rounded-none"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className={`w-10 text-center font-bold py-1 ${colorClasses[color]} rounded-none`}>
          {value}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onIncrement}
          className="h-8 w-8 p-0 rounded-none"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex justify-center gap-2 mb-4">
        {Array.from({ length: totalRounds }, (_, i) => (
          <div
            key={i}
            className={`w-8 h-8 flex items-center justify-center rounded-none text-sm font-medium ${
              i + 1 === roundNumber
                ? 'bg-[#00ffba] text-black'
                : i + 1 < roundNumber
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Strikes Section */}
      <Card className="rounded-none">
        <CardContent className="pt-4">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-[#00ffba]" />
            Χτυπήματα
          </h3>
          <div className="space-y-3">
            {['punch', 'kick', 'knee', 'elbow'].map((type) => (
              <div key={type} className="border-b pb-3 last:border-0">
                <p className="text-sm font-medium mb-2">{strikeLabels[type]}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['left', 'right'].map((side) => {
                    const index = strikes.findIndex(s => s.type === type && s.side === side);
                    const strike = strikes[index];
                    return (
                      <div key={side} className="space-y-2">
                        <p className="text-xs text-gray-500">{sideLabels[side]}</p>
                        <div className="flex flex-col gap-1">
                          <CounterButton
                            value={strike.landed}
                            onIncrement={() => updateStrike(index, 'landed', 1)}
                            onDecrement={() => updateStrike(index, 'landed', -1)}
                            label="Επιτυχία"
                            color="green"
                          />
                          <CounterButton
                            value={strike.missed}
                            onIncrement={() => updateStrike(index, 'missed', 1)}
                            onDecrement={() => updateStrike(index, 'missed', -1)}
                            label="Αποτυχία"
                            color="red"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Defenses Section */}
      <Card className="rounded-none">
        <CardContent className="pt-4">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-purple-500" />
            Άμυνες
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {defenses.map((defense, index) => (
              <div key={defense.type} className="space-y-2">
                <p className="text-sm font-medium">{defenseLabels[defense.type]}</p>
                <CounterButton
                  value={defense.successful}
                  onIncrement={() => updateDefense(index, 'successful', 1)}
                  onDecrement={() => updateDefense(index, 'successful', -1)}
                  label="Επιτυχία"
                  color="blue"
                />
                <CounterButton
                  value={defense.failed}
                  onIncrement={() => updateDefense(index, 'failed', 1)}
                  onDecrement={() => updateDefense(index, 'failed', -1)}
                  label="Αποτυχία"
                  color="red"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={roundNumber === 1}
          className="rounded-none"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Προηγούμενος
        </Button>
        <Button
          onClick={handleSaveRound}
          disabled={saving}
          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
        >
          {saving ? 'Αποθήκευση...' : roundNumber === totalRounds ? 'Ολοκλήρωση' : 'Επόμενος Γύρος'}
          {roundNumber < totalRounds && <ChevronRight className="w-4 h-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
};
