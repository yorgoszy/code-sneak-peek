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
  TrendingUp
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { BaseSidebar } from "@/components/sidebar/BaseSidebar";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useState } from "react";
import { EnhancedAIChatDialog } from "@/components/ai-chat/EnhancedAIChatDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useRoleCheck();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const isMobile = useIsMobile();

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
      icon: BarChart3,
      label: "Αποτελέσματα",
      path: "/dashboard/results",
      badge: null
    },
    {
      icon: TrendingUp,
      label: "Analytics",
      path: "/dashboard/analytics",
      badge: "NEW"
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
