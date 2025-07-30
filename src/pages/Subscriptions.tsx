
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
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Subscriptions() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="relative w-64 h-full">
            <Sidebar 
              isCollapsed={false} 
              setIsCollapsed={setIsCollapsed}
            />
          </div>
        </div>
      )}
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header with Menu Button */}
        <div className="md:hidden bg-white border-b p-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileSidebar(true)}
            className="rounded-none"
          >
            <Menu className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold">Διαχείριση Συνδρομών</h1>
          <div></div> {/* Spacer for centering */}
        </div>

        <div className="flex-1 p-4 md:p-6">
          <div className="mb-6 hidden md:block">
            <h1 className="text-2xl font-bold text-gray-900">Διαχείριση Συνδρομών</h1>
            <p className="text-gray-600">Διαχειριστείτε τις συνδρομές και τους τύπους συνδρομών</p>
          </div>
        
        <Tabs defaultValue="management" className="w-full">
          <TabsList className="flex w-full justify-start mb-6 rounded-none h-auto flex-wrap overflow-x-auto">
            <TabsTrigger value="management" className="rounded-none whitespace-nowrap text-xs sm:text-sm">Συνδρομές</TabsTrigger>
            <TabsTrigger value="booking" className="rounded-none whitespace-nowrap text-xs sm:text-sm">Booking</TabsTrigger>
            <TabsTrigger value="videocalls" className="rounded-none whitespace-nowrap text-xs sm:text-sm">Βιντεοκλήσεις</TabsTrigger>
            <TabsTrigger value="visits" className="rounded-none whitespace-nowrap text-xs sm:text-sm">Επισκέψεις</TabsTrigger>
            <TabsTrigger value="receipts" className="rounded-none whitespace-nowrap text-xs sm:text-sm">Αποδείξεις</TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-none whitespace-nowrap text-xs sm:text-sm">Έξοδα</TabsTrigger>
            <TabsTrigger value="financial" className="rounded-none whitespace-nowrap text-xs sm:text-sm">Έσοδα-Έξοδα</TabsTrigger>
            <TabsTrigger value="types" className="rounded-none whitespace-nowrap text-xs sm:text-sm">Τύποι</TabsTrigger>
            <TabsTrigger value="offers" className="rounded-none whitespace-nowrap text-xs sm:text-sm">Ενεργές Προσφορές</TabsTrigger>
            <TabsTrigger value="magic-boxes" className="rounded-none whitespace-nowrap text-xs sm:text-sm">Μαγικά Κουτιά</TabsTrigger>
            <TabsTrigger value="history" className="rounded-none whitespace-nowrap text-xs sm:text-sm">Ιστορικό</TabsTrigger>
            <TabsTrigger value="certificates" className="rounded-none whitespace-nowrap text-xs sm:text-sm">Certificates</TabsTrigger>
            <TabsTrigger value="mydata" className="rounded-none whitespace-nowrap text-xs sm:text-sm">Banking</TabsTrigger>
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
    </div>
  );
}
