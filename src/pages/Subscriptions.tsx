
import { SubscriptionManagement } from "@/components/subscriptions/SubscriptionManagement";
import { SubscriptionTypeManager } from "@/components/subscriptions/SubscriptionTypeManager";
import { SubscriptionHistory } from "@/components/subscriptions/SubscriptionHistory";
import { MyDataIntegration } from "@/components/analytics/MyDataIntegration";
import { ReceiptManagement } from "@/components/analytics/ReceiptManagement";
import { CertificateManager } from "@/components/analytics/CertificateManager";
import { VisitManagement } from "@/components/visits/VisitManagement";
import { FinancialOverview } from "@/components/analytics/FinancialOverview";
import { ExpenseManagement } from "@/components/expenses/ExpenseManagement";
import { AdminBookingManagement } from "@/components/admin/AdminBookingManagement";
import { VideocallManagement } from "@/components/videocalls/VideocallManagement";
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
          <TabsList className="grid w-full grid-cols-11 mb-6 rounded-none">
            <TabsTrigger value="management" className="rounded-none">Συνδρομές</TabsTrigger>
            <TabsTrigger value="booking" className="rounded-none">Booking</TabsTrigger>
            <TabsTrigger value="videocalls" className="rounded-none">Βιντεοκλήσεις</TabsTrigger>
            <TabsTrigger value="visits" className="rounded-none">Επισκέψεις</TabsTrigger>
            <TabsTrigger value="receipts" className="rounded-none">Αποδείξεις</TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-none">Έξοδα</TabsTrigger>
            <TabsTrigger value="financial" className="rounded-none">Έσοδα-Έξοδα</TabsTrigger>
            <TabsTrigger value="types" className="rounded-none">Τύποι</TabsTrigger>
            <TabsTrigger value="history" className="rounded-none">Ιστορικό</TabsTrigger>
            <TabsTrigger value="certificates" className="rounded-none">Certificates</TabsTrigger>
            <TabsTrigger value="mydata" className="rounded-none">Banking</TabsTrigger>
          </TabsList>
          
          <TabsContent value="management">
            <SubscriptionManagement />
          </TabsContent>

          <TabsContent value="booking">
            <AdminBookingManagement />
          </TabsContent>

          <TabsContent value="videocalls">
            <VideocallManagement />
          </TabsContent>
          
          <TabsContent value="types">
            <SubscriptionTypeManager />
          </TabsContent>

          <TabsContent value="history">
            <SubscriptionHistory />
          </TabsContent>
          
          <TabsContent value="visits">
            <VisitManagement />
          </TabsContent>
          
          <TabsContent value="receipts">
            <ReceiptManagement />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpenseManagement />
          </TabsContent>
          
          <TabsContent value="certificates">
            <CertificateManager />
          </TabsContent>
          
          <TabsContent value="mydata">
            <MyDataIntegration />
          </TabsContent>

          <TabsContent value="financial">
            <FinancialOverview />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
