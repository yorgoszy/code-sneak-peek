
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadVelocityChart } from "@/components/charts/LoadVelocityChart";
import { TestBarChart } from "@/components/charts/TestBarChart";
import { FunctionalTestResults } from "@/components/charts/FunctionalTestResults";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  name: string;
  email: string;
}

const Results = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedAthleteId) {
      fetchTestResults();
    }
  }, [selectedAthleteId]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('app_users')
      .select('id, name, email')
      .order('name');
    setUsers(data || []);
  };

  const fetchTestResults = async () => {
    const { data } = await supabase
      .from('test_results_summary')
      .select('*')
      .eq('athlete_id', selectedAthleteId)
      .order('test_date', { ascending: false });
    
    setTestResults(data || []);
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

  const anthropometricData = testResults
    .filter(result => result.test_type === 'anthropometric')
    .slice(0, 1)[0];

  const jumpData = testResults
    .filter(result => result.test_type === 'jump')
    .slice(0, 1)[0];

  const enduranceData = testResults
    .filter(result => result.test_type === 'endurance')
    .slice(0, 1)[0];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="flex-1 flex flex-col">
        <nav className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Αποτελέσματα</h1>
              <p className="text-sm text-gray-600">
                Ανάλυση και σύγκριση αποτελεσμάτων τεστ
              </p>
            </div>
          </div>
        </nav>

        <div className="flex-1 p-6">
          <Card className="rounded-none mb-6">
            <CardHeader>
              <CardTitle>Επιλογή Αθλητή</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md">
                <Label>Αθλητής</Label>
                <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Επιλέξτε αθλητή για προβολή αποτελεσμάτων" />
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
            </CardContent>
          </Card>

          {selectedAthleteId && testResults.length > 0 && (
            <Tabs defaultValue="strength" className="w-full">
              <TabsList className="grid w-full grid-cols-5 rounded-none">
                <TabsTrigger value="strength" className="rounded-none">Δύναμη</TabsTrigger>
                <TabsTrigger value="anthropometric" className="rounded-none">Σωματομετρικά</TabsTrigger>
                <TabsTrigger value="functional" className="rounded-none">Λειτουργικότητα</TabsTrigger>
                <TabsTrigger value="endurance" className="rounded-none">Αντοχή</TabsTrigger>
                <TabsTrigger value="jumps" className="rounded-none">Άλματα</TabsTrigger>
              </TabsList>

              <TabsContent value="strength" className="mt-6">
                <div className="text-center py-12 text-gray-500">
                  <p>Load/Velocity Profiles θα εμφανιστούν εδώ όταν υπάρχουν δεδομένα δύναμης</p>
                </div>
              </TabsContent>

              <TabsContent value="anthropometric" className="mt-6">
                {anthropometricData?.chart_data ? (
                  <TestBarChart
                    data={anthropometricData.chart_data.labels.map((label: string, index: number) => ({
                      name: label,
                      value: anthropometricData.chart_data.values[index],
                      unit: label.includes('%') ? '%' : label === 'Βάρος' ? 'kg' : 'cm'
                    }))}
                    title="Σωματομετρικά Δεδομένα"
                    color="#10b981"
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>Δεν υπάρχουν σωματομετρικά δεδομένα</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="functional" className="mt-6">
                <div className="text-center py-12 text-gray-500">
                  <p>Αποτελέσματα λειτουργικότητας θα εμφανιστούν εδώ</p>
                </div>
              </TabsContent>

              <TabsContent value="endurance" className="mt-6">
                {enduranceData?.chart_data ? (
                  <TestBarChart
                    data={enduranceData.chart_data.labels.map((label: string, index: number) => ({
                      name: label,
                      value: enduranceData.chart_data.values[index]
                    }))}
                    title="Αποτελέσματα Αντοχής"
                    color="#f59e0b"
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>Δεν υπάρχουν δεδομένα αντοχής</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="jumps" className="mt-6">
                {jumpData?.chart_data ? (
                  <TestBarChart
                    data={jumpData.chart_data.labels.map((label: string, index: number) => ({
                      name: label,
                      value: jumpData.chart_data.values[index],
                      unit: label.includes('Triple') || label.includes('Broad') ? 'm' : 'cm'
                    }))}
                    title="Αποτελέσματα Αλμάτων"
                    color="#8b5cf6"
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>Δεν υπάρχουν δεδομένα αλμάτων</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {selectedAthleteId && testResults.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Δεν υπάρχουν αποτελέσματα για αυτόν τον αθλητή</p>
            </div>
          )}

          {!selectedAthleteId && (
            <div className="text-center py-12 text-gray-500">
              <p>Παρακαλώ επιλέξτε αθλητή για προβολή αποτελεσμάτων</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Results;
