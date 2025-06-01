
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
  Play
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
  ];

  return (
    <div className={`transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`} style={{ backgroundColor: '#5271ff' }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <img 
              src="/lovable-uploads/14dbca9e-de35-46e9-b834-a6dcac95f92a.png" 
              alt="Logo" 
              className="h-8 w-auto"
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white hover:bg-white/10"
            style={{ borderRadius: '0' }}
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
                className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10 text-white ${
                  isActive ? 'bg-white/20 border-r-2 border-white' : ''
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
