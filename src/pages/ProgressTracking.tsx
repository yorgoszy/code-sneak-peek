import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewRecordTab } from "@/components/progress/NewRecordTab";
import { HistoryTab } from "@/components/progress/HistoryTab";
import { EnduranceRecordTab } from "@/components/progress/EnduranceRecordTab";
import { EnduranceHistoryTab } from "@/components/progress/EnduranceHistoryTab";
import { JumpRecordTab } from "@/components/progress/JumpRecordTab";
import { JumpHistoryTab } from "@/components/progress/JumpHistoryTab";
import { AnthropometricRecordTab } from "@/components/progress/AnthropometricRecordTab";
import { AnthropometricHistoryTab } from "@/components/progress/AnthropometricHistoryTab";


export default function ProgressTracking() {
  const [users, setUsers] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchUsers();
    fetchExercises();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const handleRecordSaved = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Καταγραφή Προόδου</h1>

      <Tabs defaultValue="force-velocity" className="w-full">
        <TabsList className="rounded-none w-full grid grid-cols-4">
          <TabsTrigger value="force-velocity" className="rounded-none">
            Force/Velocity
          </TabsTrigger>
          <TabsTrigger value="endurance" className="rounded-none">
            Endurance
          </TabsTrigger>
          <TabsTrigger value="jump-profile" className="rounded-none">
            Jump Profile
          </TabsTrigger>
          <TabsTrigger value="anthropometric" className="rounded-none">
            Σωματομετρικά
          </TabsTrigger>
        </TabsList>

        <TabsContent value="force-velocity" className="mt-6">
          <Tabs defaultValue="new" className="w-full">
            <TabsList className="rounded-none w-full bg-gray-100">
              <TabsTrigger value="new" className="rounded-none flex-1">
                Νέα Καταγραφή
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-none flex-1">
                Ιστορικό
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="mt-6">
              <NewRecordTab 
                users={users} 
                exercises={exercises} 
                onRecordSaved={handleRecordSaved}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <HistoryTab key={refreshKey} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="endurance" className="mt-6">
          <Tabs defaultValue="new" className="w-full">
            <TabsList className="rounded-none w-full bg-gray-100">
              <TabsTrigger value="new" className="rounded-none flex-1">
                Νέα Καταγραφή
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-none flex-1">
                Ιστορικό
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="mt-6">
              <EnduranceRecordTab 
                users={users} 
                exercises={exercises}
                onRecordSaved={handleRecordSaved}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <EnduranceHistoryTab key={refreshKey} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="jump-profile" className="mt-6">
          <Tabs defaultValue="new" className="w-full">
            <TabsList className="rounded-none w-full bg-gray-100">
              <TabsTrigger value="new" className="rounded-none flex-1">
                Νέα Καταγραφή
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-none flex-1">
                Ιστορικό
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="mt-6">
              <JumpRecordTab 
                users={users} 
                onRecordSaved={handleRecordSaved}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <JumpHistoryTab key={refreshKey} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="anthropometric" className="mt-6">
          <AnthropometricRecordTab 
            users={users} 
            onRecordSaved={handleRecordSaved}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
