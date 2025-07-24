import React, { useState } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar, Clock, Users, MapPin, Video, Settings, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingSectionsManagement } from "@/components/admin/BookingSectionsManagement";
import { BookingSessionsOverview } from "@/components/admin/BookingSessionsOverview";
import { GymBookingsOverview } from "@/components/admin/GymBookingsOverview";
import { GymBookingsCalendarView } from "@/components/admin/GymBookingsCalendarView";

const OnlineBookingWithSidebar = () => {
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const isMobile = useIsMobile();
  const { userProfile: dashboardUserProfile } = useDashboard();

  const handleSignOut = async () => {
    await signOut();
  };


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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <DashboardHeader
          userProfile={dashboardUserProfile}
          userEmail={user?.email}
          onSignOut={handleSignOut}
          onMobileMenuClick={() => setShowMobileSidebar(true)}
        />

        {/* Online Booking Admin Content */}
        <div className="flex-1 p-3 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Online Booking - Διαχείριση</h1>
              <p className="text-lg text-gray-600">
                Διαχειριστείτε τα τμήματα και τις κρατήσεις του γυμναστηρίου
              </p>
            </div>

            <Tabs defaultValue="bookings" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 rounded-none">
                <TabsTrigger value="bookings" className="rounded-none">
                  <Calendar className="w-4 h-4 mr-2" />
                  Κρατήσεις
                </TabsTrigger>
                <TabsTrigger value="calendar" className="rounded-none">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Επισκόπηση
                </TabsTrigger>
                <TabsTrigger value="overview" className="rounded-none">
                  <Users className="w-4 h-4 mr-2" />
                  Στατιστικά
                </TabsTrigger>
                <TabsTrigger value="sections" className="rounded-none">
                  <Settings className="w-4 h-4 mr-2" />
                  Διαχείριση Τμημάτων
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bookings" className="space-y-6">
                <GymBookingsOverview />
              </TabsContent>

              <TabsContent value="calendar" className="space-y-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Επισκόπηση Κρατήσεων</h2>
                    <p className="text-gray-600">Ημερολογιακή προβολή όλων των κρατήσεων</p>
                  </div>
                  <GymBookingsCalendarView />
                </div>
              </TabsContent>

              <TabsContent value="overview" className="space-y-6">
                <BookingSessionsOverview />
              </TabsContent>

              <TabsContent value="sections" className="space-y-6">
                <BookingSectionsManagement />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineBookingWithSidebar;