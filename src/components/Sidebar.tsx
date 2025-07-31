import { 
  Home, 
  Users, 
  Dumbbell, 
  Calendar, 
  BarChart3, 
  Settings,
  FileText,
  CreditCard,
  Brain,
  UsersIcon,
  Mail,
  ArrowLeft,
  Crown,
  TrendingUp,
  BookOpen,
  ShoppingCart,
  Video,
  Tag
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { BaseSidebar } from "@/components/sidebar/BaseSidebar";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useState } from "react";
import { EnhancedAIChatDialog } from "@/components/ai-chat/EnhancedAIChatDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { usePersistentNotifications } from "@/hooks/usePersistentNotifications";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useRoleCheck();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [availableOffers, setAvailableOffers] = useState(0);
  const [pendingVideocalls, setPendingVideocalls] = useState(0);
  const [todayBookings, setTodayBookings] = useState({ total: 0, cancelled: 0 });
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [newGymBookings, setNewGymBookings] = useState(0);
  const [newPurchases, setNewPurchases] = useState(0);
  const [newUsers, setNewUsers] = useState(0);
  const isMobile = useIsMobile();
  const { isAcknowledged, refreshAcknowledged } = usePersistentNotifications();

  const loadAvailableOffers = async () => {
    if (!userProfile?.id) return;
    
    try {
      const { data: offers, error } = await supabase
        .from('offers')
        .select('id, target_users, visibility')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .lte('start_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;
      
      if (userProfile.role === 'admin') {
        // Για admin: υπολογίζουμε πόσες αποδεκτές προσφορές δεν έχουν επισημανθεί ως "ενημερώθηκα"
        const { data: acceptedOffers, error: paymentsError } = await supabase
          .from('payments')
          .select('id, offer_id')
          .not('subscription_type_id', 'is', null)
          .gte('payment_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Τελευταίες 30 ημέρες

        if (paymentsError) throw paymentsError;
        
        // Υπολογίζουμε πόσες αποδεκτές προσφορές δεν έχουν επισημανθεί
        const newAcceptedOffers = acceptedOffers?.filter(offer => 
          !isAcknowledged('offer', offer.id)
        ) || [];
        
        setAvailableOffers(newAcceptedOffers.length);
      } else {
        // Για χρήστες: φιλτράρισμα προσφορών βάσει visibility
        const userOffers = offers?.filter(offer => {
          if (offer.visibility === 'all') return true;
          if (offer.visibility === 'individual' || offer.visibility === 'selected') {
            return offer.target_users?.includes(userProfile.id);
          }
          return false;
        }) || [];
        
        // Φιλτράρισμα απορριμμένων προσφορών
        const { data: rejectedOffers } = await supabase
          .from('offer_rejections')
          .select('offer_id')
          .eq('user_id', userProfile.id);
        
        const rejectedOfferIds = new Set(rejectedOffers?.map(r => r.offer_id) || []);
        const availableUserOffers = userOffers.filter(offer => !rejectedOfferIds.has(offer.id));
        
        setAvailableOffers(availableUserOffers.length);
      }
    } catch (error) {
      console.error('Error loading available offers:', error);
    }
  };

  const loadTodayBookings = async () => {
    if (!userProfile?.id || userProfile.role !== 'admin') return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Bookings που έγιναν σήμερα
      const { data: newBookings, error: newError } = await supabase
        .from('booking_sessions')
        .select('id, status')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      if (newError) throw newError;
      
      // Ακυρώσεις που έγιναν σήμερα
      const { data: cancelledBookings, error: cancelError } = await supabase
        .from('booking_sessions')
        .select('id')
        .eq('status', 'cancelled')
        .gte('updated_at', `${today}T00:00:00.000Z`)
        .lt('updated_at', `${today}T23:59:59.999Z`);

      if (cancelError) throw cancelError;
      
      const newBookingsCount = newBookings?.length || 0;
      const cancelledCount = cancelledBookings?.length || 0;
      
      setTodayBookings({ 
        total: newBookingsCount, 
        cancelled: cancelledCount 
      });
    } catch (error) {
      console.error('Error loading today bookings:', error);
    }
  };

  const loadPendingVideocalls = async () => {
    if (!userProfile?.id || userProfile.role !== 'admin') return;
    
    try {
      const { data, error } = await supabase
        .from('booking_sessions')
        .select('id')
        .eq('booking_type', 'videocall')
        .eq('status', 'pending');

      if (error) throw error;
      
      setPendingVideocalls(data?.length || 0);
    } catch (error) {
      console.error('Error loading pending videocalls:', error);
    }
  };

  const loadTotalPurchases = async () => {
    if (!userProfile?.id || userProfile.role !== 'admin') return;
    
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('id')
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;
      
      setTotalPurchases(data?.length || 0);
    } catch (error) {
      console.error('Error loading total purchases:', error);
    }
  };

  const loadNewGymBookings = async () => {
    if (!userProfile?.id || userProfile.role !== 'admin') return;
    
    try {
      // Φορτώνουμε το timestamp της τελευταίας "ενημέρωσης" - ίδια λογική με GymBookingsOverview
      const lastCheckStr = localStorage.getItem('lastGymBookingCheck');
      const lastCheckTimestamp = lastCheckStr ? parseInt(lastCheckStr) : (Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Φορτώνουμε όλες τις κρατήσεις γυμναστηρίου
      const { data, error } = await supabase
        .from('booking_sessions')
        .select('id, created_at, booking_date')
        .eq('booking_type', 'gym_visit')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Υπολογίζουμε τα νέα bookings - όσα δημιουργήθηκαν μετά το τελευταίο check
      const allBookings = data || [];
      const newBookingsCount = allBookings.filter(booking => {
        const bookingCreatedAt = new Date(booking.created_at || booking.booking_date).getTime();
        return bookingCreatedAt > lastCheckTimestamp;
      }).length;
      
      console.log('Total bookings:', allBookings.length, 'Last check:', new Date(lastCheckTimestamp), 'New bookings:', newBookingsCount);
      setNewGymBookings(newBookingsCount);
    } catch (error) {
      console.error('Error loading new gym bookings:', error);
    }
  };

  const loadNewPurchases = async () => {
    if (!userProfile?.id || userProfile.role !== 'admin') return;
    
    try {
      // Παίρνουμε όλες τις ολοκληρωμένες πληρωμές
      const { data: allPayments, error } = await supabase
        .from('payments')
        .select('id, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Υπολογίζουμε τις νέες αγορές (όσες δεν έχουν επισημανθεί ως "ενημερώθηκα")
      const newPurchasesData = allPayments?.filter(payment => 
        !isAcknowledged('purchase', payment.id)
      ) || [];
      
      setNewPurchases(newPurchasesData.length);
    } catch (error) {
      console.error('Error loading new purchases:', error);
    }
  };

  const loadNewUsers = async () => {
    if (!userProfile?.id || userProfile.role !== 'admin') return;
    
    // Δεν κάνουμε τίποτα εδώ - περιμένουμε event από τη σελίδα Users
    console.log('🔢 Sidebar: Waiting for new users count from Users page');
  };

  useEffect(() => {
    if (userProfile?.id) {
      loadAvailableOffers();
      loadPendingVideocalls();
      loadTodayBookings();
      loadTotalPurchases();
      loadNewGymBookings();
      loadNewPurchases();
      loadNewUsers();
    }

    // Real-time subscription για νέες κρατήσεις γυμναστηρίου
    if (userProfile?.role === 'admin') {
      const gymBookingsChannel = supabase
        .channel('gym-bookings-sidebar')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'booking_sessions',
            filter: 'booking_type=eq.gym_visit'
          },
          () => {
            console.log('Νέα κράτηση γυμναστηρίου - ενημέρωση sidebar');
            loadNewGymBookings();
          }
        )
        .subscribe();

      // Real-time subscription για νέες πληρωμές
      const paymentsChannel = supabase
        .channel('payments-sidebar')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'payments'
          },
          () => {
            console.log('Νέα πληρωμή - ενημέρωση sidebar');
            loadNewPurchases();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'payments'
          },
          () => {
            console.log('Ενημέρωση πληρωμής - ενημέρωση sidebar');
            loadNewPurchases();
          }
        )
        .subscribe();

      // Real-time subscription για νέους χρήστες
      const usersChannel = supabase
        .channel('users-sidebar')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'app_users'
          },
          () => {
            console.log('Νέος χρήστης - ενημέρωση sidebar');
            loadNewUsers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(gymBookingsChannel);
        supabase.removeChannel(paymentsChannel);
        supabase.removeChannel(usersChannel);
      };
    }
  }, [userProfile?.id, userProfile?.role]);

  useEffect(() => {
    // Listen για το event που στέλνει το GymBookingsOverview όταν γίνει mark as read
    const handleGymBookingsRead = () => {
      // Επαναφορτώνουμε τα bookings για να υπολογίσουμε σωστά τα νέα
      loadNewGymBookings();
    };

    // Listen για το event που στέλνει το VideocallBookingCard όταν γίνει approve/reject
    const handleVideocallStatusChanged = () => {
      loadPendingVideocalls();
    };

    // Listen για το event που στέλνει το AdminShop όταν γίνει "Ενημερώθηκα"
    const handlePurchasesAcknowledged = () => {
      loadNewPurchases();
    };

    // Listen για το event που στέλνει το Offers page όταν γίνει "Ενημερώθηκα"
    const handleOffersAcknowledged = () => {
      loadAvailableOffers();
    };

    // Listen για το event που στέλνει το Users page όταν γίνει "Ενημερώθηκα"
    const handleUsersAcknowledged = () => {
      // Δεν χρειάζεται να κάνουμε τίποτα - το νέο count θα έρθει από το new-users-count event
    };

    // Listen για το event που στέλνει το Users page με τον αριθμό νέων χρηστών
    const handleNewUsersCount = (event: CustomEvent) => {
      const { count } = event.detail;
      console.log('🔢 Sidebar: Received new users count from Users page:', count);
      setNewUsers(count);
    };
    
    window.addEventListener('gym-bookings-read', handleGymBookingsRead);
    window.addEventListener('videocall-status-changed', handleVideocallStatusChanged);
    window.addEventListener('purchases-acknowledged', handlePurchasesAcknowledged);
    window.addEventListener('offers-acknowledged', handleOffersAcknowledged);
    window.addEventListener('users-acknowledged', handleUsersAcknowledged);
    window.addEventListener('new-users-count', handleNewUsersCount as EventListener);
    
    return () => {
      window.removeEventListener('gym-bookings-read', handleGymBookingsRead);
      window.removeEventListener('videocall-status-changed', handleVideocallStatusChanged);
      window.removeEventListener('purchases-acknowledged', handlePurchasesAcknowledged);
      window.removeEventListener('offers-acknowledged', handleOffersAcknowledged);
      window.removeEventListener('users-acknowledged', handleUsersAcknowledged);
      window.removeEventListener('new-users-count', handleNewUsersCount as EventListener);
    };
  }, [userProfile?.id]);


  const menuItems = [
    { 
      icon: Home, 
      label: "Αρχική", 
      path: "/dashboard",
      badge: null
    },
    { 
      icon: Users, 
      label: "Χρήστες", 
      path: "/dashboard/users",
      badge: userProfile?.role === 'admin' && newUsers > 0 ? newUsers.toString() : null
    },
    { 
      icon: UsersIcon, 
      label: "Ομάδες", 
      path: "/dashboard/groups",
      badge: null
    },
    { 
      icon: Crown, 
      label: "Συνδρομές RID", 
      path: "/dashboard/subscriptions",
      badge: null
    },
    {
      icon: ShoppingCart,
      label: "Αγορές",
      path: "/dashboard/shop",
      badge: userProfile?.role === 'admin' && newPurchases > 0 ? newPurchases.toString() : null
    },
    {
      icon: Tag,
      label: "Προσφορές",
      path: "/dashboard/offers",
      badge: availableOffers > 0 ? availableOffers.toString() : null
    },
    {
      icon: Video,
      label: "Online Coaching",
      path: "/dashboard/online-coaching",
      badge: userProfile?.role === 'admin' && pendingVideocalls > 0 ? pendingVideocalls.toString() : null
    },
    {
      icon: Calendar,
      label: "Online Booking",
      path: "/dashboard/online-booking",
      badge: userProfile?.role === 'admin' && newGymBookings > 0 ? newGymBookings.toString() : null,
      hasCancellation: false
    },
    {
      icon: Settings,
      label: "Διαχείριση Τμημάτων",
      path: "/dashboard/booking-sections",
      badge: null
    },
    { 
      icon: Calendar, 
      label: "Προγράμματα", 
      path: "/dashboard/programs",
      badge: null
    },
    { 
      icon: BarChart3, 
      label: "Ενεργά Προγράμματα", 
      path: "/dashboard/active-programs",
      badge: null
    },
    { 
      icon: CreditCard, 
      label: "Program Cards", 
      path: "/dashboard/program-cards",
      badge: null
    },
    { 
      icon: FileText, 
      label: "Τεστ", 
      path: "/dashboard/tests",
      badge: null
    },
    { 
      icon: Dumbbell, 
      label: "Ασκήσεις", 
      path: "/dashboard/exercises",
      badge: null
    },
    {
      icon: TrendingUp,
      label: "Analytics",
      path: "/dashboard/analytics",
      badge: "NEW"
    },
    { 
      icon: BookOpen, 
      label: "Άρθρα", 
      path: "/dashboard/articles",
      badge: null
    },
    { 
      icon: BarChart3, 
      label: "Αποτελέσματα", 
      path: "/dashboard/results",
      badge: null
    },
    {
      icon: Mail,
      label: "Webmail",
      path: "https://webmail.hyperkids.gr/",
      badge: null,
      external: true
    },
    {
      icon: ArrowLeft,
      label: "Επιστροφή στην Αρχική",
      path: "/",
      badge: null
    }
  ];

  const handleMenuClick = (item: any) => {
    if (item.external) {
      window.open(item.path, '_blank');
    } else {
      navigate(item.path);
    }
  };

  const handleAIChatClick = () => {
    setIsAIChatOpen(true);
  };

  const headerContent = (
    <div>
      <h2 className={`font-semibold text-gray-800 ${isMobile ? 'text-base' : 'text-sm'}`}>
        Admin Panel
      </h2>
      <p className={`text-gray-500 ${isMobile ? 'text-sm' : 'text-xs'}`}>Διαχείριση συστήματος</p>
    </div>
  );

  const navigationContent = (
    <div className={`space-y-1 ${isMobile ? 'md:space-y-2' : 'space-y-2'}`}>
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path && !item.external;
        return (
          <button
            key={item.path}
            onClick={() => handleMenuClick(item)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 rounded-none ${
              isActive ? 'bg-[#00ffba]/10 text-black border-r-2 border-[#00ffba]' : 'text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {(!isCollapsed || isMobile) && <span className="truncate">{item.label}</span>}
            </div>
            {(!isCollapsed || isMobile) && item.badge && (
              <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                item.badge === 'NEW' 
                  ? 'bg-[#00ffba] text-black' 
                  : item.hasCancellation
                  ? 'bg-red-300 text-red-800'
                  : item.path === '/dashboard/online-booking'
                  ? 'bg-blue-500 text-white'
                  : /^\d+$/.test(item.badge)
                  ? 'bg-[#fa3055] text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
      
      {/* RidAI Προπονητής Button */}
      <button
        onClick={handleAIChatClick}
        className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 rounded-none border-t border-gray-200 mt-2 pt-4`}
      >
        <Brain className="h-5 w-5 flex-shrink-0 text-[#00ffba]" />
        {(!isCollapsed || isMobile) && (
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-medium truncate">RidAI Προπονητής</span>
            <span className="text-xs text-gray-500 truncate">powered by hyperteam</span>
          </div>
        )}
      </button>
    </div>
  );

  return (
    <>
      <BaseSidebar
        isCollapsed={isCollapsed && !isMobile}
        setIsCollapsed={setIsCollapsed}
        headerContent={headerContent}
        navigationContent={navigationContent}
      />
      
      <EnhancedAIChatDialog
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        athleteId={userProfile?.id}
        athleteName={userProfile?.name}
        athletePhotoUrl={userProfile?.photo_url}
      />
    </>
  );
};
