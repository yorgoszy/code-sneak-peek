
import React from 'react';
import { BarChart3, Activity, Calendar, FileText, CreditCard } from 'lucide-react';

interface UserProfileMobileBottomBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: any;
}

export const UserProfileMobileBottomBar: React.FC<UserProfileMobileBottomBarProps> = ({
  activeTab,
  setActiveTab,
  stats
}) => {
  const items = [
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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-50 md:hidden">
      <div className="flex justify-around">
        {items.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex flex-col items-center py-2 px-3 rounded-none transition-colors relative ${
                isActive 
                  ? 'text-[#00ffba] bg-[#00ffba]/10' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-gray-200 text-gray-700 text-xs px-1 py-0.5 rounded-full min-w-4 h-4 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
