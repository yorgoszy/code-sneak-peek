import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Combobox } from "@/components/ui/combobox";

interface EnduranceRecordTabProps {
  users: any[];
  exercises: any[];
  onRecordSaved?: () => void;
}

export const EnduranceRecordTab: React.FC<EnduranceRecordTabProps> = ({ 
  users, 
  exercises,
  onRecordSaved 
}) => {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);

  const userOptions = useMemo(() => 
    (users || []).map(user => ({ 
      value: user.id, 
      label: user.name,
      searchTerms: `${user.name} ${user.email || ''}`
    })),
    [users]
  );

  const exerciseOptions = useMemo(() => 
    (exercises || []).map(exercise => ({ value: exercise.id, label: exercise.name })),
    [exercises]
  );

  // Calculate MAS: distance / (duration × 60)
  const calculatedMas = useMemo(() => {
    const dist = parseFloat(distance);
    const dur = parseFloat(duration);
    
    if (!dist || !dur || dist <= 0 || dur <= 0) {
      return '';
    }
    
    const mas = dist / (dur * 60);
    return mas.toFixed(2);
  }, [distance, duration]);

  const handleSave = async () => {
    if (!selectedUserId || !selectedExerciseId) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε χρήστη και άσκηση",
        variant: "destructive"
      });
      return;
    }

    const dist = parseFloat(distance);
    const dur = parseFloat(duration);

    if (!dist || !dur || dist <= 0 || dur <= 0) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε απόσταση και διάρκεια",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Δεν βρέθηκε συνδεδεμένος χρήστης');
      }

      // Create test session
      const { data: session, error: sessionError } = await supabase
        .from('test_sessions')
        .insert({
          user_id: selectedUserId,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'MAS Test - Καταγραφή Προόδου'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Calculate MAS values
      const mas = dist / (dur * 60);
      const masKmh = mas * 3.6;

      // Save endurance test data
      const { error: dataError } = await supabase
        .from('endurance_test_data')
        .insert({
          test_session_id: session.id,
          mas_meters: dist,
          mas_minutes: dur,
          mas_ms: mas,
          mas_kmh: masKmh
        });

      if (dataError) throw dataError;

      toast({
        title: "Επιτυχία",
        description: "Το MAS Test αποθηκεύτηκε"
      });

      // Reset form
      setDistance('');
      setDuration('');
      
      if (onRecordSaved) {
        onRecordSaved();
      }
    } catch (error) {
      console.error('Error saving MAS test:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία αποθήκευσης",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDistanceChange = (value: string) => {
    if (value === '') {
      setDistance('');
      return;
    }
    const normalizedValue = value.replace('.', ',');
    const numericValue = parseFloat(normalizedValue.replace(',', '.'));
    if (!isNaN(numericValue)) {
      setDistance(numericValue.toString());
    }
  };

  const handleDurationChange = (value: string) => {
    if (value === '') {
      setDuration('');
      return;
    }
    const normalizedValue = value.replace('.', ',');
    const numericValue = parseFloat(normalizedValue.replace(',', '.'));
    if (!isNaN(numericValue)) {
      setDuration(numericValue.toString());
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">MAS Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User and Exercise Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">Ασκούμενος</Label>
            <Combobox
              options={userOptions}
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              placeholder="Επιλέξτε χρήστη"
              emptyMessage="Δεν βρέθηκε χρήστης."
            />
          </div>

          <div>
            <Label className="text-sm">Άσκηση</Label>
            <Combobox
              options={exerciseOptions}
              value={selectedExerciseId}
              onValueChange={setSelectedExerciseId}
              placeholder="Επιλέξτε άσκηση"
              emptyMessage="Δεν βρέθηκε άσκηση."
            />
          </div>
        </div>

        {/* Distance, Duration, and MAS */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm">Απόσταση (μέτρα)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="m"
              value={distance}
              onChange={(e) => handleDistanceChange(e.target.value)}
              className="rounded-none no-spinners"
            />
          </div>

          <div>
            <Label className="text-sm">Διάρκεια (λεπτά)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="λεπτά"
              value={duration}
              onChange={(e) => handleDurationChange(e.target.value)}
              className="rounded-none no-spinners"
            />
          </div>

          <div>
            <Label className="text-sm">MAS (m/s)</Label>
            <Input
              type="text"
              value={calculatedMas}
              readOnly
              placeholder="Αυτόματος υπολογισμός"
              className="rounded-none bg-gray-100"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            className="rounded-none"
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};