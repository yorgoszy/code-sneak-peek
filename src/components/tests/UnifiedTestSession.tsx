
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AnthropometricTestsForm } from "./unified/AnthropometricTestsForm";
import { FunctionalTestsForm } from "./unified/FunctionalTestsForm";
import { EnduranceTestsForm } from "./unified/EnduranceTestsForm";
import { JumpTestsForm } from "./unified/JumpTestsForm";
import { StrengthTestsForm } from "./unified/StrengthTestsForm";

interface UnifiedTestSessionProps {
  selectedAthleteId: string;
  selectedDate: string;
}

export const UnifiedTestSession = ({ selectedAthleteId, selectedDate }: UnifiedTestSessionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notes, setNotes] = useState("");
  const [anthropometricData, setAnthropometricData] = useState({});
  const [functionalData, setFunctionalData] = useState({});
  const [enduranceData, setEnduranceData] = useState({});
  const [jumpData, setJumpData] = useState({});
  const [strengthData, setStrengthData] = useState({});

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

  const handleSaveAll = async () => {
    if (!selectedAthleteId || !user) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε αθλητή",
        variant: "destructive"
      });
      return;
    }

    try {
      const appUserId = await ensureAppUserExists();
      
      if (!appUserId) {
        toast({
          title: "Σφάλμα",
          description: "Σφάλμα στη δημιουργία χρήστη",
          variant: "destructive"
        });
        return;
      }

      // Δημιουργία ενιαίας συνεδρίας τεστ
      const { data: session, error: sessionError } = await supabase
        .from('unified_test_sessions')
        .insert({
          user_id: selectedAthleteId,
          test_date: selectedDate,
          notes: notes,
          created_by: appUserId
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Αποθήκευση σωματομετρικών δεδομένων αν υπάρχουν
      if (Object.keys(anthropometricData).length > 0) {
        await supabase
          .from('unified_anthropometric_data')
          .insert({
            session_id: session.id,
            ...anthropometricData
          });
      }

      // Αποθήκευση λειτουργικών δεδομένων αν υπάρχουν
      if (Object.keys(functionalData).length > 0) {
        await supabase
          .from('unified_functional_data')
          .insert({
            session_id: session.id,
            ...functionalData
          });
      }

      // Αποθήκευση δεδομένων αντοχής αν υπάρχουν
      if (Object.keys(enduranceData).length > 0) {
        await supabase
          .from('unified_endurance_data')
          .insert({
            session_id: session.id,
            ...enduranceData
          });
      }

      // Αποθήκευση δεδομένων αλμάτων αν υπάρχουν
      if (Object.keys(jumpData).length > 0) {
        await supabase
          .from('unified_jump_data')
          .insert({
            session_id: session.id,
            ...jumpData
          });
      }

      // Αποθήκευση δεδομένων δύναμης αν υπάρχουν (διατηρούμε την υπάρχουσα δομή)
      if (Object.keys(strengthData).length > 0) {
        // Εδώ θα προσθέσουμε τη λογική για τα τεστ δύναμης αργότερα
        console.log('Strength data to save:', strengthData);
      }

      toast({
        title: "Επιτυχία",
        description: "Όλα τα τεστ αποθηκεύτηκαν επιτυχώς!"
      });

      // Reset όλων των forms
      setNotes("");
      setAnthropometricData({});
      setFunctionalData({});
      setEnduranceData({});
      setJumpData({});
      setStrengthData({});

    } catch (error) {
      console.error('Error saving unified test session:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά την αποθήκευση: " + (error as any).message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Σημειώσεις Συνεδρίας */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Σημειώσεις Συνεδρίας Τεστ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="session-notes">Γενικές Παρατηρήσεις</Label>
            <Textarea
              id="session-notes"
              placeholder="Προσθέστε σημειώσεις για τη συνεδρία τεστ..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Σωματομετρικά Τεστ */}
      <AnthropometricTestsForm 
        data={anthropometricData}
        onChange={setAnthropometricData}
      />

      {/* Λειτουργικά Τεστ */}
      <FunctionalTestsForm 
        data={functionalData}
        onChange={setFunctionalData}
      />

      {/* Τεστ Αντοχής */}
      <EnduranceTestsForm 
        data={enduranceData}
        onChange={setEnduranceData}
      />

      {/* Τεστ Αλμάτων */}
      <JumpTestsForm 
        data={jumpData}
        onChange={setJumpData}
      />

      {/* Τεστ Δύναμης */}
      <StrengthTestsForm 
        data={strengthData}
        onChange={setStrengthData}
        selectedAthleteId={selectedAthleteId}
        selectedDate={selectedDate}
      />

      {/* Κουμπί Αποθήκευσης Όλων */}
      <Card className="rounded-none">
        <CardContent className="p-6">
          <Button 
            onClick={handleSaveAll} 
            className="rounded-none w-full text-lg py-4"
            size="lg"
          >
            Αποθήκευση Όλων των Τεστ
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
