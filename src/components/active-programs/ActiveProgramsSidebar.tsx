
import { useState } from "react";
import { 
  CalendarCheck, 
  BarChart3, 
  Calendar
} from "lucide-react";
import { BaseSidebar } from "@/components/sidebar/BaseSidebar";
import { RunningWorkouts } from "@/components/sidebar/RunningWorkouts";
import { useRunningWorkouts } from "@/hooks/useRunningWorkouts";
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
  const { runningWorkouts, completeWorkout, cancelWorkout, formatTime } = useRunningWorkouts();
  
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
  ];

  const headerContent = null;

  const navigationContent = (
    <div className="space-y-1">
      {menuItems.map((item) => {
        const isActive = selectedMenuItem === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setSelectedMenuItem(item.key)}
            className={`w-full flex items-center justify-center p-3 text-sm font-medium transition-colors hover:bg-gray-100 rounded-none ${
              isActive ? 'bg-[#00ffba]/10 text-[#00ffba] border-r-2 border-[#00ffba]' : 'text-gray-700'
            }`}
            title={item.label}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {item.badge && (
              <span className="absolute -top-1 -right-1 bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const bottomContent = (
    <div className="space-y-2">
      {/* Stats - Compact */}
      <div className="grid grid-cols-1 gap-1 text-xs">
        <div className="bg-gray-50 p-1.5 rounded-none text-center">
          <div className="font-semibold text-[#00ffba]">{stats.activeToday}</div>
          <div className="text-gray-600 text-xs">Act</div>
        </div>
        <div className="bg-gray-50 p-1.5 rounded-none text-center">
          <div className="font-semibold text-green-600">{stats.completedToday}</div>
          <div className="text-gray-600 text-xs">Com</div>
        </div>
        <div className="bg-gray-50 p-1.5 rounded-none text-center">
          <div className="font-semibold text-blue-600">{stats.totalPrograms}</div>
          <div className="text-gray-600 text-xs">Tot</div>
        </div>
      </div>

      {/* Running Workouts */}
      <RunningWorkouts
        runningWorkouts={runningWorkouts}
        onCompleteWorkout={completeWorkout}
        onCancelWorkout={cancelWorkout}
        formatTime={formatTime}
        isCollapsed={true}
      />
    </div>
  );

  return (
    <BaseSidebar
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      headerContent={headerContent}
      navigationContent={navigationContent}
      bottomContent={bottomContent}
    />
  );
};
