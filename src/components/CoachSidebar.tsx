import { 
  Home, 
  Users, 
  ArrowLeft,
  Brain
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { BaseSidebar } from "@/components/sidebar/BaseSidebar";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useState } from "react";
import { EnhancedAIChatDialog } from "@/components/ai-chat/EnhancedAIChatDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface CoachSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const CoachSidebar = ({ isCollapsed, setIsCollapsed }: CoachSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useRoleCheck();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const isMobile = useIsMobile();

  const menuItems = [
    { 
      icon: Home, 
      label: "Επισκόπηση", 
      path: "/dashboard",
      badge: null
    },
    { 
      icon: Users, 
      label: "Χρήστες", 
      path: "/dashboard/users",
      badge: null
    },
    { type: 'separator' },
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
        Coach Panel
      </h2>
      <p className={`text-gray-500 ${isMobile ? 'text-sm' : 'text-xs'}`}>Διαχείριση αθλητών</p>
    </div>
  );

  const navigationContent = (
    <div className={`space-y-1 ${isMobile ? 'md:space-y-2' : 'space-y-2'}`}>
      {menuItems.map((item, index) => {
        // Separator rendering
        if (item.type === 'separator') {
          return (
            <div 
              key={`separator-${index}`} 
              className="my-2 h-px bg-gray-300" 
            />
          );
        }

        // Regular menu item rendering
        const isActive = location.pathname === item.path;
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
              <span className="text-xs px-2 py-1 rounded-full flex-shrink-0 bg-[#fa3055] text-white">
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
