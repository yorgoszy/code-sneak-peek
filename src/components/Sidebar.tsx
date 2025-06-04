
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  UserPlus, 
  Activity, 
  Dumbbell, 
  TrendingUp, 
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Play,
  Home,
  Mail,
  MonitorPlay
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const location = useLocation();

  const menuItems = [
    { icon: BarChart3, label: "Επισκόπηση", path: "/dashboard" },
    { icon: Users, label: "Χρήστες", path: "/dashboard/users" },
    { icon: UserPlus, label: "Ομάδες", path: "/dashboard/groups" },
    { icon: Dumbbell, label: "Ασκήσεις", path: "/dashboard/exercises" },
    { icon: Activity, label: "Τεστ", path: "/dashboard/tests" },
    { icon: TrendingUp, label: "Αποτελέσματα", path: "/dashboard/results" },
    { icon: Calendar, label: "Προγράμματα", path: "/dashboard/programs" },
    { icon: Play, label: "Ενεργά Προγράμματα", path: "/dashboard/active-programs" },
    { icon: MonitorPlay, label: "Run Mode", path: "/dashboard/run-mode" },
  ];

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-800">HyperKids</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-none"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 ${
                  isActive ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700'
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto p-4 border-t border-gray-200">
        <div className="space-y-2">
          {/* Return Home Button */}
          <Link
            to="/"
            className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            <Home className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Επιστροφή στην Αρχική</span>}
          </Link>

          {/* Webmail Link */}
          <a
            href="https://webmail.hyperkids.gr/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            <Mail className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Webmail</span>}
          </a>
        </div>
      </div>
    </div>
  );
};
