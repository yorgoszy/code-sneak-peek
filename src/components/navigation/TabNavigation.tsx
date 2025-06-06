
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Dumbbell, 
  Activity, 
  TrendingUp, 
  Calendar,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { icon: Users, label: "Χρήστες", path: "/dashboard/users" },
  { icon: UserPlus, label: "Ομάδες", path: "/dashboard/groups" },
  { icon: Dumbbell, label: "Ασκήσεις", path: "/dashboard/exercises" },
  { icon: Activity, label: "Τεστ", path: "/dashboard/tests" },
  { icon: TrendingUp, label: "Αποτελέσματα", path: "/dashboard/results" },
  { icon: Calendar, label: "Προγράμματα", path: "/dashboard/programs" },
];

interface TabNavigationProps {
  onSignOut?: () => void;
  userProfile?: any;
  user?: any;
  isAdmin?: boolean;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  onSignOut,
  userProfile,
  user,
  isAdmin
}) => {
  const location = useLocation();

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-none flex items-center justify-center overflow-hidden">
              <img 
                src="/lovable-uploads/a9d8f326-52a1-4283-965a-c73fed3f73ec.png" 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Διαχείριση Συστήματος
              </h2>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {userProfile?.name || user?.email}
              {isAdmin && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
            </span>
            {onSignOut && (
              <Button 
                variant="outline" 
                className="rounded-none"
                onClick={onSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Αποσύνδεση
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-6">
        <div className="flex space-x-1 overflow-x-auto">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'text-[#00ffba] border-[#00ffba] bg-[#00ffba]/5' 
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
