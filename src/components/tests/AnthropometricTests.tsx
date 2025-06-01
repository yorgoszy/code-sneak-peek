
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const anthropometricFields = [
  { key: 'height', label: 'Ύψος', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'weight', label: 'Βάρος', type: 'number', step: '0.1', placeholder: 'kg' },
  { key: 'bodyFatPercentage', label: 'Ποσοστό Λίπους', type: 'number', step: '0.1', placeholder: '%' },
  { key: 'muscleMassPercentage', label: 'Ποσοστό Μυϊκής Μάζας', type: 'number', step: '0.1', placeholder: '%' },
  { key: 'waistCircumference', label: 'Περίμετρος Μέσης', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'hipCircumference', label: 'Περίμετρος Γοφών', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'chestCircumference', label: 'Περίμετρος Στήθους', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'armCircumference', label: 'Περίμετρος Βραχίονα', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'thighCircumference', label: 'Περίμετρος Μηρού', type: 'number', step: '0.1', placeholder: 'cm' }
];

interface AnthropometricTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
}

export const AnthropometricTests = ({ selectedAthleteId, selectedDate }: AnthropometricTestsProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    bodyFatPercentage: '',
    muscleMassPercentage: '',
    waistCircumference: '',
    hipCircumference: '',
    chestCircumference: '',
    armCircumference: '',
    thighCircumference: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Δημιουργία app_user εάν δεν υπάρχει
  const ensureAppUserExists = async () => {
    if (!user) return null;

    const { data: existingAppUser, error: checkError } = await supabase
      .from('app_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (existingAppUser) {
      return existingAppUser.id;
    }

    if (checkError) {
      console.error('Error checking app_user:', checkError);
    }

    const { data: newAppUser, error: createError } = await supabase
      .from('app_users')
      .insert({
        auth_user_id: user.id,
        email: user.email || 'unknown@email.com',
        name: user.user_metadata?.full_name || user.email || 'Unknown User',
        role: 'coach'
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

    try {
      const appUserId = await ensureAppUserExists();
      
      if (!appUserId) {
        toast.error("Σφάλμα στη δημιουργία χρήστη");
        return;
      }

      // Δημιουργία session για σωματομετρικά - χρησιμοποιώ user_id
      const { data: session, error: sessionError } = await supabase
        .from('anthropometric_test_sessions')
        .insert({
          user_id: selectedAthleteId,
          test_date: selectedDate,
          created_by: appUserId
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Αποθήκευση σωματομετρικών δεδομένων
      const anthropometricData = {
        test_session_id: session.id,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        body_fat_percentage: formData.bodyFatPercentage ? parseFloat(formData.bodyFatPercentage) : null,
        muscle_mass_percentage: formData.muscleMassPercentage ? parseFloat(formData.muscleMassPercentage) : null,
        waist_circumference: formData.waistCircumference ? parseFloat(formData.waistCircumference) : null,
        hip_circumference: formData.hipCircumference ? parseFloat(formData.hipCircumference) : null,
        chest_circumference: formData.chestCircumference ? parseFloat(formData.chestCircumference) : null,
        arm_circumference: formData.armCircumference ? parseFloat(formData.armCircumference) : null,
        thigh_circumference: formData.thighCircumference ? parseFloat(formData.thighCircumference) : null
      };

      const { error: dataError } = await supabase
        .from('anthropometric_test_data')
        .insert(anthropometricData);

      if (dataError) throw dataError;

      // Δημιουργία summary για γραφήματα - χρησιμοποιώ user_id
      const chartData = {
        labels: ['Ύψος', 'Βάρος', 'Λίπος %', 'Μυϊκή Μάζα %', 'Μέση', 'Γοφοί', 'Στήθος', 'Βραχίονας', 'Μηρός'],
        values: [
          formData.height || 0,
          formData.weight || 0,
          formData.bodyFatPercentage || 0,
          formData.muscleMassPercentage || 0,
          formData.waistCircumference || 0,
          formData.hipCircumference || 0,
          formData.chestCircumference || 0,
          formData.armCircumference || 0,
          formData.thighCircumference || 0
        ]
      };

      await supabase
        .from('test_results_summary')
        .insert({
          user_id: selectedAthleteId,
          test_type: 'anthropometric',
          test_date: selectedDate,
          chart_data: chartData
        });

      toast.success("Τα σωματομετρικά δεδομένα αποθηκεύτηκαν επιτυχώς!");
      
      // Reset form
      setFormData({
        height: '',
        weight: '',
        bodyFatPercentage: '',
        muscleMassPercentage: '',
        waistCircumference: '',
        hipCircumference: '',
        chestCircumference: '',
        armCircumference: '',
        thighCircumference: ''
      });

    } catch (error) {
      console.error('Error saving anthropometric data:', error);
      toast.error("Σφάλμα κατά την αποθήκευση: " + (error as any).message);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {anthropometricFields.map((field) => (
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
      
      <Card className="rounded-none">
        <CardContent className="p-4 flex items-center justify-center">
          <Button onClick={handleSubmit} className="rounded-none w-full">
            Αποθήκευση Σωματομετρικών
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
