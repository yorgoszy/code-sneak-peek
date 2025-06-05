
import { supabase } from "@/integrations/supabase/client";

export const getUserId = async (authUserId?: string) => {
  if (!authUserId) return null;
  
  const { data: userData } = await supabase
    .from('app_users')
    .select('id')
    .eq('auth_user_id', authUserId)
    .single();
  
  return userData?.id || null;
};
