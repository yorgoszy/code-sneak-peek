
import { SubscriptionManagement } from "@/components/subscriptions/SubscriptionManagement";
import { SubscriptionTypeManager } from "@/components/subscriptions/SubscriptionTypeManager";
import { MyDataIntegration } from "@/components/analytics/MyDataIntegration";
import { ReceiptManagement } from "@/components/analytics/ReceiptManagement";
import { CertificateManager } from "@/components/analytics/CertificateManager";
import { VisitManagement } from "@/components/visits/VisitManagement";
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
          <TabsList className="grid w-full grid-cols-6 mb-6 rounded-none">
            <TabsTrigger value="management" className="rounded-none">Συνδρομές</TabsTrigger>
            <TabsTrigger value="visits" className="rounded-none">Επισκέψεις</TabsTrigger>
            <TabsTrigger value="receipts" className="rounded-none">Αποδείξεις</TabsTrigger>
            <TabsTrigger value="types" className="rounded-none">Τύποι</TabsTrigger>
            <TabsTrigger value="certificates" className="rounded-none">Certificates</TabsTrigger>
            <TabsTrigger value="mydata" className="rounded-none">Banking</TabsTrigger>
          </TabsList>
          
          <TabsContent value="management">
            <SubscriptionManagement />
          </TabsContent>
          
          <TabsContent value="types">
            <SubscriptionTypeManager />
          </TabsContent>
          
          <TabsContent value="visits">
            <VisitManagement />
          </TabsContent>
          
          <TabsContent value="receipts">
            <ReceiptManagement />
          </TabsContent>
          
          <TabsContent value="certificates">
            <CertificateManager />
          </TabsContent>
          
          <TabsContent value="mydata">
            <MyDataIntegration />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
