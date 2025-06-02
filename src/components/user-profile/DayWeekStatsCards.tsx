
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Dumbbell, TrendingUp } from "lucide-react";

interface DayWeekStatsCardsProps {
  stats: {
    currentDay: {
      volume: number;
      hours: number;
    };
    currentWeek: {
      volume: number;
      hours: number;
    };
  };
}

export const DayWeekStatsCards = ({ stats }: DayWeekStatsCardsProps) => {
  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}tn`;
    }
    return `${volume}kg`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Όγκος σήμερα */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center space-x-2">
              <Dumbbell className="h-4 w-4 text-blue-600" />
              <span>Όγκος Σήμερα</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold">{formatVolume(stats.currentDay.volume)}</div>
          <div className="text-xs text-gray-600">
            Σημερινή προπόνηση
          </div>
        </CardContent>
      </Card>

      {/* Ώρες σήμερα */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span>Ώρες Σήμερα</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold">{stats.currentDay.hours}h</div>
          <div className="text-xs text-gray-600">
            Σημερινή προπόνηση
          </div>
        </CardContent>
      </Card>

      {/* Όγκος εβδομάδας */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span>Όγκος Εβδομάδας</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold">{formatVolume(stats.currentWeek.volume)}</div>
          <div className="text-xs text-gray-600">
            Αυτή την εβδομάδα
          </div>
        </CardContent>
      </Card>

      {/* Ώρες εβδομάδας */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span>Ώρες Εβδομάδας</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold">{stats.currentWeek.hours}h</div>
          <div className="text-xs text-gray-600">
            Αυτή την εβδομάδα
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
