import { supabase } from '@/integrations/supabase/client';

export type UserSubscriptionScope = { coach_id: string | null; is_coach_managed: boolean; owner_role: string | null };

export async function resolveUserSubscriptionScope(userId: string): Promise<UserSubscriptionScope> {
  const { data, error } = await supabase.rpc('get_user_subscription_scope', { p_user_id: userId });
  if (error) throw error;
  const scope = data?.[0];
  if (!scope) throw new Error('User subscription scope is not accessible');
  return scope;
}
