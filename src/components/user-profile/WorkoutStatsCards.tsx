
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
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
      <Card className="rounded-none">
        <CardHeader className="pb-1 md:pb-2">
          <CardTitle className="flex items-center justify-between text-xs font-medium">
            <span className="flex items-center space-x-1">
              <Activity className="h-3 w-3 text-blue-600" />
              <span className="text-xs">Προπονήσεις</span>
            </span>
            <div className="scale-75">
              {getTrendIcon(stats.improvements.workoutsImprovement)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2 md:pb-3">
          <div className="text-lg md:text-xl font-bold">{stats.currentMonth.completedWorkouts}</div>
          <div className={`text-xs ${getTrendColor(stats.improvements.workoutsImprovement)}`}>
            {stats.improvements.workoutsImprovement > 0 ? '+' : ''}{stats.improvements.workoutsImprovement} μήνα
          </div>
        </CardContent>
      </Card>

      {/* Ώρες προπονήσεων */}
      <Card className="rounded-none">
        <CardHeader className="pb-1 md:pb-2">
          <CardTitle className="flex items-center justify-between text-xs font-medium">
            <span className="flex items-center space-x-1">
              <Clock className="h-3 w-3 text-green-600" />
              <span className="text-xs">Ώρες</span>
            </span>
            <div className="scale-75">
              {getTrendIcon(stats.improvements.hoursImprovement)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2 md:pb-3">
          <div className="text-lg md:text-xl font-bold">{stats.currentMonth.totalTrainingHours}h</div>
          <div className={`text-xs ${getTrendColor(stats.improvements.hoursImprovement)}`}>
            {stats.improvements.hoursImprovement > 0 ? '+' : ''}{stats.improvements.hoursImprovement}h μήνα
          </div>
        </CardContent>
      </Card>

      {/* Όγκος προπονήσεων */}
      <Card className="rounded-none">
        <CardHeader className="pb-1 md:pb-2">
          <CardTitle className="flex items-center justify-between text-xs font-medium">
            <span className="flex items-center space-x-1">
              <Dumbbell className="h-3 w-3 text-purple-600" />
              <span className="text-xs">Όγκος</span>
            </span>
            <div className="scale-75">
              {getTrendIcon(stats.improvements.volumeImprovement)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2 md:pb-3">
          <div className="text-lg md:text-xl font-bold">{formatVolume(stats.currentMonth.totalVolume)}</div>
          <div className={`text-xs ${getTrendColor(stats.improvements.volumeImprovement)}`}>
            {stats.improvements.volumeImprovement > 0 ? '+' : ''}{formatVolumeImprovement(stats.improvements.volumeImprovement)} μήνα
          </div>
        </CardContent>
      </Card>

      {/* Χαμένες προπονήσεις */}
      <Card className="rounded-none">
        <CardHeader className="pb-1 md:pb-2">
          <CardTitle className="flex items-center justify-between text-xs font-medium">
            <span className="flex items-center space-x-1">
              <AlertTriangle className="h-3 w-3 text-orange-600" />
              <span className="text-xs">Χαμένες</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2 md:pb-3">
          <div className="text-lg md:text-xl font-bold text-orange-600">{stats.currentMonth.missedWorkouts}</div>
          <div className="text-xs text-gray-600">
            Μήνα
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
