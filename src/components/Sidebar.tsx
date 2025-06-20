
import { 
  Home, 
  Users, 
  Dumbbell, 
  Calendar, 
  BarChart3, 
  Settings,
  FileText,
  CreditCard,
  Bot,
  UsersIcon,
  Mail,
  ArrowLeft
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { BaseSidebar } from "@/components/sidebar/BaseSidebar";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useState } from "react";
import { AIChatDialog } from "@/components/ai-chat/AIChatDialog";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useRoleCheck();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

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
      icon: Mail,
      label: "Webmail",
      path: "#",
      badge: null
    },
    {
      icon: ArrowLeft,
      label: "Επιστροφή στην Αρχική",
      path: "/",
      badge: null
    }
  ];

  const handleAIChatClick = () => {
    setIsAIChatOpen(true);
  };

  const headerContent = (
    <div>
      <h2 className="text-sm font-semibold text-gray-800">
        Admin Panel
      </h2>
      <p className="text-xs text-gray-500">Διαχείριση συστήματος</p>
    </div>
  );

  const navigationContent = (
    <div className="space-y-2">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 rounded-none ${
              isActive ? 'bg-[#00ffba]/10 text-[#00ffba] border-r-2 border-[#00ffba]' : 'text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </div>
            {!isCollapsed && item.badge && (
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
      
      {/* AI Βοηθός Button */}
      <button
        onClick={handleAIChatClick}
        className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 rounded-none border-t border-gray-200 mt-2 pt-4"
      >
        <Bot className="h-5 w-5 flex-shrink-0 text-[#00ffba]" />
        {!isCollapsed && <span>AI Βοηθός</span>}
      </button>
    </div>
  );

  return (
    <>
      <BaseSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        headerContent={headerContent}
        navigationContent={navigationContent}
      />
      
      <AIChatDialog
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        athleteId={userProfile?.id}
        athleteName={userProfile?.name}
      />
    </>
  );
};
