
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
      <TabsList className="w-full flex flex-wrap md:grid md:grid-cols-5 rounded-none gap-1 p-1 h-auto">
        <TabsTrigger value="programs" className="rounded-none text-xs flex-1 min-w-0 md:min-w-full">Ημερολόγιο</TabsTrigger>
        <TabsTrigger value="calendar" className="rounded-none text-xs flex-1 min-w-0 md:min-w-full">Προγράμματα</TabsTrigger>
        <TabsTrigger value="tests" className="rounded-none text-xs flex-1 min-w-0 md:min-w-full">Τεστ</TabsTrigger>
        <TabsTrigger value="payments" className="rounded-none text-xs flex-1 min-w-0 md:min-w-full">Πληρωμές</TabsTrigger>
        <TabsTrigger value="visits" className="rounded-none text-xs flex-1 min-w-0 md:min-w-full">Επισκέψεις</TabsTrigger>
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
        <UserProfilePayments payments={payments} userProfile={user} />
      </TabsContent>

      <TabsContent value="visits" className="space-y-4">
        <UserProfileVisits visits={visits} user={user} />
      </TabsContent>
    </Tabs>
  );
};
