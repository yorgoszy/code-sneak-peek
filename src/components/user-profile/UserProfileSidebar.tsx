import { 
  User, 
  BarChart3, 
  Activity, 
  Calendar,
  FileText,
  CreditCard,
  Brain,
  Menu,
  X
} from "lucide-react";
import { BaseSidebar } from "@/components/sidebar/BaseSidebar";
import { useState } from "react";
import { SmartAIChatDialog } from "@/components/ai-chat/SmartAIChatDialog";
import { Button } from "@/components/ui/button";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const handleTabClick = (key: string) => {
    setActiveTab(key);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const headerContent = (
    <div>
      <h2 className="text-sm font-semibold text-gray-800">
        {userProfile.name}
      </h2>
      <p className="text-xs text-gray-500 capitalize">{userProfile.role}</p>
    </div>
  );

  const navigationContent = (
    <div className="space-y-2">
      {menuItems.map((item) => {
        const isActive = activeTab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => handleTabClick(item.key)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 rounded-none ${
              isActive ? 'bg-[#00ffba]/10 text-[#00ffba] border-r-2 border-[#00ffba]' : 'text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {(!isCollapsed || isMobile) && <span>{item.label}</span>}
            </div>
            {(!isCollapsed || isMobile) && item.badge && (
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
      
      {/* RID AI Button */}
      <button
        onClick={handleAIChatClick}
        className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 rounded-none border-t border-gray-200 mt-2 pt-4"
      >
        <Brain className="h-5 w-5 flex-shrink-0 text-[#00ffba]" />
        {(!isCollapsed || isMobile) && (
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">RID AI Προπονητής</span>
            <span className="text-xs text-gray-500">Μαθαίνει & θυμάται</span>
          </div>
        )}
      </button>
    </div>
  );

  const bottomContent = (!isCollapsed || isMobile) ? (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
        Γρήγορη Επισκόπηση
      </h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 p-2 rounded-none">
          <div className="font-semibold text-gray-800">{stats.programsCount}</div>
          <div className="text-gray-600">Προγράμματα</div>
        </div>
        <div className="bg-gray-50 p-2 rounded-none">
          <div className="font-semibold text-gray-800">{stats.testsCount}</div>
          <div className="text-gray-600">Τεστ</div>
        </div>
      </div>
    </div>
  ) : undefined;

  // Mobile menu overlay
  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <div className="fixed top-4 left-4 z-50 md:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-none bg-white shadow-md"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed top-0 left-0 h-full w-80 bg-white z-50 shadow-xl md:hidden overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  {headerContent}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-none"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4">
                {navigationContent}
              </div>
              {bottomContent && (
                <div className="p-4 border-t border-gray-200">
                  {bottomContent}
                </div>
              )}
            </div>
          </>
        )}
        
        <SmartAIChatDialog
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          athleteId={userProfile.id}
          athleteName={userProfile.name}
        />
      </>
    );
  }

  // Desktop/Tablet view - keep existing functionality
  return (
    <>
      <BaseSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        headerContent={headerContent}
        navigationContent={navigationContent}
        bottomContent={bottomContent}
      />
      
      <SmartAIChatDialog
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        athleteId={userProfile.id}
        athleteName={userProfile.name}
      />
    </>
  );
};
