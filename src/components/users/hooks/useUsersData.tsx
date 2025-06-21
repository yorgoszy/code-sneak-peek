
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppUser } from "../types";

export const useUsersData = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchUsers = async () => {
    if (loadingUsers) return;
    
    setLoadingUsers(true);
    try {
      console.log('📊 Fetching users...');
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching users:', error);
      } else {
        console.log('✅ Users fetched:', data?.length);
        setUsers(data || []);
      }
    } catch (error) {
      console.error('💥 Error:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loadingUsers,
    fetchUsers
  };
};
