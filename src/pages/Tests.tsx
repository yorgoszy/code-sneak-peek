import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnthropometricTests } from "@/components/tests/AnthropometricTests";
import { FunctionalTests } from "@/components/tests/FunctionalTests";
import { StrengthTests } from "@/components/tests/StrengthTests";
import { EnduranceTests } from "@/components/tests/EnduranceTests";
import { JumpTests } from "@/components/tests/JumpTests";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
}

// State types για κάθε τύπο τεστ
interface AnthropometricData {
  height: string;
  weight: string;
  bodyFatPercentage: string;
  muscleMassPercentage: string;
  waistCircumference: string;
  hipCircumference: string;
  chestCircumference: string;
  armCircumference: string;
  thighCircumference: string;
}

interface FunctionalData {
  fmsScores: Record<string, number>;
  selectedPosture: string[];
  selectedSquatIssues: string[];
  selectedSingleLegIssues: string[];
}

interface EnduranceData {
  pushUps: string;
  pullUps: string;
  crunches: string;
  maxHr: string;
  restingHr1min: string;
  vo2Max: string;
  farmerKg: string;
  farmerMeters: string;
  farmerSeconds: string;
  sprintSeconds: string;
  sprintMeters: string;
  sprintResistance: string;
  sprintWatt: string;
  masMeters: string;
  masMinutes: string;
  masMs: string;
  masKmh: string;
}

interface JumpData {
  nonCounterMovementJump: string;
  counterMovementJump: string;
  depthJump: string;
  broadJump: string;
  tripleJumpLeft: string;
  tripleJumpRight: string;
}

const Tests = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('anthropometric');

  // State για όλα τα τεστ
  const [anthropometricData, setAnthropometricData] = useState<AnthropometricData>({
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

  const [functionalData, setFunctionalData] = useState<FunctionalData>({
    fmsScores: {},
    selectedPosture: [],
    selectedSquatIssues: [],
    selectedSingleLegIssues: []
  });

  const [enduranceData, setEnduranceData] = useState<EnduranceData>({
    pushUps: '',
    pullUps: '',
    crunches: '',
    maxHr: '',
    restingHr1min: '',
    vo2Max: '',
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

  const [jumpData, setJumpData] = useState<JumpData>({
    nonCounterMovementJump: '',
    counterMovementJump: '',
    depthJump: '',
    broadJump: '',
    tripleJumpLeft: '',
    tripleJumpRight: ''
  });

  // Νέο ref για strength session state (φορμα):
  const strengthSessionRef = useRef<any>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('app_users')
      .select('id, name, email')
      .order('name');
    setUsers(data || []);
  };

  // Βοηθητική για εύρεση ή δημιουργία test_session
  const getOrCreateTestSession = async () => {
    if (!selectedAthleteId || !selectedDate) {
      toast.error("Παρακαλώ επιλέξτε αθλητή & ημερομηνία");
      console.log("❌ Δεν έχει οριστεί selectedAthleteId/selectedDate");
      return null;
    }
    // Check if test_session already exists for this user/date
    let { data: existingSession, error: searchError } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('user_id', selectedAthleteId)
      .eq('test_date', selectedDate)
      .limit(1)
      .maybeSingle();

    if (searchError) {
      toast.error("Σφάλμα αναζήτησης test session");
      console.log("❌ Σφάλμα search test_sessions", searchError);
      return null;
    }

    if (existingSession) {
      console.log("✔️ Υπάρχει ήδη test_session:", existingSession);
      return existingSession;
    }

    // Otherwise create new
    const { data: session, error: sessionError } = await supabase
      .from('test_sessions')
      .insert({
        user_id: selectedAthleteId,
        test_date: selectedDate
      })
      .select()
      .single();

    if (sessionError) {
      toast.error("Σφάλμα δημιουργίας test session");
      console.log("❌ Σφάλμα insert test_session", sessionError);
      return null;
    }
    console.log("✅ test_session ΝΕΟ (id):", session?.id);
    return session;
  };

  const saveAnthropometricData = async () => {
    if (!selectedAthleteId) {
      toast.error("Παρακαλώ επιλέξτε αθλητή");
      return;
    }
    try {
      const hasData = Object.values(anthropometricData).some(value => value !== '');
      if (!hasData) {
        toast.error("Παρακαλώ εισάγετε τουλάχιστον ένα σωματομετρικό δεδομένο");
        return;
      }
      // Βρες/Δημιούργησε test_session
      const testSession = await getOrCreateTestSession();
      if (!testSession) return;

      // Δες αν υπάρχει ήδη anthropometric_test_data για το session
      const { data: prevAnthro } = await supabase
        .from('anthropometric_test_data')
        .select('*')
        .eq('test_session_id', testSession.id)
        .maybeSingle();

      const dataToSave = {
        test_session_id: testSession.id,
        height: anthropometricData.height ? parseFloat(anthropometricData.height) : null,
        weight: anthropometricData.weight ? parseFloat(anthropometricData.weight) : null,
        body_fat_percentage: anthropometricData.bodyFatPercentage ? parseFloat(anthropometricData.bodyFatPercentage) : null,
        muscle_mass_percentage: anthropometricData.muscleMassPercentage ? parseFloat(anthropometricData.muscleMassPercentage) : null,
        waist_circumference: anthropometricData.waistCircumference ? parseFloat(anthropometricData.waistCircumference) : null,
        hip_circumference: anthropometricData.hipCircumference ? parseFloat(anthropometricData.hipCircumference) : null,
        chest_circumference: anthropometricData.chestCircumference ? parseFloat(anthropometricData.chestCircumference) : null,
        arm_circumference: anthropometricData.armCircumference ? parseFloat(anthropometricData.armCircumference) : null,
        thigh_circumference: anthropometricData.thighCircumference ? parseFloat(anthropometricData.thighCircumference) : null
      };

      if (prevAnthro) {
        // Κάνε update
        await supabase
          .from('anthropometric_test_data')
          .update(dataToSave)
          .eq('id', prevAnthro.id);
      } else {
        // Δημιούργησε νέο row
        await supabase.from('anthropometric_test_data').insert(dataToSave);
      }

      toast.success("Σωματομετρικά τεστ καταγράφηκαν επιτυχώς!");
      setAnthropometricData({
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
      toast.error("Σφάλμα κατά την καταγραφή");
    }
  };

  const saveFunctionalData = async () => {
    if (!selectedAthleteId) {
      toast.error("Παρακαλώ επιλέξτε αθλητή");
      return;
    }
    try {
      const hasData = Object.keys(functionalData.fmsScores).length > 0 || 
                    functionalData.selectedPosture.length > 0 || 
                    functionalData.selectedSquatIssues.length > 0 || 
                    functionalData.selectedSingleLegIssues.length > 0;
      if (!hasData) {
        toast.error("Παρακαλώ εισάγετε τουλάχιστον ένα λειτουργικό δεδομένο");
        return;
      }
      const testSession = await getOrCreateTestSession();
      if (!testSession) return;

      // Υπάρχει ήδη για αυτό το session;
      const { data: prevFunc } = await supabase
        .from('functional_test_data')
        .select('*')
        .eq('test_session_id', testSession.id)
        .maybeSingle();

      const dataToSave = {
        test_session_id: testSession.id,
        fms_score: Object.keys(functionalData.fmsScores).length > 0 ? Object.values(functionalData.fmsScores).reduce((a, b) => a + b, 0) : null,
        fms_detailed_scores: Object.keys(functionalData.fmsScores).length > 0 ? functionalData.fmsScores : null,
        posture_issues: functionalData.selectedPosture.length > 0 ? functionalData.selectedPosture : null,
        squat_issues: functionalData.selectedSquatIssues.length > 0 ? functionalData.selectedSquatIssues : null,
        single_leg_squat_issues: functionalData.selectedSingleLegIssues.length > 0 ? functionalData.selectedSingleLegIssues : null
      };

      if (prevFunc) {
        await supabase
          .from('functional_test_data')
          .update(dataToSave)
          .eq('id', prevFunc.id);
      } else {
        await supabase.from('functional_test_data').insert(dataToSave);
      }

      toast.success("Λειτουργικά τεστ καταγράφηκαν επιτυχώς!");
      setFunctionalData({
        fmsScores: {},
        selectedPosture: [],
        selectedSquatIssues: [],
        selectedSingleLegIssues: []
      });
    } catch (error) {
      console.error('Error saving functional data:', error);
      toast.error("Σφάλμα κατά την καταγραφή");
    }
  };

  const saveEnduranceData = async () => {
    if (!selectedAthleteId) {
      toast.error("Παρακαλώ επιλέξτε αθλητή");
      return;
    }
    try {
      const hasData = Object.values(enduranceData).some(value => value !== '');
      if (!hasData) {
        toast.error("Παρακαλώ εισάγετε τουλάχιστον ένα δεδομένο αντοχής");
        return;
      }
      const testSession = await getOrCreateTestSession();
      if (!testSession) return;

      const { data: prevEndu } = await supabase
        .from('endurance_test_data')
        .select('*')
        .eq('test_session_id', testSession.id)
        .maybeSingle();

      const dataToSave = {
        test_session_id: testSession.id,
        push_ups: enduranceData.pushUps ? parseInt(enduranceData.pushUps) : null,
        pull_ups: enduranceData.pullUps ? parseInt(enduranceData.pullUps) : null,
        crunches: enduranceData.crunches ? parseInt(enduranceData.crunches) : null,
        max_hr: enduranceData.maxHr ? parseInt(enduranceData.maxHr) : null,
        resting_hr_1min: enduranceData.restingHr1min ? parseInt(enduranceData.restingHr1min) : null,
        vo2_max: enduranceData.vo2Max ? parseFloat(enduranceData.vo2Max) : null,
        farmer_kg: enduranceData.farmerKg ? parseFloat(enduranceData.farmerKg) : null,
        farmer_meters: enduranceData.farmerMeters ? parseFloat(enduranceData.farmerMeters) : null,
        farmer_seconds: enduranceData.farmerSeconds ? parseFloat(enduranceData.farmerSeconds) : null,
        sprint_seconds: enduranceData.sprintSeconds ? parseFloat(enduranceData.sprintSeconds) : null,
        sprint_meters: enduranceData.sprintMeters ? parseFloat(enduranceData.sprintMeters) : null,
        sprint_resistance: enduranceData.sprintResistance || null,
        sprint_watt: enduranceData.sprintWatt ? parseFloat(enduranceData.sprintWatt) : null,
        mas_meters: enduranceData.masMeters ? parseFloat(enduranceData.masMeters) : null,
        mas_minutes: enduranceData.masMinutes ? parseFloat(enduranceData.masMinutes) : null,
        mas_ms: enduranceData.masMs ? parseFloat(enduranceData.masMs) : null,
        mas_kmh: enduranceData.masKmh ? parseFloat(enduranceData.masKmh) : null
      };

      if (prevEndu) {
        await supabase
          .from('endurance_test_data')
          .update(dataToSave)
          .eq('id', prevEndu.id);
      } else {
        await supabase.from('endurance_test_data').insert(dataToSave);
      }

      toast.success("Τεστ αντοχής καταγράφηκαν επιτυχώς!");
      setEnduranceData({
        pushUps: '',
        pullUps: '',
        crunches: '',
        maxHr: '',
        restingHr1min: '',
        vo2Max: '',
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
      toast.error("Σφάλμα κατά την καταγραφή");
    }
  };

  const saveJumpData = async () => {
    if (!selectedAthleteId) {
      toast.error("Παρακαλώ επιλέξτε αθλητή");
      return;
    }
    try {
      const hasData = Object.values(jumpData).some(value => value !== '');
      if (!hasData) {
        toast.error("Παρακαλώ εισάγετε τουλάχιστον ένα δεδομένο άλματος");
        return;
      }
      const testSession = await getOrCreateTestSession();
      if (!testSession) return;

      const { data: prevJump } = await supabase
        .from('jump_test_data')
        .select('*')
        .eq('test_session_id', testSession.id)
        .maybeSingle();

      const dataToSave = {
        test_session_id: testSession.id,
        non_counter_movement_jump: jumpData.nonCounterMovementJump ? parseFloat(jumpData.nonCounterMovementJump) : null,
        counter_movement_jump: jumpData.counterMovementJump ? parseFloat(jumpData.counterMovementJump) : null,
        depth_jump: jumpData.depthJump ? parseFloat(jumpData.depthJump) : null,
        broad_jump: jumpData.broadJump ? parseFloat(jumpData.broadJump) : null,
        triple_jump_left: jumpData.tripleJumpLeft ? parseFloat(jumpData.tripleJumpLeft) : null,
        triple_jump_right: jumpData.tripleJumpRight ? parseFloat(jumpData.tripleJumpRight) : null
      };

      if (prevJump) {
        await supabase
          .from('jump_test_data')
          .update(dataToSave)
          .eq('id', prevJump.id);
      } else {
        await supabase.from('jump_test_data').insert(dataToSave);
      }

      toast.success("Τεστ αλμάτων καταγράφηκαν επιτυχώς!");
      setJumpData({
        nonCounterMovementJump: '',
        counterMovementJump: '',
        depthJump: '',
        broadJump: '',
        tripleJumpLeft: '',
        tripleJumpRight: ''
      });
    } catch (error) {
      console.error('Error saving jump data:', error);
      toast.error("Σφάλμα κατά την καταγραφή");
    }
  };

  // ΝΕΟ: Αποθήκευση Strength δεδομένων
  const saveStrengthData = async () => {
    if (!selectedAthleteId) {
      toast.error("Παρακαλώ επιλέξτε αθλητή");
      console.log("❌ No selectedAthleteId για Strength");
      return;
    }
    const strengthForm = strengthSessionRef.current;
    // Αν δεν υπάρχει φόρμα ή δεν υπάρχουν ασκήσεις με προσπάθειες, skip
    if (
      !strengthForm ||
      !strengthForm.exercise_tests ||
      strengthForm.exercise_tests.length === 0 ||
      !strengthForm.exercise_tests.some(et => et.exercise_id && et.attempts.length > 0)
    ) {
      console.log("❌ Δεν υπάρχουν strength δεδομένα για αποθήκευση", strengthForm);
      return;
    }

    try {
      // Βρες/Δημιούργησε test_session
      const testSession = await getOrCreateTestSession();
      if (!testSession) {
        console.log("❌ Δεν βρέθηκε/δημιουργήθηκε testSession για Strength");
        return;
      }

      // Προσθέτω log
      console.log("⏺ strength test_session_id:", testSession.id, strengthForm);

      // Σβήσε ό,τι strength_test_data υπάρχει για το session (θα γίνει replace!)
      await supabase
        .from('strength_test_data')
        .delete()
        .eq('test_session_id', testSession.id);

      const toSave: any[] = [];
      strengthForm.exercise_tests.forEach(et => {
        if (!et.exercise_id) return;
        et.attempts.forEach((a: any) => {
          toSave.push({
            test_session_id: testSession.id,
            exercise_id: et.exercise_id,
            attempt_number: a.attempt_number,
            weight_kg: a.weight_kg !== undefined ? parseFloat(a.weight_kg) : null,
            velocity_ms: a.velocity_ms !== undefined ? parseFloat(a.velocity_ms) : null,
            is_1rm: !!a.is_1rm
          });
        });
      });

      if (toSave.length > 0) {
        await supabase.from('strength_test_data').insert(toSave);
        toast.success("Τεστ δύναμης καταγράφηκαν επιτυχώς!");
        if (strengthForm && strengthForm.reset) {
          strengthForm.reset();
        }
        // Force clear στο ref
        if (strengthSessionRef.current) {
          strengthSessionRef.current = { exercise_tests: [] };
        }
        console.log("✔️ Αποθηκεύτηκε strength_test_data σε test_session", testSession.id);
      }
    } catch (error) {
      console.error('Error saving strength data:', error);
      toast.error("Σφάλμα κατά την καταγραφή");
    }
  };

  const handleSaveAllTests = async () => {
    if (!selectedAthleteId) {
      toast.error("Παρακαλώ επιλέξτε αθλητή");
      return;
    }

    try {
      const promises = [];

      if (Object.values(anthropometricData).some(value => value !== '')) {
        promises.push(saveAnthropometricData());
      }
      if (
        Object.keys(functionalData.fmsScores).length > 0 ||
        functionalData.selectedPosture.length > 0 ||
        functionalData.selectedSquatIssues.length > 0 ||
        functionalData.selectedSingleLegIssues.length > 0
      ) {
        promises.push(saveFunctionalData());
      }
      if (Object.values(enduranceData).some(value => value !== '')) {
        promises.push(saveEnduranceData());
      }
      if (Object.values(jumpData).some(value => value !== '')) {
        promises.push(saveJumpData());
      }
      // Strength!
      if (
        strengthSessionRef.current &&
        strengthSessionRef.current.exercise_tests &&
        strengthSessionRef.current.exercise_tests.some(
          (et: any) => et.exercise_id && et.attempts.length > 0
        )
      ) {
        promises.push(saveStrengthData());
      }

      if (promises.length === 0) {
        toast.error("Παρακαλώ εισάγετε δεδομένα σε τουλάχιστον ένα τεστ");
        return;
      }

      await Promise.all(promises);
      toast.success("Όλα τα τεστ αποθηκεύτηκαν επιτυχώς!");

      // Reset all states - including strength session ref
      setAnthropometricData({
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
      setFunctionalData({
        fmsScores: {},
        selectedPosture: [],
        selectedSquatIssues: [],
        selectedSingleLegIssues: []
      });
      setEnduranceData({
        pushUps: '',
        pullUps: '',
        crunches: '',
        maxHr: '',
        restingHr1min: '',
        vo2Max: '',
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
      setJumpData({
        nonCounterMovementJump: '',
        counterMovementJump: '',
        depthJump: '',
        broadJump: '',
        tripleJumpLeft: '',
        tripleJumpRight: ''
      });
      if (strengthSessionRef.current && strengthSessionRef.current.reset) {
        strengthSessionRef.current.reset();
      }
      strengthSessionRef.current = { exercise_tests: [] };
    } catch (error) {
      console.error('Error saving all tests:', error);
      toast.error("Σφάλμα κατά την αποθήκευση");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="flex-1 flex flex-col">
        <nav className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Τεστ</h1>
              <p className="text-sm text-gray-600">
                Διαχείριση τεστ αθλητών
              </p>
            </div>
          </div>
        </nav>

        <div className="flex-1 p-6">
          {/* Επιλογή Αθλητή και Ημερομηνίας */}
          <Card className="rounded-none mb-6">
            <CardHeader>
              <CardTitle>Επιλογή Αθλητή και Ημερομηνίας</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div>
                  <Label>Αθλητής</Label>
                  <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue placeholder="Επιλέξτε αθλητή για τα τεστ" />
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
                <div>
                  <Label>Ημερομηνία Τεστ</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-none"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleSaveAllTests} 
                    className="rounded-none w-full"
                    disabled={!selectedAthleteId}
                  >
                    Αποθήκευση Όλων των Τεστ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedAthleteId && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 rounded-none">
                <TabsTrigger value="anthropometric" className="rounded-none">Σωματομετρικά</TabsTrigger>
                <TabsTrigger value="functional" className="rounded-none">Λειτουργικότητα</TabsTrigger>
                <TabsTrigger value="strength" className="rounded-none">Δύναμη</TabsTrigger>
                <TabsTrigger value="endurance" className="rounded-none">Αντοχή</TabsTrigger>
                <TabsTrigger value="jumps" className="rounded-none">Άλματα</TabsTrigger>
              </TabsList>

              <TabsContent value="anthropometric" className="mt-6">
                <div className="space-y-4">
                  <AnthropometricTests 
                    selectedAthleteId={selectedAthleteId} 
                    selectedDate={selectedDate} 
                    hideSubmitButton={true}
                    formData={anthropometricData}
                    onDataChange={setAnthropometricData}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={saveAnthropometricData}
                      className="rounded-none"
                      disabled={!selectedAthleteId}
                    >
                      Καταγραφή Σωματομετρικών
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="functional" className="mt-6">
                <div className="space-y-4">
                  <FunctionalTests 
                    selectedAthleteId={selectedAthleteId} 
                    selectedDate={selectedDate} 
                    hideSubmitButton={true}
                    formData={functionalData}
                    onDataChange={setFunctionalData}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={saveFunctionalData}
                      className="rounded-none"
                      disabled={!selectedAthleteId}
                    >
                      Καταγραφή Λειτουργικών
                    </Button>
                  </div>
                </div>
              </TabsContent>

            <TabsContent value="strength" className="mt-6">
              {/* ΑΦΑΙΡΩ το έξτρα κουμπί "Αποθήκευση" από το StrengthTests */}
              <div className="mb-4 text-xs text-gray-600">
                Η αποθήκευση στα strength tests γίνεται μόνο από το κουμπί στο κάθε session ("Αποθήκευση" ή "Ενημέρωση" κάτω από το τεστ).
              </div>
              <StrengthTests
                selectedAthleteId={selectedAthleteId}
                selectedDate={selectedDate}
                registerReset={(resetFn: () => void) => {
                  if (!strengthSessionRef.current) strengthSessionRef.current = {};
                  strengthSessionRef.current.reset = resetFn;
                }}
              />
            </TabsContent>

              <TabsContent value="endurance" className="mt-6">
                <div className="space-y-4">
                  <EnduranceTests 
                    selectedAthleteId={selectedAthleteId} 
                    selectedDate={selectedDate} 
                    hideSubmitButton={true}
                    formData={enduranceData}
                    onDataChange={setEnduranceData}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={saveEnduranceData}
                      className="rounded-none"
                      disabled={!selectedAthleteId}
                    >
                      Καταγραφή Αντοχής
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="jumps" className="mt-6">
                <div className="space-y-4">
                  <JumpTests 
                    selectedAthleteId={selectedAthleteId} 
                    selectedDate={selectedDate} 
                    hideSubmitButton={true}
                    formData={jumpData}
                    onDataChange={setJumpData}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={saveJumpData}
                      className="rounded-none"
                      disabled={!selectedAthleteId}
                    >
                      Καταγραφή Αλμάτων
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {!selectedAthleteId && (
            <div className="text-center py-12 text-gray-500">
              <p>Παρακαλώ επιλέξτε αθλητή για να ξεκινήσετε τα τεστ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tests;
