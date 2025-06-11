
import React from 'react';
import { Home, User, Calendar, Activity, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRoleCheck } from '@/hooks/useRoleCheck';

export const MobileBottomBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useRoleCheck();

  const items = [
    { icon: Home, label: "Αρχική", path: "/dashboard" },
    { icon: User, label: "Χρήστες", path: "/dashboard/users", adminOnly: true },
    { icon: Activity, label: "Προγράμματα", path: "/dashboard/programs", adminOnly: true },
    { icon: Calendar, label: "Ενεργά", path: "/active-programs" },
    { icon: Settings, label: "Ρυθμίσεις", path: "/dashboard/settings" },
  ];

  const visibleItems = items.filter(item => !item.adminOnly || isAdmin());

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-50 md:hidden">
      <div className="flex justify-around">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-3 rounded-none transition-colors ${
                isActive 
                  ? 'text-[#00ffba] bg-[#00ffba]/10' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
