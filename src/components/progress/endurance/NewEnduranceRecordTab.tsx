import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewEnduranceRecordTabProps {
  users: any[];
  onRecordSaved?: () => void;
}

export const NewEnduranceRecordTab: React.FC<NewEnduranceRecordTabProps> = ({ 
  users, 
  onRecordSaved 
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  
  // Endurance metrics
  const [pushUps, setPushUps] = useState<string>('');
  const [pullUps, setPullUps] = useState<string>('');
  const [crunches, setCrunches] = useState<string>('');
  const [farmerKg, setFarmerKg] = useState<string>('');
  const [farmerMeters, setFarmerMeters] = useState<string>('');
  const [farmerSeconds, setFarmerSeconds] = useState<string>('');
  const [sprintSeconds, setSprintSeconds] = useState<string>('');
  const [sprintMeters, setSprintMeters] = useState<string>('');
  const [sprintResistance, setSprintResistance] = useState<string>('');
  const [masMeters, setMasMeters] = useState<string>('');
  const [masMinutes, setMasMinutes] = useState<string>('');
  const [vo2Max, setVo2Max] = useState<string>('');
  const [maxHr, setMaxHr] = useState<string>('');
  const [restingHr1min, setRestingHr1min] = useState<string>('');

  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedUserId) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε ασκούμενο",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Δημιουργία test session
      const { data: sessionData, error: sessionError } = await supabase
        .from('endurance_test_sessions')
        .insert({
          user_id: selectedUserId,
          test_date: testDate,
          notes: notes || null
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Δημιουργία test data
      const testData: any = {
        test_session_id: sessionData.id
      };

      if (pushUps) testData.push_ups = parseInt(pushUps);
      if (pullUps) testData.pull_ups = parseInt(pullUps);
      if (crunches) testData.crunches = parseInt(crunches);
      if (farmerKg) testData.farmer_kg = parseFloat(farmerKg);
      if (farmerMeters) testData.farmer_meters = parseFloat(farmerMeters);
      if (farmerSeconds) testData.farmer_seconds = parseFloat(farmerSeconds);
      if (sprintSeconds) testData.sprint_seconds = parseFloat(sprintSeconds);
      if (sprintMeters) testData.sprint_meters = parseFloat(sprintMeters);
      if (sprintResistance) testData.sprint_resistance = sprintResistance;
      if (masMeters) testData.mas_meters = parseFloat(masMeters);
      if (masMinutes) testData.mas_minutes = parseFloat(masMinutes);
      if (vo2Max) testData.vo2_max = parseFloat(vo2Max);
      if (maxHr) testData.max_hr = parseInt(maxHr);
      if (restingHr1min) testData.resting_hr_1min = parseInt(restingHr1min);

      const { error: dataError } = await supabase
        .from('endurance_test_data')
        .insert(testData);

      if (dataError) throw dataError;

      toast({
        title: "Επιτυχία",
        description: "Η καταγραφή αποθηκεύτηκε επιτυχώς"
      });

      // Reset form
      setSelectedUserId('');
      setNotes('');
      setPushUps('');
      setPullUps('');
      setCrunches('');
      setFarmerKg('');
      setFarmerMeters('');
      setFarmerSeconds('');
      setSprintSeconds('');
      setSprintMeters('');
      setSprintResistance('');
      setMasMeters('');
      setMasMinutes('');
      setVo2Max('');
      setMaxHr('');
      setRestingHr1min('');

      if (onRecordSaved) {
        onRecordSaved();
      }
    } catch (error) {
      console.error('Error saving endurance record:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία αποθήκευσης καταγραφής",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-none">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ασκούμενος</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε ασκούμενο" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ημερομηνία</Label>
              <Input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="rounded-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Σημειώσεις</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Προαιρετικές σημειώσεις..."
              className="rounded-none"
              rows={3}
            />
          </div>

          {/* Bodyweight Exercises */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Ασκήσεις Σωματικού Βάρους</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Push-ups</Label>
                <Input
                  type="number"
                  value={pushUps}
                  onChange={(e) => setPushUps(e.target.value)}
                  placeholder="Επαναλήψεις"
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Pull-ups</Label>
                <Input
                  type="number"
                  value={pullUps}
                  onChange={(e) => setPullUps(e.target.value)}
                  placeholder="Επαναλήψεις"
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Crunches</Label>
                <Input
                  type="number"
                  value={crunches}
                  onChange={(e) => setCrunches(e.target.value)}
                  placeholder="Επαναλήψεις"
                  className="rounded-none"
                />
              </div>
            </div>
          </div>

          {/* Farmer Walk */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Farmer Walk</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Βάρος (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={farmerKg}
                  onChange={(e) => setFarmerKg(e.target.value)}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Απόσταση (m)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={farmerMeters}
                  onChange={(e) => setFarmerMeters(e.target.value)}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Χρόνος (sec)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={farmerSeconds}
                  onChange={(e) => setFarmerSeconds(e.target.value)}
                  className="rounded-none"
                />
              </div>
            </div>
          </div>

          {/* Sprint */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Sprint</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Χρόνος (sec)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={sprintSeconds}
                  onChange={(e) => setSprintSeconds(e.target.value)}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Απόσταση (m)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={sprintMeters}
                  onChange={(e) => setSprintMeters(e.target.value)}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Αντίσταση</Label>
                <Input
                  type="text"
                  value={sprintResistance}
                  onChange={(e) => setSprintResistance(e.target.value)}
                  placeholder="π.χ. 10kg"
                  className="rounded-none"
                />
              </div>
            </div>
          </div>

          {/* MAS & Cardio */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">MAS & Καρδιοαναπνευστικά</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>MAS Απόσταση (m)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={masMeters}
                  onChange={(e) => setMasMeters(e.target.value)}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label>MAS Χρόνος (min)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={masMinutes}
                  onChange={(e) => setMasMinutes(e.target.value)}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label>VO2 Max</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={vo2Max}
                  onChange={(e) => setVo2Max(e.target.value)}
                  className="rounded-none"
                />
              </div>
            </div>
          </div>

          {/* Heart Rate */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Καρδιακός Ρυθμός</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Μέγιστος HR</Label>
                <Input
                  type="number"
                  value={maxHr}
                  onChange={(e) => setMaxHr(e.target.value)}
                  placeholder="bpm"
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Resting HR (1 min)</Label>
                <Input
                  type="number"
                  value={restingHr1min}
                  onChange={(e) => setRestingHr1min(e.target.value)}
                  placeholder="bpm"
                  className="rounded-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
            >
              {isSaving ? 'Αποθήκευση...' : 'Αποθήκευση Καταγραφής'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};