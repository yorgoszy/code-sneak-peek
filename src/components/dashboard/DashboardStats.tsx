
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Dumbbell } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    totalUsers: number;
    activePrograms: number;
    totalExercises: number;
    newUsersThisMonth: number;
  };
}

export const DashboardStats = ({ stats }: DashboardStatsProps) => {
  // Μόνο τα βασικά stats για ταχύτητα
  const statCards = [
    {
      title: "Συνολικοί Χρήστες",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Συνολικές Ασκήσεις",
      value: stats.totalExercises,
      icon: Dumbbell,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="rounded-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <IconComponent className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
