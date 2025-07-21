
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Dumbbell, CreditCard, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfileStatsProps {
  user: any;
  stats: {
    athletesCount: number;
    programsCount: number;
    testsCount: number;
    paymentsCount: number;
  };
}

export const UserProfileStats = ({ user, stats }: UserProfileStatsProps) => {
  const isMobile = useIsMobile();
  const [subscriptionDays, setSubscriptionDays] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        const { data: activeSubscription, error } = await supabase
          .from('user_subscriptions')
          .select('end_date, status, is_paused, paused_days_remaining')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !activeSubscription) {
          setSubscriptionDays(null);
          return;
        }

        // Εάν η συνδρομή είναι σε παύση, δείξε τις ημέρες παύσης
        if (activeSubscription.is_paused && activeSubscription.paused_days_remaining) {
          setSubscriptionDays(activeSubscription.paused_days_remaining);
          setIsPaused(true);
          return;
        }
        
        setIsPaused(false);

        const today = new Date();
        const endDate = new Date(activeSubscription.end_date);
        const remainingDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        setSubscriptionDays(remainingDays);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        setSubscriptionDays(null);
      }
    };

    if (user?.id) {
      fetchSubscriptionData();
    }
  }, [user?.id]);
  
  return (
    <Card className="rounded-none">
      <CardContent className={isMobile ? "pt-4" : "pt-6"}>
        <div className={`grid gap-4 ${
          isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-5'
        }`}>
          {user.role === 'trainer' && (
            <div className="text-center">
              <Users className={`mx-auto text-blue-500 mb-2 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
              <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.athletesCount}</p>
              <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Αθλητές</p>
            </div>
          )}
          <div className="text-center">
            <Dumbbell className={`mx-auto text-green-500 mb-2 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
            <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.programsCount}</p>
            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {(user.role === 'trainer' || user.role === 'admin') ? 'Προγράμματα' : 'Ανατεθέντα Προγράμματα'}
            </p>
          </div>
          <div className="text-center">
            <Calendar className={`mx-auto text-purple-500 mb-2 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
            <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.testsCount}</p>
            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Τεστ</p>
          </div>
          <div className="text-center">
            <CreditCard className={`mx-auto text-orange-500 mb-2 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
            <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.paymentsCount}</p>
            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Πληρωμές</p>
          </div>
          <div className="text-center">
            <Clock className={`mx-auto text-[#00ffba] mb-2 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
             <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
               {subscriptionDays !== null ? (
                 isPaused ? (
                   <span className="text-orange-600">{subscriptionDays}</span>
                 ) : subscriptionDays < 0 ? (
                   <span className="text-red-600">Έληξε</span>
                 ) : subscriptionDays === 0 ? (
                   <span className="text-orange-600">Σήμερα</span>
                 ) : subscriptionDays <= 7 ? (
                   <span className="text-orange-600">{subscriptionDays}</span>
                 ) : (
                   <span className="text-green-600">{subscriptionDays}</span>
                 )
               ) : (
                 <span className="text-gray-400">-</span>
               )}
             </p>
            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Μέρες Συνδρομής</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
