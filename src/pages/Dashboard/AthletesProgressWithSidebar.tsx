import { Sidebar } from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { UserProfileHistory } from "@/components/user-profile/UserProfileHistory";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";

export const AthletesProgressWithSidebar = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email')
        .order('name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
  };

  if (loading) {
    return <CustomLoadingScreen />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50">
        <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Πρόοδος Αθλητών</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Επιλέξτε Αθλητή
                      </label>
                      <Select value={selectedUserId} onValueChange={handleUserSelect}>
                        <SelectTrigger className="w-full md:w-96 rounded-none">
                          <SelectValue placeholder="Επιλέξτε χρήστη..." />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedUserId && (
                      <div className="mt-6">
                        <UserProfileHistory userId={selectedUserId} />
                      </div>
                    )}

                    {!selectedUserId && (
                      <div className="text-center py-12 text-gray-500">
                        Επιλέξτε έναν αθλητή για να δείτε την πρόοδό του
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
