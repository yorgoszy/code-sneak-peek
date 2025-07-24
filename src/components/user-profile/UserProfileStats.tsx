
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Dumbbell, CreditCard, Clock, Check, X, MapPin, Video } from "lucide-react";
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
  const [paymentStatus, setPaymentStatus] = useState<boolean | null>(null);
  const [visitsData, setVisitsData] = useState<{used: number, total: number} | null>(null);
  const [videocallData, setVideocallData] = useState<{used: number, total: number} | null>(null);
  const [upcomingVideocall, setUpcomingVideocall] = useState<{date: string, time: string, daysLeft: number, hoursLeft: number} | null>(null);
  const [upcomingVisit, setUpcomingVisit] = useState<{date: string, time: string, daysLeft: number, hoursLeft: number} | null>(null);
  
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        // Φόρτωση όλων των συνδρομών (ενεργές, σε παύση, ληγμένες)
        const { data: allSubscriptions, error } = await supabase
          .from('user_subscriptions')
          .select('*, subscription_types(name, price)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching all subscriptions:', error);
          setSubscriptionDays(null);
          setPaymentStatus(null);
          return;
        }

        // TODO: Θα προστεθεί αποθήκευση subscription_history μετά την εκτέλεση του migration

        // Φιλτράρισμα για ενεργές συνδρομές μόνο για εμφάνιση ημερών
        const activeSubscriptions = allSubscriptions?.filter(sub => sub.status === 'active') || [];

        // Φόρτωση payment status από την πιο πρόσφατη συνδρομή
        if (allSubscriptions && allSubscriptions.length > 0) {
          const latestSubscription = allSubscriptions[0];
          setPaymentStatus(latestSubscription.is_paid);
        } else {
          setPaymentStatus(null);
        }

        if (activeSubscriptions.length === 0) {
          setSubscriptionDays(null);
          return;
        }

        // Βρες την συνδρομή με τις λιγότερες ημέρες
        let minDays = Infinity;
        let isPausedStatus = false;

        activeSubscriptions.forEach(subscription => {
          if (subscription.is_paused && subscription.paused_days_remaining) {
            if (subscription.paused_days_remaining < minDays) {
              minDays = subscription.paused_days_remaining;
              isPausedStatus = true;
            }
          } else if (!subscription.is_paused) {
            const today = new Date();
            const endDate = new Date(subscription.end_date);
            const remainingDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            
            if (remainingDays < minDays) {
              minDays = remainingDays;
              isPausedStatus = false;
            }
          }
        });

        setSubscriptionDays(minDays === Infinity ? null : minDays);
        setIsPaused(isPausedStatus);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        setSubscriptionDays(null);
      }
    };

    const fetchVisitsData = async () => {
      try {
        // Φόρτωση ενεργών visit packages (ίδια λογική με VisitManagement)
        const { data: visitPackages, error: packagesError } = await supabase
          .from('visit_packages')
          .select('total_visits, remaining_visits, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('purchase_date', { ascending: false });

        if (packagesError) {
          console.error('Error fetching visit packages:', packagesError);
          setVisitsData(null);
          return;
        }

        // Βρες το πιο πρόσφατο ενεργό πακέτο
        const activePackage = visitPackages?.[0];
        
        if (!activePackage) {
          setVisitsData({ used: 0, total: 0 });
          return;
        }

        // Υπολογισμός χρησιμοποιημένων επισκέψεων (ίδια λογική με VisitManagement)
        const usedVisits = activePackage.total_visits - activePackage.remaining_visits;

        setVisitsData({
          used: usedVisits,
          total: activePackage.total_visits
        });

      } catch (error) {
        console.error('Error fetching visits data:', error);
        setVisitsData(null);
      }
    };

    const fetchVideocallData = async () => {
      try {
        // Φόρτωση ενεργών videocall packages
        const { data: videocallPackages, error: packagesError } = await supabase
          .from('videocall_packages')
          .select('total_videocalls, remaining_videocalls, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('purchase_date', { ascending: false });

        if (packagesError) {
          console.error('Error fetching videocall packages:', packagesError);
          setVideocallData(null);
          return;
        }

        // Βρες το πιο πρόσφατο ενεργό πακέτο
        const activePackage = videocallPackages?.[0];
        
        if (!activePackage) {
          setVideocallData({ used: 0, total: 0 });
          return;
        }

        // Υπολογισμός χρησιμοποιημένων βιντεοκλήσεων (ίδια λογική με VideocallManagement)
        const usedVideocalls = activePackage.total_videocalls - activePackage.remaining_videocalls;

        setVideocallData({
          used: usedVideocalls,
          total: activePackage.total_videocalls
        });

      } catch (error) {
        console.error('Error fetching videocall data:', error);
        setVideocallData(null);
      }
    };

    const fetchUpcomingBookings = async () => {
      try {
        const now = new Date();
        
        // Φόρτωση επερχόμενων βιντεοκλήσεων
        const { data: videocallBookings, error: videocallError } = await supabase
          .from('booking_sessions')
          .select('booking_date, booking_time')
          .eq('user_id', user.id)
          .eq('booking_type', 'videocall')
          .eq('status', 'confirmed')
          .gte('booking_date', now.toISOString().split('T')[0])
          .order('booking_date', { ascending: true })
          .order('booking_time', { ascending: true })
          .limit(1);

        if (!videocallError && videocallBookings && videocallBookings.length > 0) {
          const nextVideocall = videocallBookings[0];
          const bookingDateTime = new Date(`${nextVideocall.booking_date} ${nextVideocall.booking_time}`);
          const diffMs = bookingDateTime.getTime() - now.getTime();
          const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          
          setUpcomingVideocall({
            date: nextVideocall.booking_date,
            time: nextVideocall.booking_time,
            daysLeft: Math.max(0, daysLeft),
            hoursLeft: Math.max(0, hoursLeft)
          });
        } else {
          setUpcomingVideocall(null);
        }

        // Φόρτωση επερχόμενων επισκέψεων
        const { data: visitBookings, error: visitError } = await supabase
          .from('booking_sessions')
          .select('booking_date, booking_time')
          .eq('user_id', user.id)
          .eq('booking_type', 'gym_visit')
          .eq('status', 'confirmed')
          .gte('booking_date', now.toISOString().split('T')[0])
          .order('booking_date', { ascending: true })
          .order('booking_time', { ascending: true })
          .limit(1);

        if (!visitError && visitBookings && visitBookings.length > 0) {
          const nextVisit = visitBookings[0];
          const bookingDateTime = new Date(`${nextVisit.booking_date} ${nextVisit.booking_time}`);
          const diffMs = bookingDateTime.getTime() - now.getTime();
          const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          
          setUpcomingVisit({
            date: nextVisit.booking_date,
            time: nextVisit.booking_time,
            daysLeft: Math.max(0, daysLeft),
            hoursLeft: Math.max(0, hoursLeft)
          });
        } else {
          setUpcomingVisit(null);
        }

      } catch (error) {
        console.error('Error fetching upcoming bookings:', error);
        setUpcomingVideocall(null);
        setUpcomingVisit(null);
      }
    };

    if (user?.id) {
      fetchSubscriptionData();
      fetchVisitsData();
      fetchVideocallData();
      fetchUpcomingBookings();
    }
  }, [user?.id]);
  
  return (
    <Card className="rounded-none">
      <CardContent className={isMobile ? "pt-4" : "pt-6"}>
        <div className={`grid gap-4 ${
          isMobile ? 'grid-cols-2' : 'grid-cols-3 md:grid-cols-9'
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
            <div className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {paymentStatus === null ? (
                <span className="text-gray-400">-</span>
              ) : paymentStatus ? (
                <Check className={`mx-auto text-[#00ffba] ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
              ) : (
                <X className={`mx-auto text-red-500 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
              )}
            </div>
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
          <div className="text-center">
            <MapPin className={`mx-auto text-blue-500 mb-2 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
            <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {visitsData ? (
                <span className="text-gray-900">
                  {visitsData.used}/{visitsData.total}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </p>
            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Επισκέψεις</p>
          </div>

          {/* Επερχόμενη Επίσκεψη */}
          <div className="text-center">
            <MapPin className={`mx-auto text-yellow-500 mb-2 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
            <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {upcomingVisit ? (
                upcomingVisit.daysLeft > 0 ? (
                  <span className="text-yellow-600">{upcomingVisit.daysLeft}η {upcomingVisit.hoursLeft}ώ</span>
                ) : upcomingVisit.hoursLeft > 0 ? (
                  <span className="text-yellow-600">{upcomingVisit.hoursLeft}ώ</span>
                ) : (
                  <span className="text-yellow-600">Τώρα!</span>
                )
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </p>
            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Επερχόμενη Επίσκεψη</p>
          </div>

          <div className="text-center">
            <Video className={`mx-auto text-purple-500 mb-2 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
            <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {videocallData ? (
                <span className="text-gray-900">
                  {videocallData.used}/{videocallData.total}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </p>
            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Βιντεοκλήσεις</p>
          </div>
          
          {/* Επερχόμενη Βιντεοκλήση */}
          <div className="text-center">
            <Video className={`mx-auto text-yellow-500 mb-2 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
            <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {upcomingVideocall ? (
                upcomingVideocall.daysLeft > 0 ? (
                  <span className="text-yellow-600">{upcomingVideocall.daysLeft}η {upcomingVideocall.hoursLeft}ώ</span>
                ) : upcomingVideocall.hoursLeft > 0 ? (
                  <span className="text-yellow-600">{upcomingVideocall.hoursLeft}ώ</span>
                ) : (
                  <span className="text-yellow-600">Τώρα!</span>
                )
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </p>
            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Επερχόμενη Βιντεοκλήση</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
