
import React from 'react';
import { Home, User, Calendar, Activity, Settings, Dumbbell, TrendingUp, FileText, BarChart3, UserPlus, CalendarCheck, CreditCard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRoleCheck } from '@/hooks/useRoleCheck';

export const MobileBottomBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useRoleCheck();

  const items = [
    { icon: BarChart3, label: "Επισκόπηση", path: "/dashboard" },
    { icon: User, label: "Χρήστες", path: "/dashboard/users", adminOnly: true },
    { icon: UserPlus, label: "Ομάδες", path: "/dashboard/groups", adminOnly: true },
    { icon: Dumbbell, label: "Ασκήσεις", path: "/dashboard/exercises", adminOnly: true },
    { icon: Activity, label: "Τεστ", path: "/dashboard/tests", adminOnly: true },
    { icon: TrendingUp, label: "Αποτελέσματα", path: "/dashboard/results", adminOnly: true },
    { icon: Calendar, label: "Προγράμματα", path: "/dashboard/programs", adminOnly: true },
    { icon: CalendarCheck, label: "Ενεργά", path: "/dashboard/active-programs" },
    { icon: CreditCard, label: "Cards", path: "/dashboard/program-cards", adminOnly: true },
    { icon: Settings, label: "Ρυθμίσεις", path: "/dashboard/settings" },
  ];

  const visibleItems = items.filter(item => !item.adminOnly || isAdmin());

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-50 md:hidden">
      <div className="flex justify-around overflow-x-auto">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-2 rounded-none transition-colors min-w-0 flex-shrink-0 ${
                isActive 
                  ? 'text-[#00ffba] bg-[#00ffba]/10' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-xs mt-1 truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
