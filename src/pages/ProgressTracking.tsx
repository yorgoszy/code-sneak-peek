import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewRecordTab } from "@/components/progress/NewRecordTab";
import { HistoryTab } from "@/components/progress/HistoryTab";


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

      <Tabs defaultValue="new" className="w-full">
        <TabsList className="rounded-none w-full">
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
    </div>
  );
}
