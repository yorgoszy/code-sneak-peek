import { Activity, Clock, Dumbbell, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

interface WorkoutStatsCardsProps {
  stats: {
    currentMonth: {
      completedWorkouts: number;
      totalTrainingHours: number;
      totalVolume: number;
      missedWorkouts: number;
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

  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}tn`;
    }
    return `${volume}kg`;
  };

  const formatVolumeImprovement = (volume: number) => {
    if (Math.abs(volume) >= 1000) {
      return `${(volume / 1000).toFixed(1)}tn`;
    }
    return `${volume}kg`;
  };

  return (
    <div className="grid grid-cols-2 gap-2 md:gap-3">
      {/* Προπονήσεις αυτόν τον μήνα */}
      <div className="bg-white p-2 md:p-3 border rounded-none flex flex-col h-20 md:h-24">
        <h4 className="text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <Activity className="h-3 w-3 text-blue-600" />
            <span>Προπονήσεις</span>
          </span>
          <div className="scale-75">
            {getTrendIcon(stats.improvements.workoutsImprovement)}
          </div>
        </h4>
        <div className="flex-1 flex flex-col justify-end">
          <div className="text-sm md:text-base font-semibold text-blue-600">{stats.currentMonth.completedWorkouts}</div>
          <div className={`text-xs ${getTrendColor(stats.improvements.workoutsImprovement)}`}>
            {stats.improvements.workoutsImprovement > 0 ? '+' : ''}{stats.improvements.workoutsImprovement} μήνα
          </div>
        </div>
      </div>

      {/* Ώρες προπονήσεων */}
      <div className="bg-white p-2 md:p-3 border rounded-none flex flex-col h-20 md:h-24">
        <h4 className="text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-green-600" />
            <span>Ώρες</span>
          </span>
          <div className="scale-75">
            {getTrendIcon(stats.improvements.hoursImprovement)}
          </div>
        </h4>
        <div className="flex-1 flex flex-col justify-end">
          <div className="text-sm md:text-base font-semibold text-green-600">{stats.currentMonth.totalTrainingHours}h</div>
          <div className={`text-xs ${getTrendColor(stats.improvements.hoursImprovement)}`}>
            {stats.improvements.hoursImprovement > 0 ? '+' : ''}{stats.improvements.hoursImprovement}h μήνα
          </div>
        </div>
      </div>

      {/* Όγκος προπονήσεων */}
      <div className="bg-white p-2 md:p-3 border rounded-none flex flex-col h-20 md:h-24">
        <h4 className="text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <Dumbbell className="h-3 w-3 text-purple-600" />
            <span>Όγκος</span>
          </span>
          <div className="scale-75">
            {getTrendIcon(stats.improvements.volumeImprovement)}
          </div>
        </h4>
        <div className="flex-1 flex flex-col justify-end">
          <div className="text-sm md:text-base font-semibold text-purple-600">{formatVolume(stats.currentMonth.totalVolume)}</div>
          <div className={`text-xs ${getTrendColor(stats.improvements.volumeImprovement)}`}>
            {stats.improvements.volumeImprovement > 0 ? '+' : ''}{formatVolumeImprovement(stats.improvements.volumeImprovement)} μήνα
          </div>
        </div>
      </div>

      {/* Χαμένες προπονήσεις */}
      <div className="bg-white p-2 md:p-3 border rounded-none flex flex-col h-20 md:h-24">
        <h4 className="text-xs font-medium text-gray-700 mb-1">
          <span className="flex items-center space-x-1">
            <AlertTriangle className="h-3 w-3 text-orange-600" />
            <span>Χαμένες</span>
          </span>
        </h4>
        <div className="flex-1 flex flex-col justify-end">
          <div className="text-sm md:text-base font-semibold text-orange-600">{stats.currentMonth.missedWorkouts}</div>
          <div className="text-xs text-gray-500">
            Μήνα
          </div>
        </div>
      </div>
    </div>
  );
};