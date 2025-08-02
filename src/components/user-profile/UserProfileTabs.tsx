
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfileProgramCards } from "./UserProfileProgramCards";
import { UserProfileTests } from "./UserProfileTests";
import { UserProfilePayments } from "./UserProfilePayments";
import { UserProfileDailyProgram } from "./UserProfileDailyProgram";
import { UserProfileVisits } from "./UserProfileVisits";
import { UserProfileStats } from "./UserProfileStats";

interface UserProfileTabsProps {
  user: any;
  programs: any[];
  tests: any[];
  payments: any[];
  visits: any[];
  stats: {
    athletesCount: number;
    programsCount: number;
    testsCount: number;
    paymentsCount: number;
  };
}

export const UserProfileTabs = ({ user, programs, tests, payments, visits, stats }: UserProfileTabsProps) => {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-6 rounded-none">
        <TabsTrigger value="overview" className="rounded-none">Επισκόπηση</TabsTrigger>
        <TabsTrigger value="programs" className="rounded-none">Ημερολόγιο</TabsTrigger>
        <TabsTrigger value="calendar" className="rounded-none">Προγράμματα</TabsTrigger>
        <TabsTrigger value="tests" className="rounded-none">Τεστ</TabsTrigger>
        <TabsTrigger value="payments" className="rounded-none">Πληρωμές</TabsTrigger>
        <TabsTrigger value="visits" className="rounded-none">Επισκέψεις</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        <UserProfileStats user={user} stats={stats} />
      </TabsContent>

      <TabsContent value="programs" className="space-y-4">
        <UserProfileDailyProgram userProfile={user} />
      </TabsContent>

      <TabsContent value="calendar" className="space-y-4">
        <UserProfileProgramCards userProfile={user} />
      </TabsContent>

      <TabsContent value="tests" className="space-y-4">
        <UserProfileTests tests={tests} />
      </TabsContent>

      <TabsContent value="payments" className="space-y-4">
        <UserProfilePayments payments={payments} userProfile={user} />
      </TabsContent>

      <TabsContent value="visits" className="space-y-4">
        <UserProfileVisits visits={visits} user={user} />
      </TabsContent>
    </Tabs>
  );
};
