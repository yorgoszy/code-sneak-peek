import React from 'react';
import { Sidebar } from "@/components/Sidebar";
import { useVideocallBookings } from "@/hooks/useVideocallBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Video, History } from "lucide-react";
import { VideocallBookingCard } from "@/components/online-coaching/VideocallBookingCard";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

const OnlineCoachingWithSidebar: React.FC = () => {
  // For admin view - show all videocall bookings
  const { bookings, loading, fetchBookings } = useVideocallBookings(true);

  // Διαχωρισμός bookings σε επερχόμενα, εκκρεμείς και ιστορικό
  const now = new Date();
  const upcomingBookings = bookings.filter(booking => 
    booking.status === 'confirmed' && new Date(booking.booking_date) >= now
  );
  const pendingBookings = bookings.filter(booking => booking.status === 'pending');
  const pastBookings = bookings.filter(booking => 
    booking.status !== 'confirmed' || (booking.status === 'confirmed' && new Date(booking.booking_date) < now)
  );

  // Δημιουργία set με ημερομηνίες εγκεκριμένων βιντεοκλήσεων
  const confirmedDates = new Set(
    bookings
      .filter(booking => booking.status === 'confirmed')
      .map(booking => format(new Date(booking.booking_date), 'yyyy-MM-dd'))
  );

  // Προσαρμοσμένο styling για το ημερολόγιο
  const modifiers = {
    confirmedBooking: (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return confirmedDates.has(dateStr);
    }
  };

  const modifiersStyles = {
    confirmedBooking: { 
      backgroundColor: '#00ffba', 
      color: 'black',
      fontWeight: 'bold'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isCollapsed={false} setIsCollapsed={() => {}} />
      <div className="flex-1 ml-64">
        <div className="w-full px-4 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Online Coaching - Admin</h1>
              <p className="text-gray-600">Όλες οι προγραμματισμένες βιντεοκλήσεις</p>
            </div>

            {/* Calendar and Stats Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar Card */}
              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Ημερολόγιο Βιντεοκλήσεων
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Calendar
                    mode="single"
                    className="rounded-none p-3 pointer-events-auto"
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
                  />
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Επισκόπηση Συστήματος
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#00ffba]">{bookings.length}</div>
                      <div className="text-sm text-gray-600">Συνολικές Κλήσεις</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{pendingBookings.length}</div>
                      <div className="text-sm text-gray-600">Εκκρεμείς</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{upcomingBookings.length}</div>
                      <div className="text-sm text-gray-600">Επερχόμενες</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{pastBookings.length}</div>
                      <div className="text-sm text-gray-600">Ολοκληρωμένες</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bookings Tabs */}
            <Card className="rounded-none">
              <CardContent className="p-0">
                <Tabs defaultValue="pending" className="w-full">
                  <div className="border-b border-gray-200 px-6 pt-6">
                    <TabsList className="grid w-full grid-cols-3 rounded-none">
                      <TabsTrigger value="pending" className="rounded-none flex items-center gap-2">
                        Εκκρεμείς ({pendingBookings.length})
                      </TabsTrigger>
                      <TabsTrigger value="upcoming" className="rounded-none flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Επερχόμενες ({upcomingBookings.length})
                      </TabsTrigger>
                      <TabsTrigger value="history" className="rounded-none flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Ιστορικό ({pastBookings.length})
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Εκκρεμείς Κλήσεις */}
                  <TabsContent value="pending" className="p-6">
                    {pendingBookings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Video className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Δεν υπάρχουν εκκρεμείς κλήσεις</h3>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingBookings.map((booking) => (
                          <VideocallBookingCard 
                            key={booking.id} 
                            booking={booking} 
                            isAdmin={true} 
                            onRefresh={() => fetchBookings()}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Επερχόμενες Κλήσεις */}
                  <TabsContent value="upcoming" className="p-6">
                    {upcomingBookings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Video className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Δεν υπάρχουν επερχόμενες κλήσεις</h3>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {upcomingBookings.map((booking) => (
                          <VideocallBookingCard 
                            key={booking.id} 
                            booking={booking} 
                            isAdmin={true} 
                            onRefresh={() => fetchBookings()}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Ιστορικό Κλήσεων */}
                  <TabsContent value="history" className="p-6">
                    {pastBookings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <History className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Δεν υπάρχει ιστορικό κλήσεων</h3>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pastBookings.map((booking) => (
                          <VideocallBookingCard 
                            key={booking.id} 
                            booking={booking} 
                            isAdmin={true} 
                            onRefresh={() => fetchBookings()}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineCoachingWithSidebar;