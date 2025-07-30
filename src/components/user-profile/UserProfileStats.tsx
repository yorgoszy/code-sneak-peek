
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Dumbbell, CreditCard, Clock, Check, X, MapPin, Video, ShoppingBag, Tag, Pause, FileText, User, MessageCircle, Gift, Hand, MousePointer, MousePointer2, Pointer, Fingerprint } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [subscriptionDays, setSubscriptionDays] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<boolean | null>(null);
  const [visitsData, setVisitsData] = useState<{used: number, total: number} | null>(null);
  const [videocallData, setVideocallData] = useState<{used: number, total: number} | null>(null);
  const [upcomingVideocall, setUpcomingVideocall] = useState<{date: string, time: string, daysLeft: number, hoursLeft: number, minutesLeft: number, room_url?: string} | null>(null);
  const [upcomingVisit, setUpcomingVisit] = useState<{date: string, time: string, daysLeft: number, hoursLeft: number, minutesLeft: number} | null>(null);
  const [offersData, setOffersData] = useState<{available: number, accepted: boolean, hasMagicBox: boolean} | null>(null);
  const [upcomingTests, setUpcomingTests] = useState<{count: number, daysLeft: number} | null>(null);
  
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
        // Φόρτωση όλων των ενεργών visit packages
        const { data: visitPackages, error: packagesError } = await supabase
          .from('visit_packages')
          .select('total_visits, remaining_visits, status, expiry_date')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .gt('remaining_visits', 0)
          .or('expiry_date.is.null,expiry_date.gte.' + new Date().toISOString().split('T')[0])
          .order('purchase_date', { ascending: false });

        if (packagesError) {
          console.error('Error fetching visit packages:', packagesError);
          setVisitsData(null);
          return;
        }

        if (!visitPackages || visitPackages.length === 0) {
          setVisitsData({ used: 0, total: 0 });
          return;
        }

        // Συγκέντρωση όλων των ενεργών πακέτων
        let totalVisits = 0;
        let totalUsed = 0;

        visitPackages.forEach(pkg => {
          totalVisits += pkg.total_visits;
          totalUsed += (pkg.total_visits - pkg.remaining_visits);
        });

        setVisitsData({
          used: totalUsed,
          total: totalVisits
        });

      } catch (error) {
        console.error('Error fetching visits data:', error);
        setVisitsData(null);
      }
    };

    const fetchVideocallData = async () => {
      try {
        // Φόρτωση όλων των ενεργών videocall packages
        const { data: videocallPackages, error: packagesError } = await supabase
          .from('videocall_packages')
          .select('total_videocalls, remaining_videocalls, status, expiry_date')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .gt('remaining_videocalls', 0)
          .or('expiry_date.is.null,expiry_date.gte.' + new Date().toISOString().split('T')[0])
          .order('purchase_date', { ascending: false });

        if (packagesError) {
          console.error('Error fetching videocall packages:', packagesError);
          setVideocallData(null);
          return;
        }

        if (!videocallPackages || videocallPackages.length === 0) {
          setVideocallData({ used: 0, total: 0 });
          return;
        }

        // Συγκέντρωση όλων των ενεργών πακέτων
        let totalVideocalls = 0;
        let totalUsed = 0;

        videocallPackages.forEach(pkg => {
          totalVideocalls += pkg.total_videocalls;
          totalUsed += (pkg.total_videocalls - pkg.remaining_videocalls);
        });

        setVideocallData({
          used: totalUsed,
          total: totalVideocalls
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
          const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
          const totalMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          
          setUpcomingVideocall({
            date: nextVideocall.booking_date,
            time: nextVideocall.booking_time,
            daysLeft: Math.floor(totalHours / 24),
            hoursLeft: totalHours % 24,
            minutesLeft: totalMinutes
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
          const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
          const totalMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          
          setUpcomingVisit({
            date: nextVisit.booking_date,
            time: nextVisit.booking_time,
            daysLeft: Math.floor(totalHours / 24),
            hoursLeft: totalHours % 24,
            minutesLeft: totalMinutes
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

    const fetchUpcomingTests = async () => {
      try {
        const now = new Date();
        
        // Φόρτωση επερχόμενων τεστ
        const { data: scheduledTests, error } = await supabase
          .from('tests')
          .select('scheduled_date')
          .eq('user_id', user.id)
          .eq('status', 'scheduled')
          .gte('scheduled_date', now.toISOString().split('T')[0])
          .order('scheduled_date', { ascending: true });

        if (error) {
          console.error('Error fetching upcoming tests:', error);
          setUpcomingTests(null);
          return;
        }

        if (!scheduledTests || scheduledTests.length === 0) {
          setUpcomingTests(null);
          return;
        }

        // Βρες το πρώτο επερχόμενο τεστ
        const nextTest = scheduledTests[0];
        const testDate = new Date(nextTest.scheduled_date);
        const diffMs = testDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        setUpcomingTests({
          count: scheduledTests.length,
          daysLeft: Math.max(0, daysLeft)
        });

      } catch (error) {
        console.error('Error fetching upcoming tests:', error);
        setUpcomingTests(null);
      }
    };

    const fetchOffersData = async () => {
      try {
        // Φόρτωση ενεργών προσφορών για τον χρήστη
        const { data: offers, error } = await supabase
          .from('offers')
          .select('*')
          .eq('is_active', true)
          .gte('end_date', new Date().toISOString().split('T')[0])
          .lte('start_date', new Date().toISOString().split('T')[0]);

        if (error) {
          console.error('Error fetching offers:', error);
          setOffersData(null);
          return;
        }

        // Φόρτωση ενεργών magic box campaigns
        const { data: magicBoxCampaigns, error: magicBoxError } = await supabase
          .from('magic_box_campaigns')
          .select('*')
          .eq('is_active', true);

        if (magicBoxError) {
          console.error('Error fetching magic box campaigns:', magicBoxError);
        }

        const hasMagicBox = !magicBoxError && magicBoxCampaigns && magicBoxCampaigns.length > 0;

        // Φόρτωση απορριμμένων προσφορών
        const { data: rejectedOffers, error: rejectedError } = await supabase
          .from('offer_rejections')
          .select('offer_id')
          .eq('user_id', user.id);

        if (rejectedError) {
          console.error('Error fetching rejected offers:', rejectedError);
        }

        const rejectedOfferIds = new Set(rejectedOffers?.map(r => r.offer_id) || []);

        // Φόρτωση αποδεκτών προσφορών από payments
        const { data: acceptedPayments, error: paymentsError } = await supabase
          .from('payments')
          .select('offer_id')
          .eq('user_id', user.id)
          .not('offer_id', 'is', null);

        if (paymentsError) {
          console.error('Error fetching accepted offers:', paymentsError);
        }

        const acceptedOfferIds = new Set(acceptedPayments?.map(p => p.offer_id).filter(Boolean) || []);

        // Φιλτράρισμα προσφορών βάσει visibility, απόρριψης και αποδοχής (μόνο ενεργές προσφορές)
        const filteredOffers = offers?.filter(offer => {
          // Αποκλεισμός απορριμμένων προσφορών
          if (rejectedOfferIds.has(offer.id)) return false;
          
          // Αποκλεισμός αποδεκτών προσφορών
          if (acceptedOfferIds.has(offer.id)) return false;
          
          if (offer.visibility === 'all') return true;
          if (offer.visibility === 'individual' || offer.visibility === 'selected') {
            return offer.target_users?.includes(user.id);
          }
          return false;
        }) || [];

        setOffersData({
          available: filteredOffers.length,
          accepted: false,
          hasMagicBox: hasMagicBox
        });

      } catch (error) {
        console.error('Error fetching offers data:', error);
        setOffersData(null);
      }
    };

    if (user?.id) {
      fetchSubscriptionData();
      fetchVisitsData();
      fetchVideocallData();
      fetchUpcomingBookings();
      fetchUpcomingTests();
      fetchOffersData();
    }
  }, [user?.id]);

  // Συνάρτηση για τον υπολογισμό χρώματος βάσει ημερών (μόνο για αριθμούς)
  const getTimeBasedColor = (daysLeft: number) => {
    if (daysLeft <= 1) return 'text-red-600';  // 1 ημέρα πριν: κόκκινο
    if (daysLeft <= 3) return 'text-orange-600';  // 3 ημέρες πριν: πορτοκαλί
    return 'text-[#00ffba]';  // κανονικά: πράσινο
  };
  
  return (
    <Card className="rounded-none">
      <CardContent className={isMobile ? "pt-4" : "pt-6"}>
        <div className={`grid gap-4 ${
          isMobile ? 'grid-cols-2' : 'grid-cols-3 md:grid-cols-6 lg:grid-cols-12'
        }`}>
          {/* Αγορές - Πρώτο */}
          <button 
            onClick={() => navigate(`/dashboard/user-profile/${user.id}?tab=shop`)}
            className="text-center hover:bg-gray-50 p-2 rounded-none transition-colors cursor-pointer flex flex-col min-w-0"
          >
            <div className="h-10 flex items-center justify-center">
              <ShoppingBag className={`text-[#00ffba] ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
            </div>
            <div className={`h-8 flex items-center justify-center font-bold ${isMobile ? 'text-lg' : 'text-2xl'} animate-click-me`}>
              <MousePointer className={`text-[#00ffba] ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
            </div>
            <div className={`h-12 flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              Αγορές
            </div>
          </button>

          {/* Ενεργές Προσφορές - Δεύτερο */}
          <button 
            onClick={() => navigate(`/dashboard/user-profile/${user.id}?tab=offers`)}
            className="text-center hover:bg-gray-50 p-2 rounded-none transition-colors cursor-pointer flex flex-col min-w-0"
          >
            <div className="h-10 flex items-center justify-center">
              <Tag className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${
                offersData?.hasMagicBox 
                  ? 'animate-offer-blink' 
                  : offersData?.available > 0 
                  ? 'text-[#00ffba]' 
                  : 'text-gray-400'
              } transition-all duration-300`} />
            </div>
            <div className={`h-8 flex items-center justify-center font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {offersData?.available > 0 ? (
                <span className={`${offersData?.hasMagicBox ? 'animate-offer-blink' : 'text-[#00ffba]'}`}>
                  {offersData.available}
                </span>
              ) : offersData?.hasMagicBox ? (
                <Gift className={`animate-offer-blink ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
            <div className={`h-12 flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              Ενεργές Προσφορές
            </div>
          </button>

          {/* Πληρωμές - Τρίτο */}
          <button 
            onClick={() => navigate(`/dashboard/user-profile/${user.id}?tab=payments`)}
            className="text-center hover:bg-gray-50 p-2 rounded-none transition-colors cursor-pointer flex flex-col min-w-0"
          >
            <div className="h-10 flex items-center justify-center">
              <CreditCard className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${
                paymentStatus !== null ? 'text-orange-500' : 'text-gray-400'
              }`} />
            </div>
            <div className={`h-8 flex items-center justify-center font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {paymentStatus === null ? (
                <span className="text-gray-400">-</span>
              ) : paymentStatus ? (
                <Check className={`text-[#00ffba] ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
              ) : (
                <X className={`text-red-500 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
              )}
            </div>
            <div className={`h-12 flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              Πληρωμές
            </div>
          </button>

          {/* Μέρες Συνδρομής - Τέταρτο */}
          <button 
            onClick={() => navigate(`/dashboard/user-profile/${user.id}?tab=payments`)}
            className="text-center hover:bg-gray-50 p-2 rounded-none transition-colors cursor-pointer flex flex-col min-w-0"
          >
            <div className="h-10 flex items-center justify-center">
              {isPaused ? (
                <Pause className={`text-yellow-500 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
              ) : (
                <Clock className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${
                  subscriptionDays !== null ? 'text-[#00ffba]' : 'text-gray-400'
                }`} />
              )}
            </div>
            <div className={`h-8 flex items-center justify-center font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
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
            </div>
            <div className={`h-12 flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              Μέρες Συνδρομής
            </div>
          </button>

          {/* Ημέρες Προπόνησης / Προγράμματα - Πέμπτο (δεξιά από Μέρες Συνδρομής) */}
          <button 
            onClick={() => navigate(`/dashboard/user-profile/${user.id}?tab=calendar`)}
            className="text-center hover:bg-gray-50 p-2 rounded-none transition-colors cursor-pointer flex flex-col min-w-0"
          >
            <div className="h-10 flex items-center justify-center">
              <Dumbbell className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${
                stats.programsCount > 0 ? 'text-green-500' : 'text-gray-400'
              }`} />
            </div>
            <div className={`h-8 flex items-center justify-center font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {stats.programsCount > 0 ? (
                <span className={
                  stats.programsCount === 1 ? 'text-red-600' :
                  stats.programsCount <= 3 ? 'text-orange-600' :
                  'text-green-600'
                }>
                  {stats.programsCount}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
            <div className={`h-12 flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              {(user.role === 'trainer' || user.role === 'admin') ? 'Προγράμματα' : 'Ημέρες Προπόνησης'}
            </div>
          </button>

          {/* Επερχόμενα Τεστ - Έκτο (μετά από Ημέρες Προπόνησης) */}
          <button 
            onClick={() => navigate(`/dashboard/user-profile/${user.id}?tab=tests`)}
            className="text-center hover:bg-gray-50 p-2 rounded-none transition-colors cursor-pointer flex flex-col min-w-0"
          >
            <div className="h-10 flex items-center justify-center">
              <Calendar className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${
                upcomingTests ? 'text-purple-500' : 'text-gray-400'
              }`} />
            </div>
            <div className={`h-8 flex items-center justify-center font-bold ${isMobile ? 'text-lg' : 'text-2xl'} min-w-12`}>
              {upcomingTests ? (
                upcomingTests.daysLeft === 0 ? (
                  <span className="text-red-600">Σήμερα!</span>
                ) : upcomingTests.daysLeft <= 3 ? (
                  <span className="text-orange-600">{upcomingTests.daysLeft}η</span>
                ) : (
                  <span className="text-purple-600">{upcomingTests.daysLeft}η</span>
                )
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
            <div className={`h-12 flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              Επερχόμενα Τεστ
            </div>
          </button>

          {/* Επισκέψεις - Έβδομο */}
          <button 
            onClick={() => navigate(`/dashboard/user-profile/${user.id}?tab=online-booking`)}
            className="text-center hover:bg-gray-50 p-2 rounded-none transition-colors cursor-pointer flex flex-col min-w-0"
          >
            <div className="h-10 flex items-center justify-center">
              <MapPin className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${
                visitsData && visitsData.total > 0 ? 'text-blue-500' : 'text-gray-400'
              }`} />
            </div>
            <div className={`h-8 flex items-center justify-center font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {visitsData && visitsData.total > 0 ? (
                <span className="text-gray-900">
                  {Math.max(0, visitsData.used)}/{visitsData.total}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
            <div className={`h-12 flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              Επισκέψεις
            </div>
          </button>

          {/* Επερχόμενη Επίσκεψη - Έκτο */}
          <button 
            onClick={() => navigate(`/dashboard/user-profile/${user.id}?tab=online-booking`)}
            className="text-center hover:bg-gray-50 p-2 rounded-none transition-colors cursor-pointer flex flex-col min-w-0"
          >
            <div className="h-10 flex items-center justify-center">
              <MapPin className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${
                upcomingVisit ? 'text-purple-500' : 'text-gray-400'
              }`} />
            </div>
             <div className={`h-8 flex items-center justify-center font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
               {upcomingVisit ? (
                 upcomingVisit.daysLeft >= 1 ? (
                   <span className={getTimeBasedColor(upcomingVisit.daysLeft)}>{upcomingVisit.daysLeft}μ</span>
                 ) : (
                   <span className={getTimeBasedColor(0)}>{upcomingVisit.hoursLeft}ώ</span>
                 )
               ) : (
                 <span className="text-gray-400">-</span>
               )}
            </div>
            <div className={`h-12 flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              Επερχόμενη Επίσκεψη
            </div>
          </button>


          {/* Βιντεοκλήσεις - Ένατο */}
          <button 
            onClick={() => navigate(`/dashboard/user-profile/${user.id}?tab=online-coaching`)}
            className="text-center hover:bg-gray-50 p-2 rounded-none transition-colors cursor-pointer flex flex-col min-w-0"
          >
            <div className="h-10 flex items-center justify-center">
              <Video className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${
                videocallData && videocallData.total > 0 ? 'text-blue-500' : 'text-gray-400'
              }`} />
            </div>
            <div className={`h-8 flex items-center justify-center font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {videocallData && videocallData.total > 0 ? (
                <span className="text-gray-900">
                  {Math.max(0, videocallData.used)}/{videocallData.total}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
            <div className={`h-12 flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              Βιντεοκλήσεις
            </div>
          </button>
          
          {/* Επερχόμενη Βιντεοκλήση - Δέκατο */}
          <button 
            onClick={() => {
              if (upcomingVideocall) {
                navigate(`/dashboard/user-profile/${user.id}?tab=online-coaching`);
              }
            }}
            className="text-center hover:bg-gray-50 p-2 rounded-none transition-colors cursor-pointer disabled:cursor-not-allowed flex flex-col min-w-0"
            disabled={!upcomingVideocall}
          >
            <div className="h-10 flex items-center justify-center">
              <Video className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${
                upcomingVideocall ? 'text-purple-500' : 'text-gray-400'
              }`} />
            </div>
             <div className={`h-8 flex items-center justify-center font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
               {upcomingVideocall ? (
                 upcomingVideocall.daysLeft >= 1 ? (
                   <span className={getTimeBasedColor(upcomingVideocall.daysLeft)}>{upcomingVideocall.daysLeft}μ</span>
                 ) : (
                   <span className={getTimeBasedColor(0)}>{upcomingVideocall.hoursLeft}ώ</span>
                 )
               ) : (
                 <span className="text-gray-400">-</span>
               )}
            </div>
            <div className={`h-12 flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              Επερχόμενη Βιντεοκλήση
            </div>
          </button>

          {/* Προφίλ - Ενδέκατο (χωρίς emoji) */}
          <button 
            onClick={() => navigate(`/dashboard/edit-profile`)}
            className="text-center hover:bg-gray-50 p-2 rounded-none transition-colors cursor-pointer flex flex-col min-w-0"
          >
            <div className="h-10 flex items-center justify-center">
              <User className={`text-blue-600 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
            </div>
            <div className={`h-8 flex items-center justify-center font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              <span className="text-blue-600"> </span>
            </div>
            <div className={`h-12 flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              Προφίλ
            </div>
          </button>

          {/* RidAi Προπονητής - Δωδέκατο (χωρίς emoji, με κεφαλαίο A) */}
          <button 
            onClick={() => navigate(`/dashboard/user-profile/${user.id}?tab=ai-trainer`)}
            className="text-center hover:bg-gray-50 p-2 rounded-none transition-colors cursor-pointer flex flex-col min-w-0"
          >
            <div className="h-10 flex items-center justify-center">
              <MessageCircle className={`text-purple-600 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
            </div>
            <div className={`h-8 flex items-center justify-center font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              <span className="text-purple-600"> </span>
            </div>
            <div className={`h-12 flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              RidAi Προπονητής
            </div>
          </button>

          {user.role === 'trainer' && (
            <button 
              onClick={() => navigate(`/dashboard/user-profile/${user.id}?tab=calendar`)}
              className="text-center hover:bg-gray-50 p-2 rounded-none transition-colors cursor-pointer flex flex-col min-w-0"
            >
              <div className="h-10 flex items-center justify-center">
                <Users className={`text-blue-500 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
              </div>
              <div className={`h-8 flex items-center justify-center font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                {stats.athletesCount}
              </div>
              <div className={`h-12 flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
                Αθλητές
              </div>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
