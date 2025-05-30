
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
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

  // Αυτόματος υπολογισμός m/s και km/h για MAS
  useEffect(() => {
    if (formData.masMeters && formData.masMinutes) {
      const meters = parseFloat(formData.masMeters);
      const minutes = parseFloat(formData.masMinutes);
      
      if (meters > 0 && minutes > 0) {
        const totalSeconds = minutes * 60;
        const ms = meters / totalSeconds;
        const kmh = ms * 3.6;
        
        setFormData(prev => ({
          ...prev,
          masMs: ms.toFixed(2),
          masKmh: kmh.toFixed(2)
        }));
      }
    }
  }, [formData.masMeters, formData.masMinutes]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Δημιουργία app_user εάν δεν υπάρχει
  const ensureAppUserExists = async () => {
    if (!user) return null;

    // Πρώτα ελέγχουμε εάν υπάρχει app_user για αυτόν τον auth user
    const { data: existingAppUser, error: checkError } = await supabase
      .from('app_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (existingAppUser) {
      return existingAppUser.id;
    }

    // Εάν δεν υπάρχει, δημιουργούμε έναν νέο
    const { data: newAppUser, error: createError } = await supabase
      .from('app_users')
      .insert({
        auth_user_id: user.id,
        email: user.email || 'unknown@email.com',
        name: user.user_metadata?.full_name || user.email || 'Unknown User',
        role: 'coach' // Ή οποιοσδήποτε default role
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating app_user:', createError);
      throw createError;
    }

    return newAppUser.id;
  };

  const handleSubmit = async () => {
    if (!selectedAthleteId || !user) {
      toast.error("Παρακαλώ επιλέξτε αθλητή");
      return;
    }

    console.log("Starting endurance test submission...");
    console.log("Selected athlete:", selectedAthleteId);
    console.log("User:", user.id);
    console.log("Form data:", formData);

    try {
      // Διασφαλίζουμε ότι υπάρχει app_user για τον τρέχοντα χρήστη
      const appUserId = await ensureAppUserExists();
      
      if (!appUserId) {
        toast.error("Σφάλμα στη δημιουργία χρήστη");
        return;
      }

      console.log("App user ID:", appUserId);

      // Δημιουργία session για αντοχή
      const { data: session, error: sessionError } = await supabase
        .from('endurance_test_sessions')
        .insert({
          athlete_id: selectedAthleteId,
          test_date: selectedDate,
          created_by: appUserId
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      console.log("Session created:", session);

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

      console.log("Endurance data to insert:", enduranceData);

      const { error: dataError } = await supabase
        .from('endurance_test_data')
        .insert(enduranceData);

      if (dataError) {
        console.error('Data insertion error:', dataError);
        throw dataError;
      }

      console.log("Endurance data inserted successfully");

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

      const { error: summaryError } = await supabase
        .from('test_results_summary')
        .insert({
          athlete_id: selectedAthleteId,
          test_type: 'endurance',
          test_date: selectedDate,
          chart_data: chartData
        });

      if (summaryError) {
        console.error('Summary error:', summaryError);
      }

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
      toast.error("Σφάλμα κατά την αποθήκευση: " + (error as any).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Πρώτη σειρά - Βασικά Τεστ Αντοχής */}
      <div className="grid grid-cols-3 gap-3">
        {basicEnduranceFields.map((field) => (
          <Card key={field.key} className="rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-center">{field.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Input
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.key as keyof typeof formData]}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                className="rounded-none h-8 text-xs"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Δεύτερη σειρά - Προχωρημένα Τεστ */}
      <div className="grid grid-cols-3 gap-3">
        {/* Farmer */}
        <Card className="rounded-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Farmer</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div>
              <Label className="text-xs">Βάρος</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="kg"
                value={formData.farmerKg}
                onChange={(e) => handleInputChange('farmerKg', e.target.value)}
                className="rounded-none h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Μέτρα</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="m"
                value={formData.farmerMeters}
                onChange={(e) => handleInputChange('farmerMeters', e.target.value)}
                className="rounded-none h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Χρόνος</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="δευτ."
                value={formData.farmerSeconds}
                onChange={(e) => handleInputChange('farmerSeconds', e.target.value)}
                className="rounded-none h-8 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sprint */}
        <Card className="rounded-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Sprint</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div>
              <Label className="text-xs">Χρόνος</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="δευτ."
                value={formData.sprintSeconds}
                onChange={(e) => handleInputChange('sprintSeconds', e.target.value)}
                className="rounded-none h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Μέτρα</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="m"
                value={formData.sprintMeters}
                onChange={(e) => handleInputChange('sprintMeters', e.target.value)}
                className="rounded-none h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Αντίσταση</Label>
              <Select 
                value={formData.sprintResistance} 
                onValueChange={(value) => handleInputChange('sprintResistance', value)}
              >
                <SelectTrigger className="rounded-none h-8 text-xs">
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
              <Label className="text-xs">Watt</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="W"
                value={formData.sprintWatt}
                onChange={(e) => handleInputChange('sprintWatt', e.target.value)}
                className="rounded-none h-8 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* MAS */}
        <Card className="rounded-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">MAS</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div>
              <Label className="text-xs">Μέτρα</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="m"
                value={formData.masMeters}
                onChange={(e) => handleInputChange('masMeters', e.target.value)}
                className="rounded-none h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Λεπτά</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="λεπτά"
                value={formData.masMinutes}
                onChange={(e) => handleInputChange('masMinutes', e.target.value)}
                className="rounded-none h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">m/s</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="m/s"
                value={formData.masMs}
                readOnly
                className="rounded-none h-8 text-xs bg-gray-100"
              />
            </div>
            <div>
              <Label className="text-xs">km/h</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="km/h"
                value={formData.masKmh}
                readOnly
                className="rounded-none h-8 text-xs bg-gray-100"
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
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
