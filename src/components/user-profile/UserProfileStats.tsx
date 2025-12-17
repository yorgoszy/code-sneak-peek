
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Dumbbell, CreditCard, Clock, Check, X, MapPin, Video, ShoppingBag, Tag, Pause, FileText, User, MessageCircle, Gift, Hand, MousePointer, MousePointer2, Pointer, Fingerprint, TrendingUp, History, BookOpen, Trophy, Utensils } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { useTranslation } from 'react-i18next';

interface UserProfileStatsProps {
  user: any;
  stats: {
    athletesCount: number;
    programsCount: number;
    testsCount: number;
    paymentsCount: number;
  };
  setActiveTab?: (tab: string) => void;
}

export const UserProfileStats = ({ user, stats, setActiveTab }: UserProfileStatsProps) => {
  const { t } = useTranslation();
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
  const [upcomingCompetitions, setUpcomingCompetitions] = useState<{count: number, daysLeft: number} | null>(null);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<number>(0);
  
  const { data: allActivePrograms } = useActivePrograms();
  const { getWorkoutCompletions } = useWorkoutCompletionsCache();
  
  // Φιλτράρουμε τα programs μόνο για αυτόν τον χρήστη
  const activePrograms = useMemo(() => {
    return allActivePrograms?.filter(p => p.user_id === user.id) || [];
  }, [allActivePrograms, user.id]);
  
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

        // Υπολογισμός συνολικών ημερών από όλες τις ενεργές συνδρομές
        let totalDays = 0;
        let isPausedStatus = false;
        let hasActiveSubscription = false;

        activeSubscriptions.forEach(subscription => {
          if (subscription.is_paused && subscription.paused_days_remaining) {
            totalDays += subscription.paused_days_remaining;
            isPausedStatus = true;
            hasActiveSubscription = true;
          } else if (!subscription.is_paused) {
            const today = new Date();
            const endDate = new Date(subscription.end_date);
            const remainingDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            
            if (remainingDays > 0) {
              totalDays += remainingDays;
              hasActiveSubscription = true;
            }
          }
        });

        console.log('💳 Subscription calculation:', { 
          activeSubscriptions: activeSubscriptions.length, 
          totalDays, 
          isPausedStatus,
          hasActiveSubscription
        });

        setSubscriptionDays(hasActiveSubscription ? totalDays : null);
        setIsPaused(isPausedStatus);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        setSubscriptionDays(null);
      }
    };

    const fetchVisitsData = async () => {
      try {
        console.log('🔍 Fetching visits data for user:', user.id);
        
        // Φόρτωση όλων των ενεργών visit packages
        const { data: visitPackages, error: packagesError } = await supabase
          .from('visit_packages')
          .select('total_visits, remaining_visits, status, expiry_date, purchase_date')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .gt('remaining_visits', 0)
          .or('expiry_date.is.null,expiry_date.gte.' + new Date().toISOString().split('T')[0])
          .order('purchase_date', { ascending: false });

        console.log('📦 Visit packages found:', visitPackages);

        if (packagesError) {
          console.error('Error fetching visit packages:', packagesError);
          setVisitsData(null);
          return;
        }

        if (!visitPackages || visitPackages.length === 0) {
          console.log('❌ No active visit packages found');
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

        console.log('✅ Visits calculation:', { totalVisits, totalUsed, packages: visitPackages.length });

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
        
        // Φόρτωση επερχόμενων βιντεοκλήσεων - βρίσκουμε μόνο μελλοντικές κρατήσεις
        const { data: videocallBookings, error: videocallError } = await supabase
          .from('booking_sessions')
          .select('booking_date, booking_time')
          .eq('user_id', user.id)
          .eq('booking_type', 'videocall')
          .eq('status', 'confirmed')
          .or(`booking_date.gt.${now.toISOString().split('T')[0]},and(booking_date.eq.${now.toISOString().split('T')[0]},booking_time.gt.${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00)`)
          .order('booking_date', { ascending: true })
          .order('booking_time', { ascending: true })
          .limit(1);

        if (!videocallError && videocallBookings && videocallBookings.length > 0) {
          const nextVideocall = videocallBookings[0];
          const bookingDateTime = new Date(`${nextVideocall.booking_date} ${nextVideocall.booking_time}`);
          const diffMs = bookingDateTime.getTime() - now.getTime();
          
          // Μόνο αν η κράτηση είναι στο μέλλον
          if (diffMs > 0) {
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
        } else {
          setUpcomingVideocall(null);
        }

        // Φόρτωση επερχόμενων επισκέψεων - βρίσκουμε μόνο μελλοντικές κρατήσεις
        const { data: visitBookings, error: visitError } = await supabase
          .from('booking_sessions')
          .select('booking_date, booking_time')
          .eq('user_id', user.id)
          .eq('booking_type', 'gym_visit')
          .eq('status', 'confirmed')
          .or(`booking_date.gt.${now.toISOString().split('T')[0]},and(booking_date.eq.${now.toISOString().split('T')[0]},booking_time.gt.${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00)`)
          .order('booking_date', { ascending: true })
          .order('booking_time', { ascending: true })
          .limit(1);

        if (!visitError && visitBookings && visitBookings.length > 0) {
          const nextVisit = visitBookings[0];
          const bookingDateTime = new Date(`${nextVisit.booking_date} ${nextVisit.booking_time}`);
          const diffMs = bookingDateTime.getTime() - now.getTime();
          
          // Μόνο αν η κράτηση είναι στο μέλλον
          if (diffMs > 0) {
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
        const todayStr = now.toISOString().split('T')[0];
        
        // Φόρτωση επερχόμενων τεστ από τον πίνακα tests
        const { data: scheduledTests, error } = await supabase
          .from('tests')
          .select('scheduled_date')
          .eq('user_id', user.id)
          .eq('status', 'scheduled')
          .gte('scheduled_date', todayStr)
          .order('scheduled_date', { ascending: true });

        if (error) {
          console.error('Error fetching upcoming tests:', error);
        }

        // Συλλογή ημερομηνιών από scheduled tests
        const allTestDates: string[] = [];
        if (scheduledTests && scheduledTests.length > 0) {
          allTestDates.push(...scheduledTests.map(t => t.scheduled_date));
        }

        // Συλλογή ημερομηνιών από test days στα assigned programs
        if (activePrograms && activePrograms.length > 0) {
          for (const assignment of activePrograms) {
            if (assignment.training_dates && assignment.programs?.program_weeks) {
              const trainingDates = assignment.training_dates;
              const weeks = assignment.programs.program_weeks;
              
              // Υπολογισμός του συνολικού αριθμού ημερών ανά εβδομάδα
              const daysPerWeek = weeks[0]?.program_days?.length || 0;
              
              // Διατρέχουμε όλες τις εβδομάδες και ημέρες
              weeks.forEach((week, weekIndex) => {
                week.program_days?.forEach((day, dayIndex) => {
                  if (day.is_test_day) {
                    // Βρίσκουμε τη σωστή ημερομηνία για αυτή την ημέρα
                    const totalDayIndex = (weekIndex * daysPerWeek) + dayIndex;
                    if (totalDayIndex < trainingDates.length) {
                      const testDate = trainingDates[totalDayIndex];
                      // Προσθέτουμε μόνο μελλοντικές ημερομηνίες
                      if (testDate >= todayStr) {
                        allTestDates.push(testDate);
                      }
                    }
                  }
                });
              });
            }
          }
        }

        // Αν δεν έχουμε καθόλου tests
        if (allTestDates.length === 0) {
          setUpcomingTests(null);
          return;
        }

        // Ταξινόμηση των ημερομηνιών και εύρεση της πιο κοντινής
        allTestDates.sort();
        const nextTestDate = allTestDates[0];
        const testDate = new Date(nextTestDate);
        const diffMs = testDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        setUpcomingTests({
          count: allTestDates.length,
          daysLeft: Math.max(0, daysLeft)
        });

      } catch (error) {
        console.error('Error fetching upcoming tests:', error);
        setUpcomingTests(null);
      }
    };

    const fetchUpcomingCompetitions = async () => {
      try {
        // Ελέγχουμε αν ο χρήστης είναι αθλητής
        if (!(user.is_athlete || user.role === 'athlete')) {
          setUpcomingCompetitions(null);
          return;
        }

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const allCompetitionDates: string[] = [];

        // Συλλογή ημερομηνιών από competition days στα assigned programs
        if (activePrograms && activePrograms.length > 0) {
          for (const assignment of activePrograms) {
            // Δείξε μόνο αγώνες που ανήκουν στον τρέχοντα χρήστη
            if (assignment.user_id !== user.id) continue;

            if (assignment.training_dates && assignment.programs?.program_weeks) {
              const trainingDates = assignment.training_dates;
              const weeks = assignment.programs.program_weeks;
              const daysPerWeek = weeks[0]?.program_days?.length || 0;
              
              weeks.forEach((week, weekIndex) => {
                week.program_days?.forEach((day, dayIndex) => {
                  if (day.is_competition_day) {
                    const totalDayIndex = (weekIndex * daysPerWeek) + dayIndex;
                    if (totalDayIndex < trainingDates.length) {
                      const competitionDate = trainingDates[totalDayIndex];
                      if (competitionDate >= todayStr) {
                        allCompetitionDates.push(competitionDate);
                      }
                    }
                  }
                });
              });
            }
          }
        }

        if (allCompetitionDates.length === 0) {
          setUpcomingCompetitions(null);
          return;
        }

        allCompetitionDates.sort();
        const nextCompetitionDate = allCompetitionDates[0];
        const competitionDate = new Date(nextCompetitionDate);
        const diffMs = competitionDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        setUpcomingCompetitions({
          count: allCompetitionDates.length,
          daysLeft: Math.max(0, daysLeft)
        });

      } catch (error) {
        console.error('Error fetching upcoming competitions:', error);
        setUpcomingCompetitions(null);
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

        let hasMagicBox = false;
        
        if (!magicBoxError && magicBoxCampaigns && magicBoxCampaigns.length > 0) {
          // Ελέγχω αν ο χρήστης έχει ανοιγμένα magic boxes που δεν έχει παίξει ακόμα
          const { data: userMagicBoxes, error: userBoxesError } = await supabase
            .from('user_magic_boxes')
            .select('is_opened')
            .eq('user_id', user.id)
            .in('campaign_id', magicBoxCampaigns.map(c => c.id));

          if (!userBoxesError && userMagicBoxes) {
            // Αν έχει τουλάχιστον ένα magic box που δεν έχει ανοίξει, δείχνουμε το animation
            hasMagicBox = userMagicBoxes.some(box => !box.is_opened);
          }
        }

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
          hasMagicBox: hasMagicBox || filteredOffers.length > 0
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
      fetchUpcomingCompetitions();
      fetchOffersData();
      if (user.role !== 'trainer' && user.role !== 'admin') {
        fetchUpcomingWorkouts();
      }
    }
  }, [user?.id, activePrograms]);

  const fetchUpcomingWorkouts = async () => {
    try {
      if (!activePrograms || !user?.id) {
        setUpcomingWorkouts(0);
        return;
      }

      // Φιλτράρισμα για προγράμματα του συγκεκριμένου χρήστη
      const userPrograms = activePrograms.filter(program => program.app_users?.id === user.id);
      
      if (userPrograms.length === 0) {
        setUpcomingWorkouts(0);
        return;
      }

      let totalUpcomingWorkouts = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const program of userPrograms) {
        if (!program.training_dates) continue;

        // Παίρνουμε τις ολοκληρώσεις για αυτό το assignment
        const completions = await getWorkoutCompletions(program.id);
        
        // Μετράμε τις μελλοντικές ημέρες που έχουν πρόγραμμα (εξαιρούνται οι test days) και δεν έχουν ολοκληρωθεί/χαθεί
        const weeks = program.programs?.program_weeks || [];
        const daysPerWeek = weeks[0]?.program_days?.length || 0;

        program.training_dates.forEach((dateStr, idx) => {
          const workoutDate = new Date(dateStr);
          workoutDate.setHours(0, 0, 0, 0);

          // Εντοπίζουμε την αντίστοιχη ημέρα προγράμματος για να ελέγξουμε αν είναι test day ή competition day
          let isTestDay = false;
          let isCompetitionDay = false;
          if (daysPerWeek > 0) {
            const weekIndex = Math.floor(idx / daysPerWeek);
            const dayIndex = idx % daysPerWeek;
            const dayData = weeks[weekIndex]?.program_days?.[dayIndex];
            isTestDay = dayData?.is_test_day === true;
            isCompetitionDay = dayData?.is_competition_day === true;
          }

          // Μόνο μελλοντικές ημερομηνίες (συμπεριλαμβανομένης της σημερινής) και όχι test/competition day
          if (workoutDate >= today && !isTestDay && !isCompetitionDay) {
            const completion = completions.find(c => c.scheduled_date === dateStr);
            
            // Αν δεν υπάρχει completion ή το status δεν είναι completed/missed
            if (!completion || (completion.status !== 'completed' && completion.status !== 'missed')) {
              totalUpcomingWorkouts++;
            }
          }
        });
      }

      setUpcomingWorkouts(totalUpcomingWorkouts);
    } catch (error) {
      console.error('Error fetching upcoming workouts:', error);
      setUpcomingWorkouts(0);
    }
  };

  // Συνάρτηση για τον υπολογισμό χρώματος βάσει ημερών (μόνο για αριθμούς)
  const getTimeBasedColor = (daysLeft: number) => {
    if (daysLeft <= 1) return 'text-red-600';  // 1 ημέρα πριν: κόκκινο
    if (daysLeft <= 3) return 'text-orange-600';  // 3 ημέρες πριν: πορτοκαλί
    return 'text-[#00ffba]';  // κανονικά: πράσινο
  };
  
  return (
    <Card className="rounded-none">
      <CardContent className={isMobile ? "pt-2 pb-2" : "pt-6"}>
        <div className={`grid ${isMobile ? 'gap-2' : 'gap-4'} ${
          isMobile ? 'grid-cols-2' : 'grid-cols-3 md:grid-cols-6 lg:grid-cols-12'
        }`}>
          {/* Αγορές - Πρώτο */}
          <button 
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('shop');
              } else {
                navigate(`/dashboard/user-profile/${user.id}?tab=shop`);
              }
            }}
            className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer flex flex-col min-w-0`}
          >
            <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
              <ShoppingBag className={`text-[#00ffba] ${isMobile ? 'w-5 h-5' : 'w-8 h-8'}`} />
            </div>
            <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'} animate-click-me`}>
              <MousePointer className={`text-[#00ffba] ${isMobile ? 'w-4 h-4' : 'w-6 h-6'}`} />
            </div>
            <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              {t('overview.shop')}
            </div>
          </button>

          {/* Ενεργές Προσφορές - Δεύτερο */}
          <button 
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('offers');
              } else {
                navigate(`/dashboard/user-profile/${user.id}?tab=offers`);
              }
            }}
            className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer flex flex-col min-w-0`}
          >
            <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
              <Tag className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'} ${
                offersData?.hasMagicBox 
                  ? 'animate-offer-blink' 
                  : offersData?.available > 0 
                  ? 'text-[#00ffba]' 
                  : 'text-gray-400'
              } transition-all duration-300`} />
            </div>
            <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'}`}>
              {offersData?.available > 0 ? (
                <span className={`${offersData?.hasMagicBox ? 'animate-offer-blink' : 'text-[#00ffba]'}`}>
                  {offersData.available}
                </span>
              ) : offersData?.hasMagicBox ? (
                <Gift className={`animate-offer-blink ${isMobile ? 'w-5 h-5' : 'w-8 h-8'}`} />
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
            <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              {t('overview.activeOffers')}
            </div>
          </button>

          {/* Πληρωμές - Τρίτο */}
          <button 
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('payments');
              } else {
                navigate(`/dashboard/user-profile/${user.id}?tab=payments`);
              }
            }}
            className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer flex flex-col min-w-0`}
          >
            <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
              <CreditCard className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'} ${
                paymentStatus !== null ? 'text-orange-500' : 'text-gray-400'
              }`} />
            </div>
            <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'}`}>
              {paymentStatus === null ? (
                <span className="text-gray-400">-</span>
              ) : paymentStatus ? (
                <Check className={`text-[#00ffba] ${isMobile ? 'w-5 h-5' : 'w-8 h-8'}`} />
              ) : (
                <X className={`text-red-500 ${isMobile ? 'w-5 h-5' : 'w-8 h-8'}`} />
              )}
            </div>
            <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              {t('overview.payments')}
            </div>
          </button>

          {/* Μέρες Συνδρομής - Τέταρτο */}
          <button 
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('payments');
              } else {
                navigate(`/dashboard/user-profile/${user.id}?tab=payments`);
              }
            }}
            className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer flex flex-col min-w-0`}
          >
            <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
              {isPaused ? (
                <Pause className={`text-yellow-500 ${isMobile ? 'w-5 h-5' : 'w-8 h-8'}`} />
              ) : (
                <Clock className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'} ${
                  subscriptionDays !== null ? 'text-[#00ffba]' : 'text-gray-400'
                }`} />
              )}
            </div>
            <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'}`}>
              {subscriptionDays !== null ? (
                isPaused ? (
                  <span className="text-orange-600">{subscriptionDays}</span>
                ) : subscriptionDays < 0 ? (
                  <span className="text-red-600">{t('overview.expired')}</span>
                ) : subscriptionDays === 0 ? (
                  <span className="text-orange-600">{t('overview.today')}</span>
                ) : subscriptionDays <= 7 ? (
                  <span className="text-orange-600">{subscriptionDays}</span>
                ) : (
                  <span className="text-green-600">{subscriptionDays}</span>
                )
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
            <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              {t('overview.subscriptionDays')}
            </div>
          </button>


          {/* Ημέρες Προπόνησης / Προγράμματα - Πέμπτο (δεξιά από Μέρες Συνδρομής) */}
          <button 
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('programs');
              } else {
                navigate(`/dashboard/user-profile/${user.id}?tab=programs`);
              }
            }}
            className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer flex flex-col min-w-0`}
          >
            <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
              <Dumbbell className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'} ${
                stats.programsCount > 0 ? 'text-green-500' : 'text-gray-400'
              }`} />
            </div>
            <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'}`}>
              {(user.role === 'trainer' || user.role === 'admin') ? (
                stats.programsCount > 0 ? (
                  <span className={
                    stats.programsCount === 1 ? 'text-red-600' :
                    stats.programsCount <= 3 ? 'text-orange-600' :
                    'text-green-600'
                  }>
                    {stats.programsCount}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )
              ) : (
                upcomingWorkouts > 0 ? (
                  <span className={
                    upcomingWorkouts === 1 ? 'text-red-600' :
                    upcomingWorkouts <= 3 ? 'text-orange-600' :
                    'text-green-600'
                  }>
                    {upcomingWorkouts}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )
              )}
            </div>
            <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              {(user.role === 'trainer' || user.role === 'admin') ? t('overview.programs') : t('overview.trainingDays')}
            </div>
          </button>

          {/* Επερχόμενα Τεστ - Έκτο */}
          <button 
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('tests');
              } else {
                navigate(`/dashboard/user-profile/${user.id}?tab=tests`);
              }
            }}
            className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer flex flex-col min-w-0`}
          >
            <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
              <Calendar className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'} ${
                upcomingTests ? 'text-purple-500' : 'text-gray-400'
              }`} />
            </div>
            <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'} min-w-12`}>
              {upcomingTests ? (
                upcomingTests.daysLeft === 0 ? (
                  <span className="text-red-600">{t('overview.today')}!</span>
                ) : upcomingTests.daysLeft <= 3 ? (
                  <span className="text-orange-600">{upcomingTests.daysLeft}</span>
                ) : (
                  <span className="text-purple-600">{upcomingTests.daysLeft}</span>
                )
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
            <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              {t('overview.upcomingTests')}
            </div>
          </button>

          {/* Επερχόμενοι Αγώνες - Μόνο για αθλητές */}
          {(user.is_athlete || user.role === 'athlete') && (
            <button 
              onClick={() => {
                if (setActiveTab) {
                  setActiveTab('calendar');
                } else {
                  navigate(`/dashboard/user-profile/${user.id}?tab=calendar`);
                }
              }}
              className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer flex flex-col min-w-0`}
            >
              <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
                <Trophy className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'} ${
                  upcomingCompetitions ? 'text-amber-500' : 'text-gray-400'
                }`} />
              </div>
              <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'} min-w-12`}>
                {upcomingCompetitions ? (
                  upcomingCompetitions.daysLeft === 0 ? (
                    <span className="text-red-600">Σήμερα!</span>
                  ) : upcomingCompetitions.daysLeft <= 3 ? (
                    <span className="text-orange-600">{upcomingCompetitions.daysLeft}</span>
                  ) : (
                    <span className="text-amber-600">{upcomingCompetitions.daysLeft}</span>
                  )
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
              <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
                Επερχόμενοι Αγώνες
              </div>
            </button>
          )}

          {/* Πρόοδος - Έβδομο */}
          <button 
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('progress');
              } else {
                navigate(`/dashboard/user-profile/${user.id}?tab=progress`);
              }
            }}
            className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer flex flex-col min-w-0`}
          >
            <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
              <TrendingUp className={`text-[#cb8954] ${isMobile ? 'w-5 h-5' : 'w-8 h-8'}`} />
            </div>
            <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'}`}>
              <span className="text-[#00ffba]"> </span>
            </div>
            <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              {t('overview.progress')}
            </div>
          </button>

          {/* Ιστορικό - Όγδοο */}
          <button 
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('history');
              } else {
                navigate(`/dashboard/user-profile/${user.id}?tab=history`);
              }
            }}
            className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer flex flex-col min-w-0`}
          >
            <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
              <History className={`text-[#cb8954] ${isMobile ? 'w-5 h-5' : 'w-8 h-8'}`} />
            </div>
            <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'}`}>
              <span className="text-[#cb8954]"> </span>
            </div>
            <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              {t('overview.history')}
            </div>
          </button>

          {/* Διατροφή Widget */}
          <button 
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('nutrition');
              } else {
                navigate(`/dashboard/user-profile/${user.id}?tab=nutrition`);
              }
            }}
            className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer flex flex-col min-w-0`}
          >
            <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
              <Utensils className={`text-[#00ffba] ${isMobile ? 'w-5 h-5' : 'w-8 h-8'}`} />
            </div>
            <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'}`}>
              <span className="text-[#00ffba]"> </span>
            </div>
            <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              Διατροφή
            </div>
          </button>

          {/* Επισκέψεις - Ένατο */}
          <button
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('online-booking');
              } else {
                navigate(`/dashboard/user-profile/${user.id}?tab=online-booking`);
              }
            }}
            className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer flex flex-col min-w-0`}
          >
            <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
              <MapPin className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'} ${
                visitsData && visitsData.total > 0 ? 'text-blue-500' : 'text-gray-400'
              }`} />
            </div>
            <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'}`}>
              {visitsData && visitsData.total > 0 ? (
                <span className="text-gray-900">
                  {Math.max(0, visitsData.used)}/{visitsData.total}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
            <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              {t('overview.visits')}
            </div>
          </button>

          {/* Επερχόμενη Επίσκεψη - Έκτο */}
          <button 
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('online-booking');
              } else {
                navigate(`/dashboard/user-profile/${user.id}?tab=online-booking`);
              }
            }}
            className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer flex flex-col min-w-0`}
          >
            <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
              <MapPin className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'} ${
                upcomingVisit ? 'text-purple-500' : 'text-gray-400'
              }`} />
            </div>
             <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'}`}>
               {upcomingVisit ? (
                 upcomingVisit.daysLeft >= 1 ? (
                   <span className={getTimeBasedColor(upcomingVisit.daysLeft)}>{upcomingVisit.daysLeft}μ</span>
                 ) : upcomingVisit.hoursLeft >= 0 ? (
                   <span className={getTimeBasedColor(0)}>{upcomingVisit.hoursLeft}ώ</span>
                 ) : (
                   <span className="text-gray-400">-</span>
                 )
               ) : (
                 <span className="text-gray-400">-</span>
               )}
             </div>
            <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              {t('overview.upcomingVisit')}
            </div>
          </button>


          {/* Βιντεοκλήσεις - Ένατο */}
          <button 
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('online-coaching');
              } else {
                navigate(`/dashboard/user-profile/${user.id}?tab=online-coaching`);
              }
            }}
            className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer flex flex-col min-w-0`}
          >
            <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
              <Video className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'} ${
                videocallData && videocallData.total > 0 ? 'text-blue-500' : 'text-gray-400'
              }`} />
            </div>
            <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'}`}>
              {videocallData && videocallData.total > 0 ? (
                <span className="text-gray-900">
                  {Math.max(0, videocallData.used)}/{videocallData.total}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
            <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              {t('overview.videocalls')}
            </div>
          </button>
          
          {/* Επερχόμενη Βιντεοκλήση - Δέκατο */}
          <button 
            onClick={() => {
              if (upcomingVideocall) {
                if (setActiveTab) {
                  setActiveTab('online-coaching');
                } else {
                  navigate(`/dashboard/user-profile/${user.id}?tab=online-coaching`);
                }
              }
            }}
            className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer disabled:cursor-not-allowed flex flex-col min-w-0`}
            disabled={!upcomingVideocall}
          >
            <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
              <Video className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'} ${
                upcomingVideocall ? 'text-purple-500' : 'text-gray-400'
              }`} />
            </div>
             <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'}`}>
               {upcomingVideocall ? (
                 upcomingVideocall.daysLeft >= 1 ? (
                   <span className={getTimeBasedColor(upcomingVideocall.daysLeft)}>{upcomingVideocall.daysLeft}μ</span>
                 ) : upcomingVideocall.hoursLeft >= 0 ? (
                   <span className={getTimeBasedColor(0)}>{upcomingVideocall.hoursLeft}ώ</span>
                 ) : (
                   <span className="text-gray-400">-</span>
                 )
               ) : (
                 <span className="text-gray-400">-</span>
               )}
             </div>
            <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              {t('overview.upcomingVideocall')}
            </div>
          </button>

          {/* Προφίλ - Ενδέκατο (χωρίς emoji) */}
          <button 
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('edit-profile');
              } else {
                navigate(`/dashboard/user-profile/${user.id}?tab=edit-profile`);
              }
            }}
            className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer flex flex-col min-w-0`}
          >
            <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
              <User className={`text-blue-600 ${isMobile ? 'w-5 h-5' : 'w-8 h-8'}`} />
            </div>
            <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'}`}>
              <span className="text-blue-600"> </span>
            </div>
            <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              {t('overview.profile')}
            </div>
          </button>

          {/* RidAi Προπονητής - Δωδέκατο (χωρίς emoji, με κεφαλαίο A) */}
          <button 
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('ai-trainer');
              } else {
                navigate(`/dashboard/user-profile/${user.id}?tab=ai-trainer`);
              }
            }}
            className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer flex flex-col min-w-0`}
          >
            <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
              <MessageCircle className={`text-purple-600 ${isMobile ? 'w-5 h-5' : 'w-8 h-8'}`} />
            </div>
            <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'}`}>
              <span className="text-purple-600"> </span>
            </div>
            <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
              {t('overview.aiCoach')}
            </div>
          </button>

          {/* Σχολικές Σημειώσεις - Για parents μόνο */}
          {user.role === 'parent' && (
            <button 
              onClick={() => {
                if (setActiveTab) {
                  setActiveTab('school-notes');
                } else {
                  navigate(`/dashboard/user-profile/${user.id}?tab=school-notes`);
                }
              }}
              className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer flex flex-col min-w-0`}
            >
              <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
                <BookOpen className={`text-[#00ffba] ${isMobile ? 'w-5 h-5' : 'w-8 h-8'}`} />
              </div>
              <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'}`}>
                <span className="text-[#00ffba]"> </span>
              </div>
              <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
                {t('overview.schoolNotes')}
              </div>
            </button>
          )}

          {user.role === 'trainer' && (
            <button 
              onClick={() => {
                if (setActiveTab) {
                  setActiveTab('calendar');
                } else {
                  navigate(`/dashboard/user-profile/${user.id}?tab=calendar`);
                }
              }}
              className={`text-center hover:bg-gray-50 ${isMobile ? 'p-1' : 'p-2'} rounded-none transition-colors cursor-pointer flex flex-col min-w-0`}
            >
              <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
                <Users className={`text-blue-500 ${isMobile ? 'w-5 h-5' : 'w-8 h-8'}`} />
              </div>
              <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'}`}>
                {stats.athletesCount}
              </div>
              <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
                {t('overview.athletes')}
              </div>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
