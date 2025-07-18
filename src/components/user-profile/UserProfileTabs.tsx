
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfileProgramCards } from "./UserProfileProgramCards";
import { UserProfileTests } from "./UserProfileTests";
import { UserProfilePayments } from "./UserProfilePayments";
import { UserProfileDailyProgram } from "./UserProfileDailyProgram";
import { UserProfileVisits } from "./UserProfileVisits";

interface UserProfileTabsProps {
  user: any;
  programs: any[];
  tests: any[];
  payments: any[];
  visits: any[];
}

export const UserProfileTabs = ({ user, programs, tests, payments, visits }: UserProfileTabsProps) => {
  return (
    <Tabs defaultValue="programs" className="w-full">
      <TabsList className="grid w-full grid-cols-5 rounded-none">
        <TabsTrigger value="programs" className="rounded-none">Ημερολόγιο</TabsTrigger>
        <TabsTrigger value="calendar" className="rounded-none">Προγράμματα</TabsTrigger>
        <TabsTrigger value="tests" className="rounded-none">Τεστ</TabsTrigger>
        <TabsTrigger value="payments" className="rounded-none">Πληρωμές</TabsTrigger>
        <TabsTrigger value="visits" className="rounded-none">Επισκέψεις</TabsTrigger>
      </TabsList>
      
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
        <UserProfilePayments payments={payments} />
      </TabsContent>

      <TabsContent value="visits" className="space-y-4">
        <UserProfileVisits visits={visits} user={user} />
      </TabsContent>
    </Tabs>
  );
};
