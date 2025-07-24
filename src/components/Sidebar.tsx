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
  const isMobile = useIsMobile();

  useEffect(() => {
    if (userProfile?.id) {
      loadAvailableOffers();
    }
  }, [userProfile?.id]);

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
        // Για admin: υπολογίζουμε πόσες από τις τρέχουσες προσφορές έχουν γίνει δεκτές
        const allActiveOffers = offers || [];
        
        if (allActiveOffers.length === 0) {
          setAvailableOffers(0);
          return;
        }
        
        // Βρίσκουμε τις αποδεκτές προσφορές από payments
        const { data: acceptedOffers, error: paymentsError } = await supabase
          .from('payments')
          .select('subscription_type_id')
          .not('subscription_type_id', 'is', null)
          .gte('payment_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Τελευταίες 30 ημέρες

        if (paymentsError) throw paymentsError;
        
        // Υπολογίζουμε πόσες προσφορές έχουν γίνει δεκτές
        const acceptedOffersCount = acceptedOffers?.length || 0;
        setAvailableOffers(acceptedOffersCount);
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
      badge: null
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
      icon: Dumbbell, 
      label: "Ασκήσεις", 
      path: "/dashboard/exercises",
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
      icon: ShoppingCart,
      label: "Αγορές",
      path: "/dashboard/shop",
      badge: null
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
      badge: "NEW"
    },
    {
      icon: Calendar,
      label: "Online Booking",
      path: "/dashboard/online-booking",
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
              isActive ? 'bg-[#00ffba]/10 text-[#00ffba] border-r-2 border-[#00ffba]' : 'text-gray-700'
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
