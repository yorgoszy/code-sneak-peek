
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const basicEnduranceFields = [
  { key: 'pushUps', label: 'Push Ups', type: 'number', placeholder: 'επαναλήψεις' },
  { key: 'pullUps', label: 'Pull Ups', type: 'number', placeholder: 'επαναλήψεις' },
  { key: 'crunches', label: 'Crunches', type: 'number', placeholder: 'επαναλήψεις' }
];

interface EnduranceTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
}

export const EnduranceTests = ({ selectedAthleteId, selectedDate }: EnduranceTestsProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    pushUps: '',
    pullUps: '',
    crunches: '',
    farmerKg: '',
    farmerMeters: '',
    farmerSeconds: '',
    sprintSeconds: '',
    sprintMeters: '',
    sprintResistance: '',
    sprintWatt: '',
    masMeters: '',
    masMinutes: '',
    masMs: '',
    masKmh: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedAthleteId || !user) {
      toast.error("Παρακαλώ επιλέξτε αθλητή");
      return;
    }

    try {
      // Δημιουργία session για αντοχή
      const { data: session, error: sessionError } = await supabase
        .from('endurance_test_sessions')
        .insert({
          athlete_id: selectedAthleteId,
          test_date: selectedDate,
          created_by: user.id
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Αποθήκευση δεδομένων αντοχής
      const enduranceData = {
        test_session_id: session.id,
        push_ups: formData.pushUps ? parseInt(formData.pushUps) : null,
        pull_ups: formData.pullUps ? parseInt(formData.pullUps) : null,
        crunches: formData.crunches ? parseInt(formData.crunches) : null,
        farmer_kg: formData.farmerKg ? parseFloat(formData.farmerKg) : null,
        farmer_meters: formData.farmerMeters ? parseFloat(formData.farmerMeters) : null,
        farmer_seconds: formData.farmerSeconds ? parseFloat(formData.farmerSeconds) : null,
        sprint_seconds: formData.sprintSeconds ? parseFloat(formData.sprintSeconds) : null,
        sprint_meters: formData.sprintMeters ? parseFloat(formData.sprintMeters) : null,
        sprint_resistance: formData.sprintResistance || null,
        sprint_watt: formData.sprintWatt ? parseFloat(formData.sprintWatt) : null,
        mas_meters: formData.masMeters ? parseFloat(formData.masMeters) : null,
        mas_minutes: formData.masMinutes ? parseFloat(formData.masMinutes) : null,
        mas_ms: formData.masMs ? parseFloat(formData.masMs) : null,
        mas_kmh: formData.masKmh ? parseFloat(formData.masKmh) : null
      };

      const { error: dataError } = await supabase
        .from('endurance_test_data')
        .insert(enduranceData);

      if (dataError) throw dataError;

      // Δημιουργία summary για γραφήματα
      const chartData = {
        labels: ['Push Ups', 'Pull Ups', 'Crunches', 'Farmer Walk', 'Sprint', 'MAS'],
        values: [
          formData.pushUps || 0,
          formData.pullUps || 0,
          formData.crunches || 0,
          formData.farmerKg || 0,
          formData.sprintWatt || 0,
          formData.masKmh || 0
        ]
      };

      await supabase
        .from('test_results_summary')
        .insert({
          athlete_id: selectedAthleteId,
          test_type: 'endurance',
          test_date: selectedDate,
          chart_data: chartData
        });

      toast.success("Τα δεδομένα αντοχής αποθηκεύτηκαν επιτυχώς!");
      
      // Reset form
      setFormData({
        pushUps: '',
        pullUps: '',
        crunches: '',
        farmerKg: '',
        farmerMeters: '',
        farmerSeconds: '',
        sprintSeconds: '',
        sprintMeters: '',
        sprintResistance: '',
        sprintWatt: '',
        masMeters: '',
        masMinutes: '',
        masMs: '',
        masKmh: ''
      });

    } catch (error) {
      console.error('Error saving endurance data:', error);
      toast.error("Σφάλμα κατά την αποθήκευση");
    }
  };

  return (
    <div className="space-y-6">
      {/* Βασικά Τεστ Αντοχής */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {basicEnduranceFields.map((field) => (
          <Card key={field.key} className="rounded-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{field.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Input
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.key as keyof typeof formData]}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                className="rounded-none"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Farmer Walk */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Farmer Walk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Βάρος</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="kg"
                value={formData.farmerKg}
                onChange={(e) => handleInputChange('farmerKg', e.target.value)}
                className="rounded-none"
              />
            </div>
            <div>
              <Label>Μέτρα</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="m"
                value={formData.farmerMeters}
                onChange={(e) => handleInputChange('farmerMeters', e.target.value)}
                className="rounded-none"
              />
            </div>
            <div>
              <Label>Χρόνος</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="δευτ."
                value={formData.farmerSeconds}
                onChange={(e) => handleInputChange('farmerSeconds', e.target.value)}
                className="rounded-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sprint */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Sprint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Χρόνος</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="δευτ."
                value={formData.sprintSeconds}
                onChange={(e) => handleInputChange('sprintSeconds', e.target.value)}
                className="rounded-none"
              />
            </div>
            <div>
              <Label>Μέτρα</Label>
              <Input
                type="number"
                placeholder="m"
                value={formData.sprintMeters}
                onChange={(e) => handleInputChange('sprintMeters', e.target.value)}
                className="rounded-none"
              />
            </div>
            <div>
              <Label>Αντίσταση</Label>
              <Select value={formData.sprintResistance} onValueChange={(value) => handleInputChange('sprintResistance', value)}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="χαμηλή">Χαμηλή</SelectItem>
                  <SelectItem value="μέτρια">Μέτρια</SelectItem>
                  <SelectItem value="υψηλή">Υψηλή</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Watt</Label>
              <Input
                type="number"
                placeholder="W"
                value={formData.sprintWatt}
                onChange={(e) => handleInputChange('sprintWatt', e.target.value)}
                className="rounded-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MAS */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>MAS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Μέτρα</Label>
              <Input
                type="number"
                placeholder="m"
                value={formData.masMeters}
                onChange={(e) => handleInputChange('masMeters', e.target.value)}
                className="rounded-none"
              />
            </div>
            <div>
              <Label>Λεπτά</Label>
              <Input
                type="number"
                placeholder="λεπτά"
                value={formData.masMinutes}
                onChange={(e) => handleInputChange('masMinutes', e.target.value)}
                className="rounded-none"
              />
            </div>
            <div>
              <Label>m/s</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="m/s"
                value={formData.masMs}
                onChange={(e) => handleInputChange('masMs', e.target.value)}
                className="rounded-none"
              />
            </div>
            <div>
              <Label>km/h</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="km/h"
                value={formData.masKmh}
                onChange={(e) => handleInputChange('masKmh', e.target.value)}
                className="rounded-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="rounded-none">
        <CardContent className="p-4 flex items-center justify-center">
          <Button onClick={handleSubmit} className="rounded-none w-full max-w-md">
            Αποθήκευση Τεστ Αντοχής
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
