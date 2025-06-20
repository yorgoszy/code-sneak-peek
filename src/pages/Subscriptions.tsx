
import { SubscriptionManagement } from "@/components/subscriptions/SubscriptionManagement";
import { SubscriptionTypeManager } from "@/components/subscriptions/SubscriptionTypeManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";

export default function Subscriptions() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Διαχείριση Συνδρομών</h1>
          <p className="text-gray-600">Διαχειριστείτε τις συνδρομές και τους τύπους συνδρομών</p>
        </div>
        
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
    </div>
  );
}
