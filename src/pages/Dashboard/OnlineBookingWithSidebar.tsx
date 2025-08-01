import React, { useState } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Calendar, Clock, Users, MapPin, Video, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingSessionsOverview } from "@/components/admin/BookingSessionsOverview";
import { GymBookingsOverview } from "@/components/admin/GymBookingsOverview";
import { GymBookingsCalendarView } from "@/components/admin/GymBookingsCalendarView";

const OnlineBookingWithSidebar = () => {
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(isMobile);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const { userProfile: dashboardUserProfile } = useDashboard();
  const { isAdmin } = useRoleCheck();

  const handleSignOut = async () => {
    await signOut();
  };


  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && !isCollapsed && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsCollapsed(true)}
          />
          <div className="fixed left-0 top-0 h-full w-64 bg-white">
            <Sidebar 
              isCollapsed={false} 
              setIsCollapsed={setIsCollapsed}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header with Menu Button */}
        {isMobile && (
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="rounded-none"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Online Booking</h1>
            <div className="w-8" /> {/* Spacer for centering */}
          </div>
        )}
        
        {/* Online Booking Admin Content */}
        <div className={`flex-1 ${isMobile ? 'p-3' : 'p-6'}`}>
          <div className="max-w-7xl mx-auto">
            {/* Header - Hidden on mobile (shown in mobile header instead) */}
            {!isMobile && (
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Online Booking - Διαχείριση</h1>
                  <p className="text-gray-600">
                    Διαχειριστείτε τις κρατήσεις του γυμναστηρίου
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {dashboardUserProfile?.name || user?.email}
                    {isAdmin() && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
                  </span>
                  <Button 
                    variant="outline" 
                    className="rounded-none"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Αποσύνδεση
                  </Button>
                </div>
              </div>
            )}

            <Tabs defaultValue="bookings" className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
              <TabsList className={`grid w-full ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} rounded-none`}>
                <TabsTrigger value="bookings" className={`rounded-none ${isMobile ? 'text-sm py-2' : ''}`}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Κρατήσεις
                </TabsTrigger>
                <TabsTrigger value="calendar" className={`rounded-none ${isMobile ? 'text-sm py-2' : ''}`}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Επισκόπηση
                </TabsTrigger>
                <TabsTrigger value="overview" className={`rounded-none ${isMobile ? 'text-sm py-2' : ''}`}>
                  <Users className="w-4 h-4 mr-2" />
                  Στατιστικά
                </TabsTrigger>
                
                {/* Mobile: Separate tabs with dropdown-like behavior */}
                {isMobile && (
                  <div className="flex overflow-x-auto space-x-2 pb-2 mt-2">
                    <TabsList className="grid grid-cols-3 rounded-none min-w-full">
                      <TabsTrigger value="bookings" className="rounded-none text-xs">
                        Κρατήσεις
                      </TabsTrigger>
                      <TabsTrigger value="calendar" className="rounded-none text-xs">
                        Επισκόπηση
                      </TabsTrigger>
                      <TabsTrigger value="overview" className="rounded-none text-xs">
                        Στατιστικά
                      </TabsTrigger>
                    </TabsList>
                  </div>
                )}
              </TabsList>

              <TabsContent value="bookings" className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
                <GymBookingsOverview />
              </TabsContent>

              <TabsContent value="calendar" className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
                <GymBookingsCalendarView />
              </TabsContent>

              <TabsContent value="overview" className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
                <BookingSessionsOverview />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineBookingWithSidebar;