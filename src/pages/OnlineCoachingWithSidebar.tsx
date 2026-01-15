import React, { useState } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { useVideocallBookings } from "@/hooks/useVideocallBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Video, History, Menu } from "lucide-react";
import { VideocallBookingCard } from "@/components/online-coaching/VideocallBookingCard";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const OnlineCoachingWithSidebar: React.FC = () => {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(isMobile);
  // For admin view - show all videocall bookings
  const { bookings, loading, fetchBookings } = useVideocallBookings(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Διαχωρισμός bookings σε επερχόμενα, εκκρεμείς και ιστορικό
  const now = new Date();
  const upcomingBookings = bookings.filter(booking => {
    if (booking.status !== 'confirmed') return false;
    
    const bookingDate = new Date(booking.booking_date);
    
    // Είναι μελλοντική κράτηση
    if (bookingDate < now) return false;
    
    // Βρίσκουμε την αρχή της τρέχουσας εβδομάδας (Δευτέρα)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ρύθμιση για Δευτέρα
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Βρίσκουμε το τέλος της τρέχουσας εβδομάδας (Κυριακή)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Επιστρέφουμε μόνο τις κρατήσεις της τρέχουσας εβδομάδας
    return bookingDate >= startOfWeek && bookingDate <= endOfWeek;
  });
  const pendingBookings = bookings.filter(booking => booking.status === 'pending');
  const pastBookings = bookings
    .filter(booking => 
      booking.status === 'completed' || 
      booking.status === 'rejected' || 
      (booking.status === 'confirmed' && new Date(booking.booking_date) < now)
    )
    .sort((a, b) => {
      const dateA = new Date(`${a.booking_date} ${a.booking_time}`);
      const dateB = new Date(`${b.booking_date} ${b.booking_time}`);
      return dateB.getTime() - dateA.getTime(); // Φθίνουσα σειρά (πιο πρόσφατες πρώτα)
    });

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

  // Φιλτράρισμα bookings για την επιλεγμένη ημερομηνία
  const selectedDateBookings = selectedDate 
    ? bookings.filter(booking => {
        const bookingDate = format(new Date(booking.booking_date), 'yyyy-MM-dd');
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        return bookingDate === selectedDateStr;
      })
    : [];

  const handleJoinMeeting = (booking: any) => {
    if (booking.meeting_link) {
      const adminName = 'Admin';
      const meetingUrl = `${booking.meeting_link}#userInfo.displayName="${adminName}"&config.prejoinPageEnabled=false&config.startWithVideoMuted=false&config.startWithAudioMuted=false`;
      window.open(meetingUrl, '_blank');
    }
  };

  const handleToggleComplete = async (booking: any) => {
    if (booking.status === 'pending' || booking.status === 'rejected') return;
    
    try {
      const newStatus = booking.status === 'confirmed' ? 'completed' : 'confirmed';
      
      const { error } = await supabase
        .from('booking_sessions')
        .update({ status: newStatus })
        .eq('id', booking.id);

      if (error) throw error;

      // Ενημέρωση τοπικού state
      booking.status = newStatus;
      
      // Refresh των bookings για ενημέρωση των lists
      await fetchBookings();
      
      // Ενημέρωση των selectedDateBookings
      const updatedBookings = selectedDateBookings.map(b => 
        b.id === booking.id ? { ...b, status: newStatus } : b
      );
      
    } catch (error) {
      console.error('Error toggling completion status:', error);
    }
  };

  // Έλεγχος αν η επιλεγμένη ημερομηνία έχει confirmed bookings
  const selectedDateHasConfirmedBookings = selectedDate && selectedDateBookings.some(booking => booking.status === 'confirmed');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - κρυφό σε mobile */}
      {!isMobile && <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />}
      
      {/* Mobile/Tablet Sidebar Overlay */}
      {isMobile && !isCollapsed && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsCollapsed(true)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-white">
            <Sidebar isCollapsed={false} setIsCollapsed={setIsCollapsed} />
          </div>
        </div>
      )}
      
      <div className="flex-1 min-w-0">
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
            <h1 className="text-lg font-semibold">Online Coaching</h1>
            <div className="w-8" /> {/* Spacer for centering */}
          </div>
        )}
        
        <div className={`w-full ${isMobile ? 'px-3 py-4' : 'px-4 py-8'}`}>
          <div className="space-y-4 md:space-y-6">
            {/* Header - Hidden on mobile (shown in mobile header instead) */}
            {!isMobile && (
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Online Coaching - Admin</h1>
                <p className="text-gray-600">Όλες οι προγραμματισμένες βιντεοκλήσεις</p>
              </div>
            )}

            {/* Calendar and Stats Section */}
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-4 md:gap-6`}>
              {/* Calendar Card */}
              <Card className="rounded-none">
                <CardHeader className={isMobile ? "pb-3" : ""}>
                  <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                    <CalendarIcon className="w-5 h-5" />
                    Ημερολόγιο Βιντεοκλήσεων
                  </CardTitle>
                </CardHeader>
                <CardContent className={`flex justify-center ${isMobile ? 'p-3' : ''}`}>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className={`rounded-none ${isMobile ? 'p-1' : 'p-3'} pointer-events-auto`}
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
                    classNames={{
                      day_selected: selectedDateHasConfirmedBookings 
                        ? "border-2 border-black bg-transparent text-black hover:bg-black/10 focus:bg-black/10 rounded-none"
                        : "border-2 border-[#00ffba] bg-transparent text-[#00ffba] hover:bg-[#00ffba]/10 focus:bg-[#00ffba]/10 rounded-none"
                    }}
                  />
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card className="rounded-none">
                <CardHeader className={isMobile ? "pb-3" : ""}>
                  <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                    <Video className="w-5 h-5" />
                    Επισκόπηση Συστήματος
                  </CardTitle>
                </CardHeader>
                <CardContent className={isMobile ? "p-3" : ""}>
                  {selectedDate && selectedDateBookings.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Βιντεοκλήσεις για {format(selectedDate, 'dd/MM/yyyy')}:
                      </h3>
                      <div className={`space-y-2 ${isMobile ? 'max-h-40' : 'max-h-48'} overflow-y-auto`}>
                        {selectedDateBookings.map((booking) => (
                          <div key={booking.id} className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'} p-2 bg-gray-50 rounded-none text-sm`}>
                            <div className="flex-1">
                              <div className="font-medium">{booking.user?.name || 'Άγνωστος χρήστης'}</div>
                              <div className="text-xs text-gray-500">{booking.user?.email}</div>
                            </div>
                            <div className={`flex items-center ${isMobile ? 'justify-between' : 'gap-2'}`}>
                              <div className={`${isMobile ? '' : 'text-right'}`}>
                                <div className="font-medium">{booking.booking_time?.slice(0, 5)}</div>
                                <div 
                                  className={`text-xs px-2 py-1 rounded-none border cursor-pointer transition-colors ${
                                    booking.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                                    booking.status === 'completed' ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' :
                                    booking.status === 'pending' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                    'bg-gray-100 text-gray-800 border-gray-200'
                                  }`}
                                  onClick={() => handleToggleComplete(booking)}
                                >
                                  {booking.status === 'confirmed' ? 'Εγκεκριμένη' :
                                   booking.status === 'completed' ? 'Ολοκληρωμένη' :
                                   booking.status === 'pending' ? 'Εκκρεμής' : booking.status}
                                </div>
                              </div>
                              {booking.status === 'confirmed' && booking.meeting_link && (
                                <Button
                                  onClick={() => handleJoinMeeting(booking)}
                                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                                  size={isMobile ? "sm" : "sm"}
                                >
                                  <Video className="w-4 h-4" />
                                  {!isMobile && <span className="ml-1">Συμμετοχή</span>}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : selectedDate ? (
                    <div className="text-center py-8 text-gray-500">
                      <Video className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      <p className="text-sm">Δεν υπάρχουν βιντεοκλήσεις για {format(selectedDate, 'dd/MM/yyyy')}</p>
                    </div>
                  ) : (
                    <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2'} gap-4`}>
                      <div className="text-center">
                        <div className={`text-2xl font-bold text-[#00ffba] ${isMobile ? 'text-xl' : ''}`}>{upcomingBookings.length}</div>
                        <div className={`text-sm text-gray-600 ${isMobile ? 'text-xs' : ''}`}>Επερχόμενες Κλήσεις</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold text-orange-600 ${isMobile ? 'text-xl' : ''}`}>{pendingBookings.length}</div>
                        <div className={`text-sm text-gray-600 ${isMobile ? 'text-xs' : ''}`}>Εκκρεμείς</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold text-blue-600 ${isMobile ? 'text-xl' : ''}`}>{bookings.length}</div>
                        <div className={`text-sm text-gray-600 ${isMobile ? 'text-xs' : ''}`}>Συνολικά Bookings</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold text-green-600 ${isMobile ? 'text-xl' : ''}`}>{pastBookings.length}</div>
                        <div className={`text-sm text-gray-600 ${isMobile ? 'text-xs' : ''}`}>Ολοκληρωμένες</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bookings Tabs */}
            <Card className="rounded-none">
              <CardContent className={isMobile ? "p-0" : "p-0"}>
                <Tabs defaultValue="pending" className="w-full">
                  <div className={`border-b border-gray-200 ${isMobile ? 'px-3 pt-3' : 'px-6 pt-6'}`}>
                    <TabsList className={`grid w-full ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} rounded-none ${isMobile ? 'gap-1' : ''}`}>
                      <TabsTrigger value="pending" className={`rounded-none flex items-center gap-2 ${isMobile ? 'text-sm py-2' : ''}`}>
                        Εκκρεμείς ({pendingBookings.length})
                      </TabsTrigger>
                      <TabsTrigger value="upcoming" className={`rounded-none flex items-center gap-2 ${isMobile ? 'text-sm py-2' : ''}`}>
                        <Video className="w-4 h-4" />
                        {isMobile ? 'Επερχόμενες' : 'Επερχόμενες'} ({upcomingBookings.length})
                      </TabsTrigger>
                      <TabsTrigger value="history" className={`rounded-none flex items-center gap-2 ${isMobile ? 'text-sm py-2' : ''}`}>
                        <History className="w-4 h-4" />
                        Ιστορικό ({pastBookings.length})
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Mobile: Separate tabs with dropdown-like behavior */}
                    {isMobile && (
                      <div className="flex overflow-x-auto space-x-2 pb-2 mt-2">
                        <TabsList className="grid grid-cols-3 rounded-none min-w-full">
                          <TabsTrigger value="pending" className="rounded-none text-xs">
                            Εκκρεμείς ({pendingBookings.length})
                          </TabsTrigger>
                          <TabsTrigger value="upcoming" className="rounded-none text-xs">
                            Επερχόμενες ({upcomingBookings.length})
                          </TabsTrigger>
                          <TabsTrigger value="history" className="rounded-none text-xs">
                            Ιστορικό ({pastBookings.length})
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    )}
                  </div>

                  {/* Εκκρεμείς Κλήσεις */}
                  <TabsContent value="pending" className={isMobile ? "p-3" : "p-6"}>
                    {pendingBookings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Video className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Δεν υπάρχουν εκκρεμείς κλήσεις</h3>
                      </div>
                    ) : (
                      <div className={`space-y-${isMobile ? '3' : '4'}`}>
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
                  <TabsContent value="upcoming" className={isMobile ? "p-3" : "p-6"}>
                    {upcomingBookings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Video className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Δεν υπάρχουν επερχόμενες κλήσεις</h3>
                      </div>
                    ) : (
                      <div className={`space-y-${isMobile ? '3' : '4'}`}>
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
                  <TabsContent value="history" className={isMobile ? "p-3" : "p-6"}>
                    {pastBookings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <History className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Δεν υπάρχει ιστορικό κλήσεων</h3>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pastBookings.map((booking) => (
                          <VideocallBookingCard 
                            key={booking.id} 
                            booking={booking} 
                            isAdmin={true} 
                            onRefresh={() => fetchBookings()}
                            isHistoryView={true}
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