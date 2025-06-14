
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, UserPlus } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    activePrograms: number;
  };
}

export const DashboardStats = ({ stats }: DashboardStatsProps) => {
  const statCards = [
    {
      title: "Συνολικοί Χρήστες",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Ενεργοί Χρήστες",
      subtitle: "Τελευταίες 30 ημέρες",
      value: stats.activeUsers,
      icon: Activity,
      color: "text-[#00ffba]"
    },
    {
      title: "Νέοι Χρήστες",
      subtitle: "Αυτόν τον μήνα",
      value: stats.newUsersThisMonth,
      icon: UserPlus,
      color: "text-green-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-2 sm:mb-6 w-full max-w-full">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="rounded-none w-full max-w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-2 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium">{stat.title}</CardTitle>
              <IconComponent className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              <div className="text-lg sm:text-2xl font-bold">{stat.value}</div>
              {stat.subtitle && (
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
