
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnifiedTestSession } from "@/components/tests/UnifiedTestSession";
import { AnthropometricTests } from "@/components/tests/AnthropometricTests";
import { FunctionalTests } from "@/components/tests/FunctionalTests";
import { StrengthTests } from "@/components/tests/StrengthTests";
import { EnduranceTests } from "@/components/tests/EnduranceTests";
import { JumpTests } from "@/components/tests/JumpTests";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

const Tests = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [users, setUsers] = useState<User[]>([]);

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
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
              </div>
            </CardContent>
          </Card>

          {selectedAthleteId && (
            <Tabs defaultValue="unified" className="w-full">
              <TabsList className="grid w-full grid-cols-6 rounded-none">
                <TabsTrigger value="unified" className="rounded-none">Ενιαία Συνεδρία</TabsTrigger>
                <TabsTrigger value="anthropometric" className="rounded-none">Σωματομετρικά</TabsTrigger>
                <TabsTrigger value="functional" className="rounded-none">Λειτουργικότητα</TabsTrigger>
                <TabsTrigger value="strength" className="rounded-none">Δύναμη</TabsTrigger>
                <TabsTrigger value="endurance" className="rounded-none">Αντοχή</TabsTrigger>
                <TabsTrigger value="jumps" className="rounded-none">Άλματα</TabsTrigger>
              </TabsList>

              <TabsContent value="unified" className="mt-6">
                <UnifiedTestSession selectedAthleteId={selectedAthleteId} selectedDate={selectedDate} />
              </TabsContent>

              <TabsContent value="anthropometric" className="mt-6">
                <AnthropometricTests selectedAthleteId={selectedAthleteId} selectedDate={selectedDate} />
              </TabsContent>

              <TabsContent value="functional" className="mt-6">
                <FunctionalTests selectedAthleteId={selectedAthleteId} selectedDate={selectedDate} />
              </TabsContent>

              <TabsContent value="strength" className="mt-6">
                <StrengthTests selectedAthleteId={selectedAthleteId} selectedDate={selectedDate} />
              </TabsContent>

              <TabsContent value="endurance" className="mt-6">
                <EnduranceTests selectedAthleteId={selectedAthleteId} selectedDate={selectedDate} />
              </TabsContent>

              <TabsContent value="jumps" className="mt-6">
                <JumpTests selectedAthleteId={selectedAthleteId} selectedDate={selectedDate} />
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
