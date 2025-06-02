
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfilePrograms } from "./UserProfilePrograms";
import { UserProfileTests } from "./UserProfileTests";
import { UserProfilePayments } from "./UserProfilePayments";
import { UserProfileCalendar } from "./UserProfileCalendar";

interface UserProfileTabsProps {
  user: any;
  programs: any[];
  tests: any[];
  payments: any[];
}

export const UserProfileTabs = ({ user, programs, tests, payments }: UserProfileTabsProps) => {
  return (
    <Tabs defaultValue="programs" className="w-full">
      <TabsList className="grid w-full grid-cols-4 rounded-none">
        <TabsTrigger value="programs" className="rounded-none">Προγράμματα</TabsTrigger>
        <TabsTrigger value="calendar" className="rounded-none">Ημερολόγιο</TabsTrigger>
        <TabsTrigger value="tests" className="rounded-none">Τεστ</TabsTrigger>
        <TabsTrigger value="payments" className="rounded-none">Πληρωμές</TabsTrigger>
      </TabsList>
      
      <TabsContent value="programs" className="space-y-4">
        <UserProfilePrograms user={user} programs={programs} />
      </TabsContent>

      <TabsContent value="calendar" className="space-y-4">
        <UserProfileCalendar user={user} />
      </TabsContent>

      <TabsContent value="tests" className="space-y-4">
        <UserProfileTests tests={tests} />
      </TabsContent>

      <TabsContent value="payments" className="space-y-4">
        <UserProfilePayments payments={payments} />
      </TabsContent>
    </Tabs>
  );
};
