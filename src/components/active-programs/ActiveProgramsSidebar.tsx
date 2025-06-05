
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  CalendarCheck, 
  BarChart3, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users
} from "lucide-react";

interface ActiveProgramsSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  stats: {
    totalPrograms: number;
    activeToday: number;
    completedToday: number;
  };
}

export const ActiveProgramsSidebar = ({ 
  isCollapsed, 
  setIsCollapsed,
  stats
}: ActiveProgramsSidebarProps) => {
  
  const menuItems = [
    { 
      icon: BarChart3, 
      label: "Επισκόπηση", 
      key: "overview",
      badge: null
    },
    { 
      icon: CalendarCheck, 
      label: "Ενεργά Προγράμματα", 
      key: "programs",
      badge: stats.totalPrograms > 0 ? stats.totalPrograms : null
    },
    { 
      icon: Calendar, 
      label: "Ημερολόγιο", 
      key: "calendar",
      badge: null
    },
    { 
      icon: Users, 
      label: "Αθλητές", 
      key: "athletes",
      badge: null
    },
  ];

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#00ffba] rounded-none flex items-center justify-center">
                <CalendarCheck className="h-5 w-5 text-black" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-800">
                  Ενεργά Προγράμματα
                </h2>
                <p className="text-xs text-gray-500">Διαχείριση προπονήσεων</p>
              </div>
            </div>
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
            const isActive = item.key === "programs";
            return (
              <button
                key={item.key}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 rounded-none ${
                  isActive ? 'bg-[#00ffba]/10 text-[#00ffba] border-r-2 border-[#00ffba]' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Stats Summary (when not collapsed) */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Σημερινή Επισκόπηση
            </h3>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded-none">
                <div className="font-semibold text-[#00ffba]">{stats.activeToday}</div>
                <div className="text-gray-600">Ενεργές σήμερα</div>
              </div>
              <div className="bg-gray-50 p-2 rounded-none">
                <div className="font-semibold text-green-600">{stats.completedToday}</div>
                <div className="text-gray-600">Ολοκληρωμένες</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
