import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

export const useExpiringHealthCards = (coachId: string | null | undefined) => {
  const [expiringCount, setExpiringCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadExpiringHealthCards = async () => {
    if (!coachId) {
      setExpiringCount(0);
      setLoading(false);
      return;
    }

    try {
      // First get the athletes for this coach
      const { data: athletes, error: athletesError } = await supabase
        .from('app_users')
        .select('id')
        .eq('coach_id', coachId);

      if (athletesError) throw athletesError;

      const athleteIds = athletes?.map(a => a.id) || [];

      if (athleteIds.length === 0) {
        setExpiringCount(0);
        setLoading(false);
        return;
      }

      // Get health cards for these athletes
      const { data: healthCards, error: cardsError } = await supabase
        .from('health_cards')
        .select('id, end_date')
        .in('user_id', athleteIds);

      if (cardsError) throw cardsError;

      // Count cards expiring in less than 60 days (2 months)
      const today = new Date();
      const expiringCards = healthCards?.filter(card => {
        const daysUntilExpiry = differenceInDays(new Date(card.end_date), today);
        return daysUntilExpiry >= 0 && daysUntilExpiry < 60;
      }) || [];

      setExpiringCount(expiringCards.length);
    } catch (error) {
      console.error('Error loading expiring health cards:', error);
      setExpiringCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpiringHealthCards();

    // Real-time subscription for health cards changes
    const channel = supabase
      .channel('health-cards-expiring')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'health_cards'
        },
        () => {
          loadExpiringHealthCards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coachId]);

  return { expiringCount, loading, refresh: loadExpiringHealthCards };
};
