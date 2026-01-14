import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CoachSubscriptionStatus {
  isActive: boolean;
  subscriptionEndDate: string | null;
  isLoading: boolean;
}

type CachedStatus = {
  isActive: boolean;
  subscriptionEndDate: string | null;
  updatedAt: number;
};

// Simple in-memory cache to avoid sidebar "lock/unlock" flicker on navigation.
// (Persists for the lifetime of the tab.)
const coachStatusCache = new Map<string, CachedStatus>();

const computeIsActive = (isActiveFlag?: boolean | null, endDate?: string | null) => {
  const isSubscriptionActive = isActiveFlag === true;
  if (!endDate) return isSubscriptionActive;
  return isSubscriptionActive && new Date(endDate) > new Date();
};

export const useCoachSubscriptionStatus = (coachId?: string): CoachSubscriptionStatus => {
  const cached = coachId ? coachStatusCache.get(coachId) : undefined;

  // Start from cache (if available) so the sidebar doesn't disable items while we refetch.
  const [isActive, setIsActive] = useState<boolean>(cached?.isActive ?? false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(
    cached?.subscriptionEndDate ?? null
  );
  const [isLoading, setIsLoading] = useState<boolean>(coachId ? !cached : false);

  const fetchStatus = useCallback(async () => {
    if (!coachId) {
      setIsLoading(false);
      return;
    }

    // If we already have cached data, keep isLoading false to prevent UI flicker.
    const hasCache = coachStatusCache.has(coachId);
    if (!hasCache) setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('is_active, subscription_end_date')
        .eq('coach_id', coachId)
        .single();

      if (error) {
        console.error('Error fetching coach subscription status:', error);
        const next: CachedStatus = { isActive: false, subscriptionEndDate: null, updatedAt: Date.now() };
        coachStatusCache.set(coachId, next);
        setIsActive(next.isActive);
        setSubscriptionEndDate(next.subscriptionEndDate);
        return;
      }

      const endDate = data?.subscription_end_date ?? null;
      const nextIsActive = computeIsActive(data?.is_active, endDate);

      const next: CachedStatus = {
        isActive: nextIsActive,
        subscriptionEndDate: endDate,
        updatedAt: Date.now(),
      };

      coachStatusCache.set(coachId, next);
      setIsActive(next.isActive);
      setSubscriptionEndDate(next.subscriptionEndDate);
    } catch (error) {
      console.error('Error in fetchStatus:', error);
      if (coachId) {
        const next: CachedStatus = { isActive: false, subscriptionEndDate: null, updatedAt: Date.now() };
        coachStatusCache.set(coachId, next);
        setIsActive(next.isActive);
        setSubscriptionEndDate(next.subscriptionEndDate);
      }
    } finally {
      setIsLoading(false);
    }
  }, [coachId]);

  // When coachId changes, hydrate immediately from cache (if present)
  useEffect(() => {
    if (!coachId) return;

    const nextCached = coachStatusCache.get(coachId);
    if (nextCached) {
      setIsActive(nextCached.isActive);
      setSubscriptionEndDate(nextCached.subscriptionEndDate);
      setIsLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { isActive, subscriptionEndDate, isLoading };
};

