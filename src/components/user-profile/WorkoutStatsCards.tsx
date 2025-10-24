import { Activity, Clock, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

interface WorkoutStatsCardsProps {
  stats: {
    currentMonth: {
      completedWorkouts: number;
      totalTrainingHours: number;
      totalVolume: number;
      missedWorkouts: number;
      scheduledWorkouts?: number;
    };
    improvements: {
      workoutsImprovement: number;
      hoursImprovement: number;
      volumeImprovement: number;
    };
  };
}

export const WorkoutStatsCards = ({ stats }: WorkoutStatsCardsProps) => {
  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-gray-600" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Ημέρες προπονήσεων αυτόν τον μήνα */}
      <div className="bg-white p-2 border rounded-none flex flex-col h-16 md:h-20">
        <h4 className="text-[10px] md:text-xs font-medium text-gray-700 mb-1 flex items-center space-x-1">
          <Activity className="h-3 w-3 text-blue-600" />
          <span>Προπονήσεις</span>
        </h4>
        <div className="flex-1 flex flex-col justify-end">
          <div className="text-sm md:text-base font-semibold text-blue-600">
            {stats.currentMonth.completedWorkouts}/{stats.currentMonth.scheduledWorkouts || 0}
          </div>
          <div className="text-[10px] text-gray-500">
            Ολοκληρωμένες
          </div>
        </div>
      </div>

      {/* Ώρες ολοκληρωμένων προπονήσεων */}
      <div className="bg-white p-2 border rounded-none flex flex-col h-16 md:h-20">
        <h4 className="text-[10px] md:text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-green-600" />
            <span>Ώρες</span>
          </span>
          <div className="scale-75">
            {getTrendIcon(stats.improvements.hoursImprovement)}
          </div>
        </h4>
        <div className="flex-1 flex flex-col justify-end">
          <div className="text-sm md:text-base font-semibold text-green-600">
            {stats.currentMonth.totalTrainingHours}h
          </div>
          <div className={`text-[10px] ${getTrendColor(stats.improvements.hoursImprovement)}`}>
            {stats.improvements.hoursImprovement > 0 ? '+' : ''}{stats.improvements.hoursImprovement}h μήνα
          </div>
        </div>
      </div>

      {/* Χαμένες προπονήσεις */}
      <div className="bg-white p-2 border rounded-none flex flex-col h-16 md:h-20">
        <h4 className="text-[10px] md:text-xs font-medium text-gray-700 mb-1">
          <span className="flex items-center space-x-1">
            <AlertTriangle className="h-3 w-3 text-orange-600" />
            <span>Χαμένες</span>
          </span>
        </h4>
        <div className="flex-1 flex flex-col justify-end">
          <div className="text-sm md:text-base font-semibold text-orange-600">{stats.currentMonth.missedWorkouts}</div>
          <div className="text-[10px] text-gray-500">
            Μήνα
          </div>
        </div>
      </div>
    </div>
  );
};