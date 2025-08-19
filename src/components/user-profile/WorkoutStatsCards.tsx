
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {/* Προπονήσεις αυτόν τον μήνα */}
      <Card className="rounded-none">
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="flex items-center justify-between text-xs md:text-sm font-medium">
            <span className="flex items-center space-x-1 md:space-x-2">
              <Activity className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
              <span className="text-xs md:text-sm">Προπονήσεις Μήνα</span>
            </span>
            <div className="scale-75 md:scale-100">
              {getTrendIcon(stats.improvements.workoutsImprovement)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xl md:text-2xl font-bold">{stats.currentMonth.completedWorkouts}</div>
          <div className={`text-xs ${getTrendColor(stats.improvements.workoutsImprovement)}`}>
            {stats.improvements.workoutsImprovement > 0 ? '+' : ''}{stats.improvements.workoutsImprovement} από προηγ. μήνα
          </div>
        </CardContent>
      </Card>

      {/* Ώρες προπονήσεων */}
      <Card className="rounded-none">
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="flex items-center justify-between text-xs md:text-sm font-medium">
            <span className="flex items-center space-x-1 md:space-x-2">
              <Clock className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
              <span className="text-xs md:text-sm">Ώρες Προπόνησης</span>
            </span>
            <div className="scale-75 md:scale-100">
              {getTrendIcon(stats.improvements.hoursImprovement)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xl md:text-2xl font-bold">{stats.currentMonth.totalTrainingHours}h</div>
          <div className={`text-xs ${getTrendColor(stats.improvements.hoursImprovement)}`}>
            {stats.improvements.hoursImprovement > 0 ? '+' : ''}{stats.improvements.hoursImprovement}h από προηγ. μήνα
          </div>
        </CardContent>
      </Card>

      {/* Όγκος προπονήσεων */}
      <Card className="rounded-none">
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="flex items-center justify-between text-xs md:text-sm font-medium">
            <span className="flex items-center space-x-1 md:space-x-2">
              <Dumbbell className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
              <span className="text-xs md:text-sm">Όγκος Προπόνησης</span>
            </span>
            <div className="scale-75 md:scale-100">
              {getTrendIcon(stats.improvements.volumeImprovement)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xl md:text-2xl font-bold">{formatVolume(stats.currentMonth.totalVolume)}</div>
          <div className={`text-xs ${getTrendColor(stats.improvements.volumeImprovement)}`}>
            {stats.improvements.volumeImprovement > 0 ? '+' : ''}{formatVolumeImprovement(stats.improvements.volumeImprovement)} από προηγ. μήνα
          </div>
        </CardContent>
      </Card>

      {/* Χαμένες προπονήσεις */}
      <Card className="rounded-none">
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="flex items-center justify-between text-xs md:text-sm font-medium">
            <span className="flex items-center space-x-1 md:space-x-2">
              <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
              <span className="text-xs md:text-sm">Χαμένες Προπονήσεις</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xl md:text-2xl font-bold text-orange-600">{stats.currentMonth.missedWorkouts}</div>
          <div className="text-xs text-gray-600">
            Αυτόν τον μήνα
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
