
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper to index users by id for easy lookup
 */
export const useUserNamesMap = () => {
  const [usersMap, setUsersMap] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    async function fetchUsers() {
      const { data: users, error } = await supabase
        .from('app_users')
        .select('id, name');
      if (!error && users) {
        setUsersMap(new Map(users.map(u => [u.id, u.name])));
      }
    }
    fetchUsers();
  }, []);
  return usersMap;
};
