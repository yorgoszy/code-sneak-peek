
import { useState } from "react";
import { 
  CalendarCheck, 
  BarChart3, 
  Calendar
} from "lucide-react";
import { BaseSidebar } from "@/components/sidebar/BaseSidebar";
import { RunningWorkouts } from "@/components/sidebar/RunningWorkouts";
import { MinimizedWorkout } from "@/components/sidebar/MinimizedWorkout";
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
  minimizedWorkout?: {
    assignment: EnrichedAssignment;
    elapsedTime: number;
  } | null;
  onRestoreWorkout?: () => void;
  onCancelMinimizedWorkout?: () => void;
}

export const ActiveProgramsSidebar = ({ 
  isCollapsed, 
  setIsCollapsed,
  stats,
  activePrograms,
  onRefresh,
  onDelete,
  minimizedWorkout,
  onRestoreWorkout,
  onCancelMinimizedWorkout
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

  const headerContent = (
    <div>
      <h2 className="text-sm font-semibold text-gray-800">
        Ενεργά Προγράμματα
      </h2>
      <p className="text-xs text-gray-500">Διαχείριση προπονήσεων</p>
    </div>
  );

  const navigationContent = (
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
  );

  const bottomContent = (
    <div className="space-y-4">
      {/* Minimized Workout */}
      {minimizedWorkout && !isCollapsed && (
        <div>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Ελαχιστοποιημένη Προπόνηση
          </h3>
          <MinimizedWorkout
            assignment={minimizedWorkout.assignment}
            elapsedTime={minimizedWorkout.elapsedTime}
            onRestore={onRestoreWorkout || (() => {})}
            onCancel={onCancelMinimizedWorkout || (() => {})}
          />
        </div>
      )}

      {/* Stats */}
      {!isCollapsed && (
        <div>
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
        </div>
      )}

      {/* Running Workouts */}
      <RunningWorkouts
        runningWorkouts={runningWorkouts}
        onCompleteWorkout={completeWorkout}
        onCancelWorkout={cancelWorkout}
        formatTime={formatTime}
        isCollapsed={isCollapsed}
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
