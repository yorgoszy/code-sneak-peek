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
  ArrowUp,
  Crown,
  TrendingUp,
  BookOpen,
  ShoppingCart,
  MonitorPlay,
  Video,
  Tag,
  Pilcrow,
  Gauge,
  Download,
  ChevronDown,
  ChevronUp,
  Timer,
  Utensils,
  Award,
  Swords,
  Compass,
  Heart
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { BaseSidebar } from "@/components/sidebar/BaseSidebar";
import { Separator } from "@/components/ui/separator";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useState } from "react";
import { EnhancedAIChatDialog } from "@/components/ai-chat/EnhancedAIChatDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useRoleCheck();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [availableOffers, setAvailableOffers] = useState(0);
  const [pendingVideocalls, setPendingVideocalls] = useState(0);
  const [todayBookings, setTodayBookings] = useState({ total: 0, cancelled: 0 });
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [newGymBookings, setNewGymBookings] = useState(0);
  const [newPurchases, setNewPurchases] = useState(0);
  const [newUsers, setNewUsers] = useState(0);
  const isMobile = useIsMobile();

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
          .not('offer_id', 'is', null)
          .gte('payment_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Τελευταίες 30 ημέρες

        if (paymentsError) throw paymentsError;
        
        // Παίρνουμε τα acknowledged offer IDs από τη βάση δεδομένων
        const { data: acknowledgedData } = await supabase
          .from('acknowledged_payments')
          .select('payment_id')
          .eq('admin_user_id', userProfile.id);

        const acknowledgedOfferIds = new Set(acknowledgedData?.map(a => a.payment_id) || []);
        
        // Υπολογίζουμε πόσες αποδεκτές προσφορές δεν έχουν επισημανθεί
        const newAcceptedOffers = acceptedOffers?.filter(offer => 
          !acknowledgedOfferIds.has(offer.id)
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
    if (!userProfile?.id || userProfile.role !== 'admin') {
      setNewGymBookings(0);
      return;
    }
    
    try {
      // Φορτώνουμε όλες τις κρατήσεις γυμναστηρίου
      const { data: allBookings, error } = await supabase
        .from('booking_sessions')
        .select('id')
        .eq('booking_type', 'gym_visit');

      if (error) throw error;
      
      // Φορτώνουμε τα acknowledged bookings από τη βάση δεδομένων
      const { data: acknowledgedBookings, error: ackError } = await supabase
        .from('acknowledged_gym_bookings')
        .select('booking_id')
        .eq('admin_user_id', userProfile.id);

      if (ackError) throw ackError;

      const acknowledgedBookingIds = new Set(
        acknowledgedBookings?.map(ack => ack.booking_id) || []
      );

      // Υπολογίζουμε τα νέα bookings (όσα δεν έχουν επισημανθεί ως "ενημερώθηκα")
      const newBookingsCount = (allBookings || []).filter(booking => 
        !acknowledgedBookingIds.has(booking.id)
      ).length;
      
      console.log('Total gym bookings:', allBookings?.length || 0, 'Acknowledged:', acknowledgedBookings?.length || 0, 'New:', newBookingsCount, 'Admin ID:', userProfile.id);
      setNewGymBookings(newBookingsCount);
    } catch (error) {
      console.error('Error loading new gym bookings:', error);
      setNewGymBookings(0);
    }
  };

  const loadNewPurchases = async () => {
    // Αν δεν είναι admin, καθαρίζουμε το state και επιστρέφουμε
    if (!userProfile?.id || userProfile.role !== 'admin') {
      setNewPurchases(0);
      return;
    }
    
    try {
      // Παίρνουμε όλες τις ολοκληρωμένες πληρωμές
      const { data: allPayments, error } = await supabase
        .from('payments')
        .select('id, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Αν δεν υπάρχουν πληρωμές, μηδενίζουμε
      if (!allPayments || allPayments.length === 0) {
        setNewPurchases(0);
        return;
      }

      // Φέρνουμε τα acknowledged payments από τη βάση δεδομένων για τον συγκεκριμένο admin
      const { data: acknowledgedPayments, error: ackError } = await supabase
        .from('acknowledged_payments')
        .select('payment_id')
        .eq('admin_user_id', userProfile.id);

      if (ackError) throw ackError;

      const acknowledgedPaymentIds = new Set(
        acknowledgedPayments?.map(ack => ack.payment_id) || []
      );

      // Υπολογίζουμε τις νέες αγορές (όσες δεν έχουν επισημανθεί ως "ενημερώθηκα")
      const newPurchasesData = allPayments.filter(payment => 
        !acknowledgedPaymentIds.has(payment.id)
      );
      
      setNewPurchases(newPurchasesData.length);
    } catch (error) {
      console.error('Error loading new purchases:', error);
      setNewPurchases(0);
    }
  };

  const loadNewUsers = async () => {
    if (!userProfile?.id || userProfile.role !== 'admin') return;
    
    try {
      // Παίρνουμε όλους τους χρήστες
      const { data: allUsers, error } = await supabase
        .from('app_users')
        .select('id, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Φέρνουμε τους acknowledged χρήστες από τη βάση για τον τρέχοντα admin
      if (!userProfile?.id) {
        setNewUsers(allUsers?.length || 0);
        return;
      }

      const { data: acknowledgedData } = await supabase
        .from('acknowledged_users')
        .select('user_id')
        .eq('admin_user_id', userProfile.id);

      const acknowledgedUserIds = new Set(
        (acknowledgedData || []).map(item => item.user_id)
      );

      // Υπολογίζουμε τους νέους χρήστες (όσους δεν έχουν επισημανθεί ως "ενημερώθηκα")
      const newUsersData = allUsers?.filter(user => 
        !acknowledgedUserIds.has(user.id)
      ) || [];
      
      setNewUsers(newUsersData.length);
    } catch (error) {
      console.error('Error loading new users:', error);
    }
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
      loadNewUsers();
    };
    
    window.addEventListener('gym-bookings-read', handleGymBookingsRead);
    window.addEventListener('videocall-status-changed', handleVideocallStatusChanged);
    window.addEventListener('purchases-acknowledged', handlePurchasesAcknowledged);
    window.addEventListener('offers-acknowledged', handleOffersAcknowledged);
    window.addEventListener('users-acknowledged', handleUsersAcknowledged);
    
    return () => {
      window.removeEventListener('gym-bookings-read', handleGymBookingsRead);
      window.removeEventListener('videocall-status-changed', handleVideocallStatusChanged);
      window.removeEventListener('purchases-acknowledged', handlePurchasesAcknowledged);
      window.removeEventListener('offers-acknowledged', handleOffersAcknowledged);
      window.removeEventListener('users-acknowledged', handleUsersAcknowledged);
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
    { type: 'separator' },
    { 
      icon: Calendar, 
      label: "Προγράμματα", 
      path: "/dashboard/programs",
      badge: null
    },
    { 
      icon: FileText, 
      label: "Templates", 
      path: "/dashboard/program-templates",
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
      icon: Utensils,
      label: "Διατροφή",
      path: "/dashboard/nutrition",
      badge: null
    },
    { type: 'separator' },
    {
      icon: Calendar,
      label: "Ετήσιος Προγραμματισμός",
      path: "/dashboard/annual-planning",
      badge: null
    },
    {
      icon: Settings,
      label: "Ρύθμιση Φάσεων",
      path: "/dashboard/phase-config",
      badge: null
    },
    {
      icon: TrendingUp,
      label: "Πρόοδος",
      path: "/dashboard/progress",
      badge: null
    },
    {
      icon: Users,
      label: "Πρόοδος Αθλητών",
      path: "/dashboard/athletes-progress",
      badge: null
    },
    {
      icon: Award,
      label: "Στόχοι & Βραβεία",
      path: "/dashboard/goals-awards",
      badge: null
    },
    {
      icon: MonitorPlay,
      label: "Video Analysis",
      path: "/dashboard/video-analysis",
      badge: null
    },
    {
      icon: Timer,
      label: "Sprint Timer",
      path: "/dashboard/sprint-timer",
      badge: null
    },
    {
      icon: Compass,
      label: "Change Direction",
      path: "/dashboard/change-direction",
      badge: null
    },
    {
      icon: Brain,
      label: "Cognitive",
      path: "/dashboard/cognitive",
      badge: null
    },
    {
      icon: ArrowUp,
      label: "Jump",
      path: "/dashboard/jump",
      badge: null
    },
    {
      icon: Gauge,
      label: "Bar Velocity",
      path: "/dashboard/bar-velocity",
      badge: null
    },
    {
      icon: Heart,
      label: "PPG HRV",
      path: "/dashboard/ppg-hrv",
      badge: null
    },
    { 
      icon: Dumbbell, 
      label: "Ασκήσεις", 
      path: "/dashboard/exercises",
      badge: null
    },
    { 
      icon: Pilcrow, 
      label: "Διατάσεις", 
      path: "/dashboard/stretches",
      badge: null
    },
    {
      icon: Users,
      label: "Muscle Mapping",
      path: "/dashboard/muscle-mapping",
      badge: null
    },
    {
      icon: Gauge,
      label: "1RM",
      path: "/dashboard/one-rm",
      badge: null
    },
    {
      icon: Brain,
      label: "AI Knowledge Base",
      path: "/dashboard/ai-knowledge",
      badge: null
    },
    {
      icon: BookOpen,
      label: "Knowledge",
      path: "/dashboard/knowledge",
      badge: null
    },
    {
      icon: TrendingUp,
      label: "Analytics",
      path: "/dashboard/analytics",
      badge: null
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
      icon: BookOpen,
      label: "Σχολικές Σημειώσεις",
      path: "/dashboard/school-notes",
      badge: null
    },
    {
      icon: Mail,
      label: "Webmail",
      path: "https://webmail.hyperkids.gr/",
      badge: null,
      external: true
    },
    { type: 'separator' },
    {
      icon: Download,
      label: "Download PWA Apps",
      path: null,
      badge: null,
      isDownloadMenu: true
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

  const pwaWidgets = [
    { name: "Ημερολόγιο", path: "/install-calendar", icon: Calendar },
    { name: "Συνδρομές", path: "/install-subscriptions", icon: Crown },
    { name: "Πρόοδος Αθλητών", path: "/install-athletes-progress", icon: TrendingUp }
  ];

  const navigationContent = (
    <div className={`space-y-1 ${isMobile ? 'md:space-y-2' : 'space-y-2'}`}>
      {menuItems.map((item, index) => {
        // Separator rendering
        if (item.type === 'separator') {
          return (
            <Separator 
              key={`separator-${index}`} 
              className="my-2 bg-gray-300" 
            />
          );
        }

        // Download menu rendering
        if (item.isDownloadMenu) {
          return (
            <div key="download-menu">
              <button
                onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 rounded-none text-gray-700`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {(!isCollapsed || isMobile) && <span className="truncate">{item.label}</span>}
                </div>
                {(!isCollapsed || isMobile) && (
                  isDownloadMenuOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {isDownloadMenuOpen && (!isCollapsed || isMobile) && (
                <div className="ml-8 space-y-1 mt-1">
                  {pwaWidgets.map((widget) => (
                    <button
                      key={widget.path}
                      onClick={() => navigate(widget.path)}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-none"
                    >
                      <widget.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{widget.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // Regular menu item rendering
        const isActive = location.pathname === item.path && !item.external;
        return (
          <button
            key={item.path}
            onClick={() => handleMenuClick(item)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 rounded-none ${
              isActive ? 'bg-[#cb8954]/10 text-black border-r-2 border-[#cb8954]' : 'text-gray-700'
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
        <Brain className="h-5 w-5 flex-shrink-0 text-[#cb8954]" />
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
