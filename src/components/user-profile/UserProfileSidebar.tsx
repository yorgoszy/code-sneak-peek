
import { 
  User, 
  BarChart3, 
  Activity, 
  Calendar,
  FileText,
  CreditCard
} from "lucide-react";
import { BaseSidebar } from "@/components/sidebar/BaseSidebar";

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

  const headerContent = null;

  const navigationContent = (
    <div className="space-y-1">
      {menuItems.map((item) => {
        const isActive = activeTab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`w-full flex items-center justify-center p-3 text-sm font-medium transition-colors hover:bg-gray-100 rounded-none relative ${
              isActive ? 'bg-[#00ffba]/10 text-[#00ffba] border-r-2 border-[#00ffba]' : 'text-gray-700'
            }`}
            title={item.label}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {item.badge && (
              <span className="absolute -top-1 -right-1 bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const bottomContent = (
    <div className="grid grid-cols-1 gap-1 text-xs">
      <div className="bg-gray-50 p-2 rounded-none text-center">
        <div className="font-semibold text-gray-800">{stats.programsCount}</div>
        <div className="text-gray-600 text-xs">Prog</div>
      </div>
      <div className="bg-gray-50 p-2 rounded-none text-center">
        <div className="font-semibold text-gray-800">{stats.testsCount}</div>
        <div className="text-gray-600 text-xs">Test</div>
      </div>
    </div>
  );

  return (
    <BaseSidebar
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      headerContent={headerContent}
      navigationContent={navigationContent}
      bottomContent={bottomContent}
    />
  );
};
