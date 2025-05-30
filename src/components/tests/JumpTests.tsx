
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const jumpFields = [
  { key: 'nonCounterMovementJump', label: 'Non-Counter Movement Jump', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'counterMovementJump', label: 'Counter Movement Jump', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'depthJump', label: 'Depth Jump', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'broadJump', label: 'Broad Jump', type: 'number', step: '0.01', placeholder: 'm' },
  { key: 'tripleJumpLeft', label: 'Triple Jump Αριστερό', type: 'number', step: '0.01', placeholder: 'm' },
  { key: 'tripleJumpRight', label: 'Triple Jump Δεξί', type: 'number', step: '0.01', placeholder: 'm' }
];

interface JumpTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
}

export const JumpTests = ({ selectedAthleteId, selectedDate }: JumpTestsProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nonCounterMovementJump: '',
    counterMovementJump: '',
    depthJump: '',
    broadJump: '',
    tripleJumpLeft: '',
    tripleJumpRight: ''
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

      // Δημιουργία session για άλματα
      const { data: session, error: sessionError } = await supabase
        .from('jump_test_sessions')
        .insert({
          athlete_id: selectedAthleteId,
          test_date: selectedDate,
          created_by: appUserId
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Αποθήκευση δεδομένων αλμάτων
      const jumpData = {
        test_session_id: session.id,
        non_counter_movement_jump: formData.nonCounterMovementJump ? parseFloat(formData.nonCounterMovementJump) : null,
        counter_movement_jump: formData.counterMovementJump ? parseFloat(formData.counterMovementJump) : null,
        depth_jump: formData.depthJump ? parseFloat(formData.depthJump) : null,
        broad_jump: formData.broadJump ? parseFloat(formData.broadJump) : null,
        triple_jump_left: formData.tripleJumpLeft ? parseFloat(formData.tripleJumpLeft) : null,
        triple_jump_right: formData.tripleJumpRight ? parseFloat(formData.tripleJumpRight) : null
      };

      const { error: dataError } = await supabase
        .from('jump_test_data')
        .insert(jumpData);

      if (dataError) throw dataError;

      // Δημιουργία summary για γραφήματα
      const chartData = {
        labels: ['Non-CMJ', 'CMJ', 'Depth Jump', 'Broad Jump', 'Triple L', 'Triple R'],
        values: [
          formData.nonCounterMovementJump || 0,
          formData.counterMovementJump || 0,
          formData.depthJump || 0,
          formData.broadJump || 0,
          formData.tripleJumpLeft || 0,
          formData.tripleJumpRight || 0
        ]
      };

      await supabase
        .from('test_results_summary')
        .insert({
          athlete_id: selectedAthleteId,
          test_type: 'jump',
          test_date: selectedDate,
          chart_data: chartData
        });

      toast.success("Τα δεδομένα αλμάτων αποθηκεύτηκαν επιτυχώς!");
      
      // Reset form
      setFormData({
        nonCounterMovementJump: '',
        counterMovementJump: '',
        depthJump: '',
        broadJump: '',
        tripleJumpLeft: '',
        tripleJumpRight: ''
      });

    } catch (error) {
      console.error('Error saving jump data:', error);
      toast.error("Σφάλμα κατά την αποθήκευση: " + (error as any).message);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {jumpFields.map((field) => (
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
            Αποθήκευση Αλμάτων
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
