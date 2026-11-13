
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, UserPlus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DashboardUsersDialog, DashboardUsersDialogType } from "./DashboardUsersDialog";

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
  const [dialogType, setDialogType] = useState<DashboardUsersDialogType | null>(null);
  
  const statCards: Array<{
    title: string;
    subtitle?: string;
    value: number;
    icon: typeof Users;
    color: string;
    dialogType?: DashboardUsersDialogType;
  }> = [
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
      color: "text-[#00ffba]",
      dialogType: "active"
    },
    {
      title: "Νέοι Χρήστες",
      subtitle: "Αυτόν τον μήνα",
      value: stats.newUsersThisMonth,
      icon: UserPlus,
      color: "text-green-600",
      dialogType: "new"
    }
  ];

  return (
    <>
      <div className="grid grid-cols-3 gap-2 md:gap-6 mb-4 md:mb-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card
              key={index}
              className={`rounded-none ${stat.dialogType ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
              onClick={stat.dialogType ? () => setDialogType(stat.dialogType!) : undefined}
            >
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

      <DashboardUsersDialog type={dialogType} onClose={() => setDialogType(null)} />
    </>
  );
};
