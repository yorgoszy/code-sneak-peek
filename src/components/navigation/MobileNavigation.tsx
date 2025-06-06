
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  UserPlus, 
  Dumbbell, 
  Activity, 
  TrendingUp, 
  Calendar,
  CalendarCheck,
  CreditCard,
  Home,
  Mail
} from "lucide-react";

const navigationItems = [
  { icon: BarChart3, label: "Επισκόπηση", path: "/dashboard" },
  { icon: Users, label: "Χρήστες", path: "/dashboard/users" },
  { icon: UserPlus, label: "Ομάδες", path: "/dashboard/groups" },
  { icon: Dumbbell, label: "Ασκήσεις", path: "/dashboard/exercises" },
  { icon: Activity, label: "Τεστ", path: "/dashboard/tests" },
  { icon: TrendingUp, label: "Αποτελέσματα", path: "/dashboard/results" },
  { icon: Calendar, label: "Προγράμματα", path: "/dashboard/programs" },
  { icon: CalendarCheck, label: "Ημερολόγιο", path: "/dashboard/active-programs" },
  { icon: CreditCard, label: "Cards", path: "/dashboard/program-cards" },
  { icon: Home, label: "Αρχική", path: "/" },
  { icon: Mail, label: "Email", path: "https://webmail.hyperkids.gr/", external: true },
];

export const MobileNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
      <div className="flex overflow-x-auto scrollbar-hide">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          if (item.external) {
            return (
              <a
                key={item.path}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center min-w-0 flex-1 py-3 px-2 text-xs font-medium transition-colors text-gray-600 hover:text-gray-900"
              >
                <item.icon className="h-6 w-6 text-gray-600" />
              </a>
            );
          }
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-0 flex-1 py-3 px-2 text-xs font-medium transition-colors ${
                isActive 
                  ? 'text-[#00ffba] bg-[#00ffba]/10' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <item.icon className={`h-6 w-6 ${isActive ? 'text-[#00ffba]' : 'text-gray-600'}`} />
            </Link>
          );
        })}
      </div>
    </div>
  );
};
