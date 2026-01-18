import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Target, Shield, ChevronLeft, ChevronRight, User, Users, Check, X } from 'lucide-react';
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
  correct: number; // πόσα ήταν τεχνικά σωστά
}

interface DefenseCount {
  type: 'block' | 'dodge' | 'parry' | 'clinch';
  successful: number;
  failed: number;
}

const createEmptyStrikes = (): StrikeCount[] => [
  { type: 'punch', side: 'left', landed: 0, missed: 0, correct: 0 },
  { type: 'punch', side: 'right', landed: 0, missed: 0, correct: 0 },
  { type: 'kick', side: 'left', landed: 0, missed: 0, correct: 0 },
  { type: 'kick', side: 'right', landed: 0, missed: 0, correct: 0 },
  { type: 'knee', side: 'left', landed: 0, missed: 0, correct: 0 },
  { type: 'knee', side: 'right', landed: 0, missed: 0, correct: 0 },
  { type: 'elbow', side: 'left', landed: 0, missed: 0, correct: 0 },
  { type: 'elbow', side: 'right', landed: 0, missed: 0, correct: 0 },
];

const createEmptyDefenses = (): DefenseCount[] => [
  { type: 'block', successful: 0, failed: 0 },
  { type: 'dodge', successful: 0, failed: 0 },
  { type: 'parry', successful: 0, failed: 0 },
  { type: 'clinch', successful: 0, failed: 0 },
];

export const RoundRecordingStep: React.FC<RoundRecordingStepProps> = ({
  fightId,
  roundNumber,
  totalRounds,
  onComplete,
  onBack,
}) => {
  const [saving, setSaving] = useState(false);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'athlete' | 'opponent'>('athlete');

  // Athlete data
  const [athleteStrikes, setAthleteStrikes] = useState<StrikeCount[]>(createEmptyStrikes());
  const [athleteDefenses, setAthleteDefenses] = useState<DefenseCount[]>(createEmptyDefenses());

  // Opponent data
  const [opponentStrikes, setOpponentStrikes] = useState<StrikeCount[]>(createEmptyStrikes());
  const [opponentDefenses, setOpponentDefenses] = useState<DefenseCount[]>(createEmptyDefenses());

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

  const updateStrike = (
    setStrikes: React.Dispatch<React.SetStateAction<StrikeCount[]>>,
    index: number, 
    field: 'landed' | 'missed' | 'correct', 
    delta: number
  ) => {
    setStrikes(prev => prev.map((s, i) => {
      if (i === index) {
        const newValue = Math.max(0, s[field] + delta);
        // Ορθότητα δεν μπορεί να είναι μεγαλύτερη από landed + missed
        if (field === 'correct') {
          const maxCorrect = s.landed + s.missed;
          return { ...s, [field]: Math.min(newValue, maxCorrect) };
        }
        return { ...s, [field]: newValue };
      }
      return s;
    }));
  };

  const updateDefense = (
    setDefenses: React.Dispatch<React.SetStateAction<DefenseCount[]>>,
    index: number, 
    field: 'successful' | 'failed', 
    delta: number
  ) => {
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
      // Save athlete strikes
      const strikeRecords: any[] = [];
      
      // Athlete strikes
      athleteStrikes.forEach((s) => {
        const totalStrikes = s.landed + s.missed;
        let correctRemaining = s.correct;
        
        // Add landed strikes
        for (let i = 0; i < s.landed; i++) {
          const isCorrect = correctRemaining > 0;
          if (isCorrect) correctRemaining--;
          strikeRecords.push({
            round_id: roundId,
            strike_type: s.type,
            side: s.side,
            landed: true,
            is_opponent: false,
            is_correct: isCorrect,
            timestamp_in_round: 0,
          });
        }
        // Add missed strikes
        for (let i = 0; i < s.missed; i++) {
          const isCorrect = correctRemaining > 0;
          if (isCorrect) correctRemaining--;
          strikeRecords.push({
            round_id: roundId,
            strike_type: s.type,
            side: s.side,
            landed: false,
            is_opponent: false,
            is_correct: isCorrect,
            timestamp_in_round: 0,
          });
        }
      });

      // Opponent strikes
      opponentStrikes.forEach((s) => {
        const totalStrikes = s.landed + s.missed;
        let correctRemaining = s.correct;
        
        for (let i = 0; i < s.landed; i++) {
          const isCorrect = correctRemaining > 0;
          if (isCorrect) correctRemaining--;
          strikeRecords.push({
            round_id: roundId,
            strike_type: s.type,
            side: s.side,
            landed: true,
            is_opponent: true,
            is_correct: isCorrect,
            timestamp_in_round: 0,
          });
        }
        for (let i = 0; i < s.missed; i++) {
          const isCorrect = correctRemaining > 0;
          if (isCorrect) correctRemaining--;
          strikeRecords.push({
            round_id: roundId,
            strike_type: s.type,
            side: s.side,
            landed: false,
            is_opponent: true,
            is_correct: isCorrect,
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
      
      // Athlete defenses
      athleteDefenses.forEach((d) => {
        for (let i = 0; i < d.successful; i++) {
          defenseRecords.push({
            round_id: roundId,
            defense_type: d.type,
            successful: true,
            is_opponent: false,
            timestamp_in_round: 0,
          });
        }
        for (let i = 0; i < d.failed; i++) {
          defenseRecords.push({
            round_id: roundId,
            defense_type: d.type,
            successful: false,
            is_opponent: false,
            timestamp_in_round: 0,
          });
        }
      });

      // Opponent defenses
      opponentDefenses.forEach((d) => {
        for (let i = 0; i < d.successful; i++) {
          defenseRecords.push({
            round_id: roundId,
            defense_type: d.type,
            successful: true,
            is_opponent: true,
            timestamp_in_round: 0,
          });
        }
        for (let i = 0; i < d.failed; i++) {
          defenseRecords.push({
            round_id: roundId,
            defense_type: d.type,
            successful: false,
            is_opponent: true,
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

      // Calculate stats
      const athleteTotalStrikes = athleteStrikes.reduce((sum, s) => sum + s.landed + s.missed, 0);
      const athleteCorrectStrikes = athleteStrikes.reduce((sum, s) => sum + s.correct, 0);
      const athleteLandedStrikes = athleteStrikes.reduce((sum, s) => sum + s.landed, 0);
      
      const opponentTotalStrikes = opponentStrikes.reduce((sum, s) => sum + s.landed + s.missed, 0);
      const opponentCorrectStrikes = opponentStrikes.reduce((sum, s) => sum + s.correct, 0);
      const opponentLandedStrikes = opponentStrikes.reduce((sum, s) => sum + s.landed, 0);
      
      const athleteSuccessfulDefenses = athleteDefenses.reduce((sum, d) => sum + d.successful, 0);
      
      // Χτυπήματα που δέχτηκε = Χτυπήματα αντιπάλου που πέτυχαν - Επιτυχημένες άμυνες αθλητή
      const hitsReceived = Math.max(0, opponentLandedStrikes - athleteSuccessfulDefenses);

      // Update round stats
      const { error: updateError } = await supabase
        .from('muaythai_rounds')
        .update({
          athlete_strikes_total: athleteTotalStrikes,
          athlete_strikes_correct: athleteCorrectStrikes,
          opponent_strikes_total: opponentTotalStrikes,
          opponent_strikes_correct: opponentCorrectStrikes,
          hits_received: hitsReceived,
        })
        .eq('id', roundId);

      if (updateError) throw updateError;

      toast.success(`Γύρος ${roundNumber} αποθηκεύτηκε!`);
      
      // Reset for next round
      setAthleteStrikes(createEmptyStrikes());
      setAthleteDefenses(createEmptyDefenses());
      setOpponentStrikes(createEmptyStrikes());
      setOpponentDefenses(createEmptyDefenses());
      setActiveTab('athlete');

      onComplete({
        athleteTotalStrikes,
        athleteCorrectStrikes,
        athleteLandedStrikes,
        opponentTotalStrikes,
        opponentCorrectStrikes,
        opponentLandedStrikes,
        hitsReceived,
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
    color?: 'green' | 'red' | 'blue' | 'yellow';
  }) => {
    const colorClasses = {
      green: 'bg-green-100 text-green-700',
      red: 'bg-red-100 text-red-700',
      blue: 'bg-blue-100 text-blue-700',
      yellow: 'bg-yellow-100 text-yellow-700',
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

  const StrikesSection = ({ 
    strikes, 
    setStrikes,
    showCorrectness = true 
  }: { 
    strikes: StrikeCount[]; 
    setStrikes: React.Dispatch<React.SetStateAction<StrikeCount[]>>;
    showCorrectness?: boolean;
  }) => (
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
                  const totalStrikes = strike.landed + strike.missed;
                  return (
                    <div key={side} className="space-y-2">
                      <p className="text-xs text-gray-500">{sideLabels[side]}</p>
                      <div className="flex flex-col gap-1">
                        <CounterButton
                          value={strike.landed}
                          onIncrement={() => updateStrike(setStrikes, index, 'landed', 1)}
                          onDecrement={() => updateStrike(setStrikes, index, 'landed', -1)}
                          label="Επιτυχία"
                          color="green"
                        />
                        <CounterButton
                          value={strike.missed}
                          onIncrement={() => updateStrike(setStrikes, index, 'missed', 1)}
                          onDecrement={() => updateStrike(setStrikes, index, 'missed', -1)}
                          label="Αποτυχία"
                          color="red"
                        />
                        {showCorrectness && (
                          <CounterButton
                            value={strike.correct}
                            onIncrement={() => updateStrike(setStrikes, index, 'correct', 1)}
                            onDecrement={() => updateStrike(setStrikes, index, 'correct', -1)}
                            label="Ορθότητα"
                            color="yellow"
                          />
                        )}
                        {showCorrectness && totalStrikes > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Ορθότητα: {Math.round((strike.correct / totalStrikes) * 100)}%
                          </div>
                        )}
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
  );

  const DefensesSection = ({ 
    defenses, 
    setDefenses 
  }: { 
    defenses: DefenseCount[]; 
    setDefenses: React.Dispatch<React.SetStateAction<DefenseCount[]>>;
  }) => (
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
                onIncrement={() => updateDefense(setDefenses, index, 'successful', 1)}
                onDecrement={() => updateDefense(setDefenses, index, 'successful', -1)}
                label="Επιτυχία"
                color="blue"
              />
              <CounterButton
                value={defense.failed}
                onIncrement={() => updateDefense(setDefenses, index, 'failed', 1)}
                onDecrement={() => updateDefense(setDefenses, index, 'failed', -1)}
                label="Αποτυχία"
                color="red"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Calculate summary stats for display
  const athleteTotalStrikes = athleteStrikes.reduce((sum, s) => sum + s.landed + s.missed, 0);
  const athleteCorrectStrikes = athleteStrikes.reduce((sum, s) => sum + s.correct, 0);
  const opponentTotalStrikes = opponentStrikes.reduce((sum, s) => sum + s.landed + s.missed, 0);
  const opponentLandedStrikes = opponentStrikes.reduce((sum, s) => sum + s.landed, 0);
  const athleteSuccessfulDefenses = athleteDefenses.reduce((sum, d) => sum + d.successful, 0);
  const hitsReceived = Math.max(0, opponentLandedStrikes - athleteSuccessfulDefenses);

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

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="bg-[#00ffba]/10 p-3 rounded-none text-center">
          <p className="text-xs text-gray-500">Χτυπήματα Αθλητή</p>
          <p className="text-lg font-bold text-[#00ffba]">{athleteTotalStrikes}</p>
        </div>
        <div className="bg-yellow-50 p-3 rounded-none text-center">
          <p className="text-xs text-gray-500">Ορθότητα</p>
          <p className="text-lg font-bold text-yellow-600">
            {athleteTotalStrikes > 0 ? Math.round((athleteCorrectStrikes / athleteTotalStrikes) * 100) : 0}%
          </p>
        </div>
        <div className="bg-red-50 p-3 rounded-none text-center">
          <p className="text-xs text-gray-500">Χτ. Αντιπάλου</p>
          <p className="text-lg font-bold text-red-500">{opponentTotalStrikes}</p>
        </div>
        <div className="bg-orange-50 p-3 rounded-none text-center">
          <p className="text-xs text-gray-500">Έφαγε</p>
          <p className="text-lg font-bold text-orange-500">{hitsReceived}</p>
        </div>
      </div>

      {/* Tabs for Athlete / Opponent */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'athlete' | 'opponent')}>
        <TabsList className="grid w-full grid-cols-2 rounded-none">
          <TabsTrigger value="athlete" className="rounded-none flex items-center gap-2">
            <User className="w-4 h-4" />
            Αθλητής
          </TabsTrigger>
          <TabsTrigger value="opponent" className="rounded-none flex items-center gap-2">
            <Users className="w-4 h-4" />
            Αντίπαλος
          </TabsTrigger>
        </TabsList>

        <TabsContent value="athlete" className="mt-4 space-y-4">
          <StrikesSection strikes={athleteStrikes} setStrikes={setAthleteStrikes} showCorrectness={true} />
          <DefensesSection defenses={athleteDefenses} setDefenses={setAthleteDefenses} />
        </TabsContent>

        <TabsContent value="opponent" className="mt-4 space-y-4">
          <StrikesSection strikes={opponentStrikes} setStrikes={setOpponentStrikes} showCorrectness={true} />
          <DefensesSection defenses={opponentDefenses} setDefenses={setOpponentDefenses} />
        </TabsContent>
      </Tabs>

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
