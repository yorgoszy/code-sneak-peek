
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfilePrograms } from "./UserProfilePrograms";
import { UserProfileTests } from "./UserProfileTests";
import { UserProfilePayments } from "./UserProfilePayments";

interface UserProfileTabsProps {
  user: any;
  programs: any[];
  tests: any[];
  payments: any[];
}

export const UserProfileTabs = ({ user, programs, tests, payments }: UserProfileTabsProps) => {
  return (
    <Tabs defaultValue="programs" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="programs">Προγράμματα</TabsTrigger>
        <TabsTrigger value="tests">Τεστ</TabsTrigger>
        <TabsTrigger value="payments">Πληρωμές</TabsTrigger>
      </TabsList>
      
      <TabsContent value="programs" className="space-y-4">
        <UserProfilePrograms user={user} programs={programs} />
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
