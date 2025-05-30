
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const functionalFields = [
  { key: 'fmsScore', label: 'FMS Score', type: 'number', placeholder: 'Βαθμολογία' },
  { key: 'sitAndReach', label: 'Sit & Reach', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'shoulderMobilityLeft', label: 'Κινητικότητα Ώμου Αριστερό', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'shoulderMobilityRight', label: 'Κινητικότητα Ώμου Δεξί', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'flamingoBalance', label: 'Flamingo Balance', type: 'number', placeholder: 'δευτερόλεπτα' }
];

interface FunctionalTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
}

export const FunctionalTests = ({ selectedAthleteId, selectedDate }: FunctionalTestsProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fmsScore: '',
    sitAndReach: '',
    shoulderMobilityLeft: '',
    shoulderMobilityRight: '',
    flamingoBalance: '',
    postureAssessment: '',
    musclesNeedStretching: '',
    musclesNeedStrengthening: ''
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
      // Δημιουργία session για λειτουργικά τεστ
      const { data: session, error: sessionError } = await supabase
        .from('functional_test_sessions')
        .insert({
          athlete_id: selectedAthleteId,
          test_date: selectedDate,
          created_by: user.id
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Αποθήκευση λειτουργικών δεδομένων
      const functionalData = {
        test_session_id: session.id,
        fms_score: formData.fmsScore ? parseInt(formData.fmsScore) : null,
        sit_and_reach: formData.sitAndReach ? parseFloat(formData.sitAndReach) : null,
        shoulder_mobility_left: formData.shoulderMobilityLeft ? parseFloat(formData.shoulderMobilityLeft) : null,
        shoulder_mobility_right: formData.shoulderMobilityRight ? parseFloat(formData.shoulderMobilityRight) : null,
        flamingo_balance: formData.flamingoBalance ? parseInt(formData.flamingoBalance) : null,
        posture_assessment: formData.postureAssessment || null,
        muscles_need_stretching: formData.musclesNeedStretching ? formData.musclesNeedStretching.split(',').map(m => m.trim()) : null,
        muscles_need_strengthening: formData.musclesNeedStrengthening ? formData.musclesNeedStrengthening.split(',').map(m => m.trim()) : null
      };

      const { error: dataError } = await supabase
        .from('functional_test_data')
        .insert(functionalData);

      if (dataError) throw dataError;

      // Δημιουργία summary για γραφήματα
      const chartData = {
        fmsScore: formData.fmsScore || 0,
        musclesStretching: formData.musclesNeedStretching ? formData.musclesNeedStretching.split(',').length : 0,
        musclesStrengthening: formData.musclesNeedStrengthening ? formData.musclesNeedStrengthening.split(',').length : 0,
        sitAndReach: formData.sitAndReach || 0,
        shoulderMobility: (parseFloat(formData.shoulderMobilityLeft || '0') + parseFloat(formData.shoulderMobilityRight || '0')) / 2
      };

      await supabase
        .from('test_results_summary')
        .insert({
          athlete_id: selectedAthleteId,
          test_type: 'functional',
          test_date: selectedDate,
          chart_data: chartData
        });

      toast.success("Τα λειτουργικά δεδομένα αποθηκεύτηκαν επιτυχώς!");
      
      // Reset form
      setFormData({
        fmsScore: '',
        sitAndReach: '',
        shoulderMobilityLeft: '',
        shoulderMobilityRight: '',
        flamingoBalance: '',
        postureAssessment: '',
        musclesNeedStretching: '',
        musclesNeedStrengthening: ''
      });

    } catch (error) {
      console.error('Error saving functional data:', error);
      toast.error("Σφάλμα κατά την αποθήκευση");
    }
  };

  return (
    <div className="space-y-6">
      {/* Μετρήσεις */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {functionalFields.map((field) => (
          <Card key={field.key} className="rounded-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{field.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Input
                type={field.type}
                step={field.step}
                placeholder={field.placeholder}
                value={formData[field.key as keyof typeof formData]}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                className="rounded-none"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Αξιολογήσεις */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="text-sm">Αξιολόγηση Στάσης</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Περιγραφή αξιολόγησης στάσης..."
              value={formData.postureAssessment}
              onChange={(e) => handleInputChange('postureAssessment', e.target.value)}
              className="rounded-none"
            />
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="text-sm">Μύες που Χρειάζονται Διάταση</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="π.χ. Δικέφαλος, Τετρακέφαλος (χωρισμένα με κόμμα)"
              value={formData.musclesNeedStretching}
              onChange={(e) => handleInputChange('musclesNeedStretching', e.target.value)}
              className="rounded-none"
            />
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="text-sm">Μύες που Χρειάζονται Ενδυνάμωση</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="π.χ. Γλουτιαίοι, Κοιλιακοί (χωρισμένα με κόμμα)"
              value={formData.musclesNeedStrengthening}
              onChange={(e) => handleInputChange('musclesNeedStrengthening', e.target.value)}
              className="rounded-none"
            />
          </CardContent>
        </Card>
      </div>

      {/* Κουμπί Αποθήκευσης */}
      <Card className="rounded-none">
        <CardContent className="p-4 flex items-center justify-center">
          <Button onClick={handleSubmit} className="rounded-none w-full max-w-md">
            Αποθήκευση Λειτουργικών Τεστ
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
