
import React from 'react';
import { 
  BarChart3, 
  Activity, 
  Calendar,
  FileText,
  CreditCard
} from "lucide-react";

interface MobileUserNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: any;
}

const userNavItems = [
  { 
    icon: BarChart3, 
    label: "Επισκόπηση", 
    key: "overview"
  },
  { 
    icon: Activity, 
    label: "Προγράμματα", 
    key: "programs"
  },
  { 
    icon: Calendar, 
    label: "Ημερολόγιο", 
    key: "calendar"
  },
  { 
    icon: FileText, 
    label: "Τεστ", 
    key: "tests"
  },
  { 
    icon: CreditCard, 
    label: "Πληρωμές", 
    key: "payments"
  },
];

export const MobileUserNavigation: React.FC<MobileUserNavigationProps> = ({
  activeTab,
  setActiveTab,
  stats
}) => {
  return (
    <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
      <div className="flex">
        {userNavItems.map((item) => {
          const isActive = activeTab === item.key;
          const badgeCount = item.key === 'programs' ? stats.programsCount : 
                           item.key === 'tests' ? stats.testsCount : 
                           item.key === 'payments' ? stats.paymentsCount : null;
          
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 text-xs font-medium transition-colors relative ${
                isActive 
                  ? 'text-[#00ffba] bg-[#00ffba]/10' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <item.icon className={`h-5 w-5 mb-1 ${isActive ? 'text-[#00ffba]' : 'text-gray-600'}`} />
              <span className="truncate w-full text-center leading-tight">
                {item.label}
              </span>
              {badgeCount && badgeCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
