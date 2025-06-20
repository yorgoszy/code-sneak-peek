
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { SubscriptionManagement } from "@/components/subscriptions/SubscriptionManagement";
import { SubscriptionTypeManager } from "@/components/subscriptions/SubscriptionTypeManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Subscriptions() {
  return (
    <DashboardContainer>
      <div className="p-6">
        <Tabs defaultValue="management" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 rounded-none">
            <TabsTrigger value="management" className="rounded-none">Διαχείριση Συνδρομών</TabsTrigger>
            <TabsTrigger value="types" className="rounded-none">Τύποι Συνδρομών</TabsTrigger>
          </TabsList>
          
          <TabsContent value="management">
            <SubscriptionManagement />
          </TabsContent>
          
          <TabsContent value="types">
            <SubscriptionTypeManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardContainer>
  );
}
