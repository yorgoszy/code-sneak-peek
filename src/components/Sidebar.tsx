
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  UsersRound, 
  BookOpen, 
  ClipboardList, 
  Activity, 
  Dumbbell, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Users, label: "Users", path: "/dashboard/users" },
  { icon: UsersRound, label: "Groups", path: "/dashboard/groups" },
  { icon: BookOpen, label: "Programs", path: "/dashboard/programs" },
  { icon: ClipboardList, label: "Assignments", path: "/dashboard/assignments" },
  { icon: Activity, label: "Αξιολόγηση", path: "/dashboard/evaluation" },
  { icon: Activity, label: "Tests", path: "/dashboard/tests" },
  { icon: Dumbbell, label: "Exercises", path: "/dashboard/exercises" },
  { icon: BarChart3, label: "Results", path: "/dashboard/results" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const location = useLocation();

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 h-full transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header with Logo */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/66c3033a-1960-41a1-9e02-499d449e2dd7.png" 
            alt="Logo" 
            className={cn(
              "transition-all duration-300",
              isCollapsed ? "w-8 h-8" : "w-10 h-10 mr-3"
            )}
          />
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded hover:bg-gray-100"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 rounded text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};
