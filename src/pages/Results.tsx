import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { TestBarChart } from "@/components/charts/TestBarChart";
import { LoadVelocityChart } from "@/components/charts/LoadVelocityChart";
import { LoadVelocityFilters } from "@/components/charts/LoadVelocityFilters";
import { CombinedLoadVelocityChart } from "@/components/charts/CombinedLoadVelocityChart";
import { AthleteSelector } from "@/components/AthleteSelector";

interface User {
  id: string;
  name: string;
  email: string;
}

interface TestResult {
  test_date: string;
  athlete_name: string;
  test_type: string;
  data: any;
}

const Results = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [activeTab, setActiveTab] = useState("anthropometric");
  
  // Φίλτρα για Load/Velocity
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedAthleteIds.length > 0) {
      fetchTestResults();
    }
  }, [selectedAthleteIds]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('app_users')
      .select('id, name, email')
      .order('name');
    setUsers(data || []);
  };

  const handleAthleteToggle = (athleteId: string) => {
    if (selectedAthleteIds.includes(athleteId)) {
      setSelectedAthleteIds(selectedAthleteIds.filter(id => id !== athleteId));
    } else {
      setSelectedAthleteIds([...selectedAthleteIds, athleteId]);
    }
  };

  const handleSelectAllAthletes = () => {
    if (selectedAthleteIds.length === users.length) {
      setSelectedAthleteIds([]);
    } else {
      setSelectedAthleteIds(users.map(user => user.id));
    }
  };

  const fetchTestResults = async () => {
    if (selectedAthleteIds.length === 0) return;

    try {
      const results: TestResult[] = [];

      // Fetch Anthropometric Tests - updated to use user_id
      const { data: anthropometricData } = await supabase
        .from('anthropometric_test_sessions')
        .select(`
          test_date,
          app_users!user_id(name),
          anthropometric_test_data(*)
        `)
        .in('user_id', selectedAthleteIds)
        .order('test_date', { ascending: false });

      anthropometricData?.forEach(session => {
        if (session.anthropometric_test_data && session.anthropometric_test_data.length > 0) {
          results.push({
            test_date: session.test_date,
            athlete_name: session.app_users?.name || 'Άγνωστος',
            test_type: 'anthropometric',
            data: session.anthropometric_test_data[0]
          });
        }
      });

      // Fetch Strength Tests - updated to use user_id
      const { data: strengthData } = await supabase
        .from('strength_test_sessions')
        .select(`
          test_date,
          app_users!user_id(name),
          strength_test_attempts(*, exercises(name))
        `)
        .in('user_id', selectedAthleteIds)
        .order('test_date', { ascending: false });

      strengthData?.forEach(session => {
        if (session.strength_test_attempts && session.strength_test_attempts.length > 0) {
          results.push({
            test_date: session.test_date,
            athlete_name: session.app_users?.name || 'Άγνωστος',
            test_type: 'strength',
            data: session.strength_test_attempts
          });
        }
      });

      // Fetch Jump Tests - updated to use user_id
      const { data: jumpData } = await supabase
        .from('jump_test_sessions')
        .select(`
          test_date,
          app_users!user_id(name),
          jump_test_data(*)
        `)
        .in('user_id', selectedAthleteIds)
        .order('test_date', { ascending: false });

      jumpData?.forEach(session => {
        if (session.jump_test_data && session.jump_test_data.length > 0) {
          results.push({
            test_date: session.test_date,
            athlete_name: session.app_users?.name || 'Άγνωστος',
            test_type: 'jump',
            data: session.jump_test_data[0]
          });
        }
      });

      // Fetch Endurance Tests - updated to use user_id
      const { data: enduranceData } = await supabase
        .from('endurance_test_sessions')
        .select(`
          test_date,
          app_users!user_id(name),
          endurance_test_data(*)
        `)
        .in('user_id', selectedAthleteIds)
        .order('test_date', { ascending: false });

      enduranceData?.forEach(session => {
        if (session.endurance_test_data && session.endurance_test_data.length > 0) {
          results.push({
            test_date: session.test_date,
            athlete_name: session.app_users?.name || 'Άγνωστος',
            test_type: 'endurance',
            data: session.endurance_test_data[0]
          });
        }
      });

      // Fetch Functional Tests - updated to use user_id
      const { data: functionalData } = await supabase
        .from('functional_test_sessions')
        .select(`
          test_date,
          app_users!user_id(name),
          functional_test_data(*)
        `)
        .in('user_id', selectedAthleteIds)
        .order('test_date', { ascending: false });

      functionalData?.forEach(session => {
        if (session.functional_test_data && session.functional_test_data.length > 0) {
          results.push({
            test_date: session.test_date,
            athlete_name: session.app_users?.name || 'Άγνωστος',
            test_type: 'functional',
            data: session.functional_test_data[0]
          });
        }
      });

      setTestResults(results);
    } catch (error) {
      console.error('Error fetching test results:', error);
    }
  };

  const getAnthropometricChartData = () => {
    const anthropometricResults = testResults.filter(r => r.test_type === 'anthropometric');
    return anthropometricResults.map(result => ({
      name: new Date(result.test_date).toLocaleDateString('el-GR'),
      weight: result.data.weight || 0,
      height: result.data.height || 0,
      body_fat: result.data.body_fat_percentage || 0
    }));
  };

  const getJumpChartData = () => {
    const jumpResults = testResults.filter(r => r.test_type === 'jump');
    return jumpResults.map(result => ({
      name: new Date(result.test_date).toLocaleDateString('el-GR'),
      cmj: result.data.counter_movement_jump || 0,
      broad_jump: result.data.broad_jump || 0,
      triple_jump_right: result.data.triple_jump_right || 0
    }));
  };

  const getEnduranceChartData = () => {
    const enduranceResults = testResults.filter(r => r.test_type === 'endurance');
    return enduranceResults.map(result => ({
      name: new Date(result.test_date).toLocaleDateString('el-GR'),
      push_ups: result.data.push_ups || 0,
      pull_ups: result.data.pull_ups || 0,
      vo2_max: result.data.vo2_max || 0
    }));
  };

  const getFunctionalChartData = () => {
    const functionalResults = testResults.filter(r => r.test_type === 'functional');
    return functionalResults.map(result => ({
      name: new Date(result.test_date).toLocaleDateString('el-GR'),
      fms_score: result.data.fms_score || 0,
      posture_issues: result.data.posture_issues?.length || 0,
      squat_issues: result.data.squat_issues?.length || 0,
      single_leg_issues: result.data.single_leg_squat_issues?.length || 0
    }));
  };

  const getStrengthChartData = () => {
    const strengthResults = testResults.filter(r => r.test_type === 'strength');
    const chartData: any[] = [];
    
    strengthResults.forEach(result => {
      result.data.forEach((attempt: any) => {
        if (attempt.exercises?.name) {
          chartData.push({
            exerciseName: attempt.exercises.name,
            velocity: attempt.velocity_ms,
            weight: attempt.weight_kg,
            date: result.test_date
          });
        }
      });
    });
    
    return chartData;
  };

  const getAvailableExercises = () => {
    const strengthData = getStrengthChartData();
    return [...new Set(strengthData.map(d => d.exerciseName))];
  };

  const getAvailableDates = () => {
    const strengthData = getStrengthChartData();
    return [...new Set(strengthData.map(d => d.date))].sort();
  };

  const getFilteredStrengthData = () => {
    const strengthData = getStrengthChartData();
    return strengthData.filter(d => {
      const exerciseMatch = selectedExercises.length === 0 || selectedExercises.includes(d.exerciseName);
      const dateMatch = selectedDates.length === 0 || selectedDates.includes(d.date);
      return exerciseMatch && dateMatch;
    });
  };

  const handleExerciseToggle = (exercise: string) => {
    if (selectedExercises.includes(exercise)) {
      setSelectedExercises(selectedExercises.filter(e => e !== exercise));
    } else {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  const handleDateToggle = (date: string) => {
    if (selectedDates.includes(date)) {
      setSelectedDates(selectedDates.filter(d => d !== date));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleSelectAllExercises = () => {
    const availableExercises = getAvailableExercises();
    if (selectedExercises.length === availableExercises.length) {
      setSelectedExercises([]);
    } else {
      setSelectedExercises(availableExercises);
    }
  };

  const handleSelectAllDates = () => {
    const availableDates = getAvailableDates();
    if (selectedDates.length === availableDates.length) {
      setSelectedDates([]);
    } else {
      setSelectedDates(availableDates);
    }
  };

  const handleDeselectAllExercises = () => {
    setSelectedExercises([]);
  };

  const handleDeselectAllDates = () => {
    setSelectedDates([]);
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
              <h1 className="text-2xl font-bold text-gray-900">Αποτελέσματα</h1>
              <p className="text-sm text-gray-600">
                Γραφικές παραστάσεις και συγκρίσεις τεστ
              </p>
            </div>
          </div>
        </nav>

        <div className="flex-1 p-6">
          <AthleteSelector
            selectedAthleteIds={selectedAthleteIds}
            onAthleteToggle={handleAthleteToggle}
            onSelectAll={handleSelectAllAthletes}
          />

          {selectedAthleteIds.length > 0 && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 rounded-none">
                <TabsTrigger value="anthropometric" className="rounded-none">Σωματομετρικά</TabsTrigger>
                <TabsTrigger value="functional" className="rounded-none">Λειτουργικότητα</TabsTrigger>
                <TabsTrigger value="strength" className="rounded-none">Δύναμη</TabsTrigger>
                <TabsTrigger value="endurance" className="rounded-none">Αντοχή</TabsTrigger>
                <TabsTrigger value="jumps" className="rounded-none">Άλματα</TabsTrigger>
              </TabsList>

              <TabsContent value="anthropometric" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TestBarChart
                    data={getAnthropometricChartData().map(d => ({ name: d.name, value: d.weight, unit: 'kg' }))}
                    title="Βάρος (kg)"
                    color="#10B981"
                  />
                  <TestBarChart
                    data={getAnthropometricChartData().map(d => ({ name: d.name, value: d.body_fat, unit: '%' }))}
                    title="Ποσοστό Λίπους (%)"
                    color="#F59E0B"
                  />
                </div>
              </TabsContent>

              <TabsContent value="functional" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TestBarChart
                    data={getFunctionalChartData().map(d => ({ name: d.name, value: d.fms_score, unit: '' }))}
                    title="FMS Score"
                    color="#9333EA"
                  />
                  <TestBarChart
                    data={getFunctionalChartData().map(d => ({ name: d.name, value: d.posture_issues, unit: '' }))}
                    title="Προβλήματα Στάσης"
                    color="#DC2626"
                  />
                  <TestBarChart
                    data={getFunctionalChartData().map(d => ({ name: d.name, value: d.squat_issues, unit: '' }))}
                    title="Προβλήματα Καθημάτων"
                    color="#EA580C"
                  />
                  <TestBarChart
                    data={getFunctionalChartData().map(d => ({ name: d.name, value: d.single_leg_issues, unit: '' }))}
                    title="Προβλήματα Μονοποδικών Καθημάτων"
                    color="#CA8A04"
                  />
                </div>
              </TabsContent>

              <TabsContent value="strength" className="mt-6">
                {getStrengthChartData().length > 0 && (
                  <div className="space-y-6">
                    <LoadVelocityFilters
                      availableExercises={getAvailableExercises()}
                      availableDates={getAvailableDates()}
                      selectedExercises={selectedExercises}
                      selectedDates={selectedDates}
                      onExerciseToggle={handleExerciseToggle}
                      onDateToggle={handleDateToggle}
                      onSelectAllExercises={handleSelectAllExercises}
                      onSelectAllDates={handleSelectAllDates}
                      onDeselectAllExercises={handleDeselectAllExercises}
                      onDeselectAllDates={handleDeselectAllDates}
                    />
                    
                    {getFilteredStrengthData().length > 0 && selectedExercises.length > 1 ? (
                      <CombinedLoadVelocityChart data={getFilteredStrengthData()} />
                    ) : (
                      Object.entries(
                        getFilteredStrengthData().reduce((acc: any, curr) => {
                          if (!acc[curr.exerciseName]) acc[curr.exerciseName] = [];
                          acc[curr.exerciseName].push(curr);
                          return acc;
                        }, {})
                      ).map(([exerciseName, data]: [string, any]) => (
                        <LoadVelocityChart
                          key={exerciseName}
                          data={data}
                          exerciseName={exerciseName}
                        />
                      ))
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="endurance" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TestBarChart
                    data={getEnduranceChartData().map(d => ({ name: d.name, value: d.push_ups, unit: '' }))}
                    title="Push-ups"
                    color="#8B5CF6"
                  />
                  <TestBarChart
                    data={getEnduranceChartData().map(d => ({ name: d.name, value: d.vo2_max, unit: 'ml/kg/min' }))}
                    title="VO2 Max"
                    color="#EF4444"
                  />
                </div>
              </TabsContent>

              <TabsContent value="jumps" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TestBarChart
                    data={getJumpChartData().map(d => ({ name: d.name, value: d.cmj, unit: 'cm' }))}
                    title="Counter Movement Jump (cm)"
                    color="#06B6D4"
                  />
                  <TestBarChart
                    data={getJumpChartData().map(d => ({ name: d.name, value: d.broad_jump, unit: 'cm' }))}
                    title="Broad Jump (cm)"
                    color="#84CC16"
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          {selectedAthleteIds.length > 0 && testResults.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Δεν βρέθηκαν αποτελέσματα τεστ για τους επιλεγμένους αθλητές</p>
            </div>
          )}

          {selectedAthleteIds.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Παρακαλώ επιλέξτε αθλητές για να δείτε τα αποτελέσματα</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Results;
