import { useQuery } from '@tanstack/react-query';
import { resolveUserSubscriptionScope } from './userSubscriptionScope';

export function useUserSubscriptionScope(userId: string | undefined) {
  const query = useQuery({
    queryKey: ['user-subscription-scope', userId],
    queryFn: () => {
      if (!userId) throw new Error('Missing user ID');
      return resolveUserSubscriptionScope(userId);
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
  return { ...query, isCoachManaged: query.data?.is_coach_managed ?? false, coachId: query.data?.coach_id, loading: query.isPending };
}