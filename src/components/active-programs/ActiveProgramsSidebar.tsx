
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CalendarCheck, 
  BarChart3, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard
} from "lucide-react";
import { ProgramCard } from "./ProgramCard";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ActiveProgramsSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  stats: {
    totalPrograms: number;
    activeToday: number;
    completedToday: number;
  };
  activePrograms: EnrichedAssignment[];
  onRefresh?: () => void;
  onDelete?: (assignmentId: string) => void;
}

export const ActiveProgramsSidebar = ({ 
  isCollapsed, 
  setIsCollapsed,
  stats,
  activePrograms,
  onRefresh,
  onDelete
}: ActiveProgramsSidebarProps) => {
  const [selectedMenuItem, setSelectedMenuItem] = useState("calendar");
  
  const menuItems = [
    { 
      icon: BarChart3, 
      label: "Επισκόπηση", 
      key: "overview",
      badge: null
    },
    { 
      icon: Calendar, 
      label: "Ημερολόγιο", 
      key: "calendar",
      badge: null
    },
    { 
      icon: CreditCard, 
      label: "Program Cards", 
      key: "program-cards",
      badge: stats.totalPrograms > 0 ? stats.totalPrograms : null
    },
  ];

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
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
            const isActive = selectedMenuItem === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setSelectedMenuItem(item.key)}
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

      {/* Content Based on Selected Menu Item */}
      {!isCollapsed && (
        <div className="flex-1 p-4 border-t border-gray-200">
          {selectedMenuItem === "program-cards" ? (
            <>
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
                Όλα τα Ενεργά Program Cards
              </h3>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {activePrograms.length > 0 ? (
                    activePrograms.map((assignment) => (
                      <div key={assignment.id} className="transform scale-90 origin-left">
                        <ProgramCard
                          assignment={assignment}
                          onRefresh={onRefresh}
                          onDelete={onDelete}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Δεν υπάρχουν ενεργά προγράμματα
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <>
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
                Σημερινή Επισκόπηση
              </h3>
              <div className="space-y-2">
                <div className="bg-gray-50 p-2 rounded-none">
                  <div className="font-semibold text-[#00ffba]">{stats.activeToday}</div>
                  <div className="text-gray-600 text-xs">Ενεργές σήμερα</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-none">
                  <div className="font-semibold text-green-600">{stats.completedToday}</div>
                  <div className="text-gray-600 text-xs">Ολοκληρωμένες</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-none">
                  <div className="font-semibold text-blue-600">{stats.totalPrograms}</div>
                  <div className="text-gray-600 text-xs">Σύνολο Προγραμμάτων</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
