
import { SubscriptionManagement } from "@/components/subscriptions/SubscriptionManagement";
import { SubscriptionTypeManager } from "@/components/subscriptions/SubscriptionTypeManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function Subscriptions() {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, userProfile, loading: rolesLoading } = useRoleCheck();
  const isMobile = useIsMobile();

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to={`/dashboard/user-profile/${userProfile?.id}`} replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <AppSidebar />
        
        <SidebarInset className="flex-1 flex flex-col">
          {/* Header */}
          <nav className={`bg-white border-b border-gray-200 ${isMobile ? 'px-3 py-3' : 'px-6 py-4'}`}>
            <div className="flex justify-between items-center">
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
                {isMobile && <SidebarTrigger />}
                <div className={`${isMobile ? 'min-w-0 flex-1' : ''}`}>
                  <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 ${isMobile ? 'truncate' : ''}`}>
                    Διαχείριση Συνδρομών
                  </h1>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 ${isMobile ? 'truncate' : ''}`}>
                    Διαχειριστείτε τις συνδρομές και τους τύπους συνδρομών
                  </p>
                </div>
              </div>
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
                {!isMobile && (
                  <span className="text-sm text-gray-600">
                    {userProfile?.name || user?.email}
                    {isAdmin() && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
                  </span>
                )}
                <Button 
                  variant="outline" 
                  className={`rounded-none ${isMobile ? 'text-xs px-2' : ''}`}
                  onClick={handleSignOut}
                >
                  <LogOut className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                  {isMobile ? 'Exit' : 'Αποσύνδεση'}
                </Button>
              </div>
            </div>
          </nav>

          {/* Content */}
          <div className={`flex-1 ${isMobile ? 'p-3' : 'p-6'}`}>
            <Tabs defaultValue="management" className="w-full">
              <TabsList className={`grid w-full grid-cols-2 ${isMobile ? 'mb-4' : 'mb-6'} rounded-none`}>
                <TabsTrigger value="management" className={`rounded-none ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  Διαχείριση Συνδρομών
                </TabsTrigger>
                <TabsTrigger value="types" className={`rounded-none ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  Τύποι Συνδρομών
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="management">
                <SubscriptionManagement />
              </TabsContent>
              
              <TabsContent value="types">
                <SubscriptionTypeManager />
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
