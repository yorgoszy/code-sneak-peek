
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
import { OffersManagement } from "@/components/offers/OffersManagement";
import { MagicBoxManager } from "@/components/magic-boxes/MagicBoxManager";
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
          <TabsList className="flex w-full justify-start mb-6 rounded-none h-auto flex-wrap">
            <TabsTrigger value="management" className="rounded-none whitespace-nowrap">Συνδρομές</TabsTrigger>
            <TabsTrigger value="booking" className="rounded-none whitespace-nowrap">Booking</TabsTrigger>
            <TabsTrigger value="videocalls" className="rounded-none whitespace-nowrap">Βιντεοκλήσεις</TabsTrigger>
            <TabsTrigger value="visits" className="rounded-none whitespace-nowrap">Επισκέψεις</TabsTrigger>
            <TabsTrigger value="receipts" className="rounded-none whitespace-nowrap">Αποδείξεις</TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-none whitespace-nowrap">Έξοδα</TabsTrigger>
            <TabsTrigger value="financial" className="rounded-none whitespace-nowrap">Έσοδα-Έξοδα</TabsTrigger>
            <TabsTrigger value="types" className="rounded-none whitespace-nowrap">Τύποι</TabsTrigger>
            <TabsTrigger value="offers" className="rounded-none whitespace-nowrap">Ενεργές Προσφορές</TabsTrigger>
            <TabsTrigger value="magic-boxes" className="rounded-none whitespace-nowrap">Μαγικά Κουτιά</TabsTrigger>
            <TabsTrigger value="history" className="rounded-none whitespace-nowrap">Ιστορικό</TabsTrigger>
            <TabsTrigger value="certificates" className="rounded-none whitespace-nowrap">Certificates</TabsTrigger>
            <TabsTrigger value="mydata" className="rounded-none whitespace-nowrap">Banking</TabsTrigger>
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

          <TabsContent value="offers">
            <OffersManagement />
          </TabsContent>

          <TabsContent value="magic-boxes">
            <MagicBoxManager />
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
