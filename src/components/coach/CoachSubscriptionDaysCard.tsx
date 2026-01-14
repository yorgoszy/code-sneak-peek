import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO } from "date-fns";

interface CoachSubscriptionDaysCardProps {
  coachId: string;
}

export const CoachSubscriptionDaysCard: React.FC<CoachSubscriptionDaysCardProps> = ({ coachId }) => {
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (coachId) {
      fetchSubscriptionDays();
    }
  }, [coachId]);

  const fetchSubscriptionDays = async () => {
    try {
      setLoading(true);
      
      // Get coach profile with subscription end date
      const { data: profile, error } = await supabase
        .from('coach_profiles')
        .select('subscription_end_date')
        .eq('coach_id', coachId)
        .single();

      if (error || !profile?.subscription_end_date) {
        setRemainingDays(null);
        return;
      }

      const endDate = parseISO(profile.subscription_end_date);
      const today = new Date();
      const days = differenceInDays(endDate, today);
      
      setRemainingDays(Math.max(0, days));
    } catch (error) {
      console.error('Error fetching subscription days:', error);
      setRemainingDays(null);
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = () => {
    if (remainingDays === null) return 'text-gray-500';
    if (remainingDays <= 7) return 'text-red-600';
    if (remainingDays <= 30) return 'text-yellow-600';
    return 'text-[#00ffba]';
  };

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#cb8954]" />
            HYPERsync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-400 text-sm">Φόρτωση...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#cb8954]" />
          HYPERsync
        </CardTitle>
      </CardHeader>
      <CardContent>
        {remainingDays !== null ? (
          <div className="space-y-1">
            <div className={`text-2xl font-bold ${getColorClass()}`}>
              {remainingDays}
            </div>
            <p className="text-xs text-gray-500">
              {remainingDays === 1 ? 'ημέρα απομένει' : 'ημέρες απομένουν'}
            </p>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">
            Δεν υπάρχει ενεργή συνδρομή
          </div>
        )}
      </CardContent>
    </Card>
  );
};
