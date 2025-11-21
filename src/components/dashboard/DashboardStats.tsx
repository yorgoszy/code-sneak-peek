
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
      subtitle: "Αυτόν τον μήνα",
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
    <div className="grid grid-cols-3 gap-2 md:gap-6 mb-4 md:mb-6">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="rounded-none">
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'pb-1 px-2 pt-2' : 'pb-2'}`}>
              <CardTitle className={`${isMobile ? 'text-[10px]' : 'text-sm'} font-medium leading-tight`}>
                {stat.title}
              </CardTitle>
              <IconComponent className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${stat.color} flex-shrink-0`} />
            </CardHeader>
            <CardContent className={`${isMobile ? 'pt-0 px-2 pb-2' : ''}`}>
              <div className={`${isMobile ? 'text-base' : 'text-2xl'} font-bold`}>{stat.value}</div>
              {stat.subtitle && !isMobile && (
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
