
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, UserPlus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardStatsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    activePrograms: number;
  };
}

export const DashboardStats = ({ stats }: DashboardStatsProps) => {
  const isMobile = useIsMobile();
  
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
    <div className={`grid gap-4 md:gap-6 mb-4 md:mb-6 ${
      isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }`}>
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="rounded-none">
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'pb-1' : 'pb-2'}`}>
              <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>{stat.title}</CardTitle>
              <IconComponent className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${stat.color}`} />
            </CardHeader>
            <CardContent className={isMobile ? 'pt-1' : ''}>
              <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{stat.value}</div>
              {stat.subtitle && (
                <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 mt-1`}>{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
