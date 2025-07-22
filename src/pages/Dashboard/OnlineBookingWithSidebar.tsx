import React, { useState } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar, Clock, Users, MapPin, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const OnlineBookingWithSidebar = () => {
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const isMobile = useIsMobile();
  const { userProfile: dashboardUserProfile } = useDashboard();

  const handleSignOut = async () => {
    await signOut();
  };

  // Sample booking options
  const bookingOptions = [
    {
      id: 'visit',
      title: 'Επισκέψεις Γυμναστηρίου',
      description: 'Κλείσε το ραντεβού σου για προπόνηση',
      icon: MapPin,
      color: 'bg-blue-100 text-blue-600',
      available: true
    },
    {
      id: 'videocall',
      title: 'Videocall Συνεδρίες',
      description: 'Online συνεδρίες με τον προπονητή σου',
      icon: Video,
      color: 'bg-green-100 text-green-600',
      available: false
    }
  ];

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

        {/* Online Booking Content */}
        <div className="flex-1 p-3 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Online Booking</h1>
              <p className="text-lg text-gray-600">
                Κλείσε online τα ραντεβού σου για προπονήσεις και συνεδρίες
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {bookingOptions.map((option) => (
                <Card key={option.id} className="rounded-none hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className={`flex items-center justify-center w-12 h-12 ${option.color} rounded-none mx-auto mb-4`}>
                      <option.icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl">{option.title}</CardTitle>
                    <p className="text-gray-600">{option.description}</p>
                    {!option.available && (
                      <Badge variant="secondary" className="rounded-none">
                        Σύντομα Διαθέσιμο
                      </Badge>
                    )}
                  </CardHeader>
                  
                  <CardContent className="text-center">
                    <Button 
                      disabled={!option.available}
                      className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      {option.available ? 'Κλείσε Ραντεβού' : 'Σύντομα'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-none p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Πληροφορίες Booking
              </h2>
              <div className="space-y-2 text-gray-600">
                <p>• Διαθέσιμες ώρες: Δευτέρα - Παρασκευή 08:00 - 20:00</p>
                <p>• Σαββατοκύριακα: 09:00 - 18:00</p>
                <p>• Μπορείς να ακυρώσεις ή να αναβάλεις το ραντεβού σου έως 24 ώρες πριν</p>
                <p>• Για επείγουσες αλλαγές επικοινώνησε τηλεφωνικά</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineBookingWithSidebar;