
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Προπονήσεις αυτόν τον μήνα */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span>Προπονήσεις Μήνα</span>
            </span>
            {getTrendIcon(stats.improvements.workoutsImprovement)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold">{stats.currentMonth.completedWorkouts}</div>
          <div className={`text-xs ${getTrendColor(stats.improvements.workoutsImprovement)}`}>
            {stats.improvements.workoutsImprovement > 0 ? '+' : ''}{stats.improvements.workoutsImprovement} από προηγ. μήνα
          </div>
        </CardContent>
      </Card>

      {/* Ώρες προπονήσεων */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span>Ώρες Προπόνησης</span>
            </span>
            {getTrendIcon(stats.improvements.hoursImprovement)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold">{stats.currentMonth.totalTrainingHours}h</div>
          <div className={`text-xs ${getTrendColor(stats.improvements.hoursImprovement)}`}>
            {stats.improvements.hoursImprovement > 0 ? '+' : ''}{stats.improvements.hoursImprovement}h από προηγ. μήνα
          </div>
        </CardContent>
      </Card>

      {/* Όγκος προπονήσεων */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center space-x-2">
              <Dumbbell className="h-4 w-4 text-purple-600" />
              <span>Όγκος Προπόνησης</span>
            </span>
            {getTrendIcon(stats.improvements.volumeImprovement)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold">{formatVolume(stats.currentMonth.totalVolume)}</div>
          <div className={`text-xs ${getTrendColor(stats.improvements.volumeImprovement)}`}>
            {stats.improvements.volumeImprovement > 0 ? '+' : ''}{formatVolumeImprovement(stats.improvements.volumeImprovement)} από προηγ. μήνα
          </div>
        </CardContent>
      </Card>

      {/* Χαμένες προπονήσεις */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span>Χαμένες Προπονήσεις</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold text-orange-600">{stats.currentMonth.missedWorkouts}</div>
          <div className="text-xs text-gray-600">
            Αυτόν τον μήνα
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
