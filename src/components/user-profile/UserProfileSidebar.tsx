
import { 
  User, 
  BarChart3, 
  Activity, 
  Calendar,
  FileText,
  CreditCard,
  Brain
} from "lucide-react";
import { BaseSidebar } from "@/components/sidebar/BaseSidebar";
import { useState } from "react";
import { FreeAIChatDialog } from "@/components/ai-chat/FreeAIChatDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserProfileSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: any;
  stats: any;
}

export const UserProfileSidebar = ({ 
  isCollapsed, 
  setIsCollapsed, 
  activeTab, 
  setActiveTab,
  userProfile,
  stats
}: UserProfileSidebarProps) => {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const menuItems = [
    { 
      icon: BarChart3, 
      label: "Επισκόπηση", 
      key: "overview",
      badge: null
    },
    { 
      icon: Activity, 
      label: "Προγράμματα", 
      key: "programs",
      badge: stats.programsCount > 0 ? stats.programsCount : null
    },
    { 
      icon: Calendar, 
      label: "Ημερολόγιο", 
      key: "calendar",
      badge: null
    },
    { 
      icon: FileText, 
      label: "Τεστ", 
      key: "tests",
      badge: stats.testsCount > 0 ? stats.testsCount : null
    },
    { 
      icon: CreditCard, 
      label: "Πληρωμές", 
      key: "payments",
      badge: stats.paymentsCount > 0 ? stats.paymentsCount : null
    },
  ];

  const handleAIChatClick = () => {
    setIsAIChatOpen(true);
  };

  const headerContent = (
    <div className="px-1">
      <h2 className={`font-semibold text-gray-800 truncate ${
        isMobile ? 'text-base' : 'text-sm'
      }`}>
        {userProfile.name}
      </h2>
      <p className={`text-gray-500 capitalize truncate ${
        isMobile ? 'text-sm' : 'text-xs'
      }`}>
        {userProfile.role}
      </p>
    </div>
  );

  const navigationContent = (
    <div className="space-y-1 md:space-y-2">
      {menuItems.map((item) => {
        const isActive = activeTab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`w-full flex items-center justify-between px-3 py-2 md:py-2 text-sm font-medium transition-colors hover:bg-gray-100 rounded-none ${
              isActive ? 'bg-[#00ffba]/10 text-[#00ffba] border-r-2 border-[#00ffba]' : 'text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {(!isCollapsed || isMobile) && <span className="truncate">{item.label}</span>}
            </div>
            {(!isCollapsed || isMobile) && item.badge && (
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full flex-shrink-0">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
      
      {/* RID AI Button */}
      <button
        onClick={handleAIChatClick}
        className="w-full flex items-center space-x-3 px-3 py-2 md:py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 rounded-none border-t border-gray-200 mt-2 pt-4"
      >
        <Brain className="h-5 w-5 flex-shrink-0 text-[#00ffba]" />
        {(!isCollapsed || isMobile) && (
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-medium truncate">RID AI Προπονητής</span>
            <span className="text-xs text-gray-500 truncate">Μαθαίνει & θυμάται</span>
          </div>
        )}
      </button>
    </div>
  );

  const bottomContent = (!isCollapsed || isMobile) ? (
    <div className="space-y-2 px-1">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
        Γρήγορη Επισκόπηση
      </h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 p-2 rounded-none">
          <div className="font-semibold text-gray-800">{stats.programsCount}</div>
          <div className="text-gray-600 text-xs">Προγράμματα</div>
        </div>
        <div className="bg-gray-50 p-2 rounded-none">
          <div className="font-semibold text-gray-800">{stats.testsCount}</div>
          <div className="text-gray-600 text-xs">Τεστ</div>
        </div>
      </div>
    </div>
  ) : undefined;

  return (
    <>
      <BaseSidebar
        isCollapsed={isCollapsed && !isMobile}
        setIsCollapsed={setIsCollapsed}
        headerContent={headerContent}
        navigationContent={navigationContent}
        bottomContent={bottomContent}
      />
      
      <FreeAIChatDialog
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        athleteId={userProfile.id}
        athleteName={userProfile.name}
      />
    </>
  );
};
