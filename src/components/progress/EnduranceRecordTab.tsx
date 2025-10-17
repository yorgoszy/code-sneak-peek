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
    <Card className="rounded-none w-fit">
      <CardHeader className="pb-1 pt-2 px-3">
        <CardTitle className="text-xs">MAS Test</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-2 space-y-2">
        {/* User and Exercise Selection */}
        <div className="flex gap-2">
          <div className="w-40">
            <Label className="text-xs">Ασκούμενος</Label>
            <Combobox
              options={userOptions}
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              placeholder="Χρήστης"
              emptyMessage="Δεν βρέθηκε."
              className="h-7 text-xs"
            />
          </div>

          <div className="w-40">
            <Label className="text-xs">Άσκηση</Label>
            <Combobox
              options={exerciseOptions}
              value={selectedExerciseId}
              onValueChange={setSelectedExerciseId}
              placeholder="Άσκηση"
              emptyMessage="Δεν βρέθηκε."
              className="h-7 text-xs"
            />
          </div>
        </div>

        {/* Distance, Duration, and MAS */}
        <div className="flex gap-2">
          <div className="w-24">
            <Label className="text-xs">Μέτρα</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="m"
              value={distance}
              onChange={(e) => handleDistanceChange(e.target.value)}
              className="rounded-none no-spinners h-7 text-xs"
            />
          </div>

          <div className="w-24">
            <Label className="text-xs">Λεπτά</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="λεπτά"
              value={duration}
              onChange={(e) => handleDurationChange(e.target.value)}
              className="rounded-none no-spinners h-7 text-xs"
            />
          </div>

          <div className="w-20">
            <Label className="text-xs">MAS</Label>
            <Input
              type="text"
              value={calculatedMas}
              readOnly
              placeholder="m/s"
              className="rounded-none bg-gray-100 h-7 text-xs"
            />
          </div>

          <div className="flex items-end">
            <Button 
              onClick={handleSave} 
              className="rounded-none h-7 text-xs px-3"
              disabled={loading}
            >
              <Save className="w-3 h-3 mr-1" />
              {loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};