import { SubscriptionManagement } from "@/components/subscriptions/SubscriptionManagement";
import { MyDataSettings } from "@/components/admin/MyDataSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function SubscriptionsWidget() {
  return (
    <div className="min-h-screen bg-gray-50 w-full p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Διαχείριση Συνδρομών</h1>
        <p className="text-gray-600">Συνδρομές και MyData</p>
      </div>
    
      <Tabs defaultValue="management" className="w-full">
        <TabsList className="flex w-full justify-start mb-6 rounded-none h-auto gap-2">
          <TabsTrigger value="management" className="rounded-none whitespace-nowrap">
            Συνδρομές
          </TabsTrigger>
          <div className="flex items-center gap-2">
            <TabsTrigger value="mydata" className="rounded-none whitespace-nowrap">
              MyData AADE
            </TabsTrigger>
            <Button
              onClick={() => {
                const subscriptionKey = '6a1bc2b0ad328f1971a203175834caa4';
                navigator.clipboard.writeText(subscriptionKey);
                window.open('https://mydata.aade.gr/timologio/Account/Login?culture=el-GR', '_blank');
              }}
              variant="outline"
              size="sm"
              className="rounded-none whitespace-nowrap"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              E-timologio
            </Button>
          </div>
        </TabsList>
        
        <TabsContent value="management">
          <SubscriptionManagement />
        </TabsContent>
        
        <TabsContent value="mydata">
          <MyDataSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
