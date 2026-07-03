import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Users, Check, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GymBookingCard } from "./GymBookingCard";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface GymBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  booking_type: string;
  notes?: string;
  user_id: string;
  created_at?: string;
  section?: {
    name: string;
    description?: string;
  };
  app_users?: {
    name: string;
    email: string;
  };
}

export const GymBookingsOverview = () => {
  const isMobile = useIsMobile();
  const [bookings, setBookings] = useState<GymBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgedBookingIds, setAcknowledgedBookingIds] = useState<Set<string>>(new Set());
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);

  // Φόρτωση user profile ID
  useEffect(() => {
    const loadUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('app_users')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        
        if (profile) {
          setUserProfileId(profile.id);
        }
      }
    };
    loadUserProfile();
    
    // Καθαρίζουμε παλιά localStorage entries που δεν χρησιμοποιούνται πια
    localStorage.removeItem('readGymBookingIds');
    localStorage.removeItem('lastGymBookingCheck');
  }, []);

  // Φόρτωση acknowledged bookings από τη βάση
  const loadAcknowledgedBookings = async () => {
    if (!userProfileId) return;
    
    try {
      const pageSize = 1000;
      let from = 0;
      let allAcknowledged: { booking_id: string }[] = [];

      while (true) {
        const { data, error } = await supabase
          .from('acknowledged_gym_bookings')
          .select('booking_id')
          .eq('admin_user_id', userProfileId)
          .order('created_at', { ascending: true })
          .range(from, from + pageSize - 1);
        
        if (error) throw error;

        const page = data || [];
        allAcknowledged = [...allAcknowledged, ...page];

        if (page.length < pageSize) break;
        from += pageSize;
      }
      
      setAcknowledgedBookingIds(new Set(allAcknowledged.map(item => item.booking_id)));
    } catch (error) {
      console.error('Error loading acknowledged bookings:', error);
    }
  };

  useEffect(() => {
    if (userProfileId) {
      fetchBookings();
      loadAcknowledgedBookings();
    }
    
    // Realtime updates για νέες κρατήσεις
    const channel = supabase
      .channel('gym-bookings-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_sessions',
          filter: 'booking_type=eq.gym_visit'
        },
        (payload) => {
          console.log('Νέα κράτηση γυμναστηρίου:', payload);
          fetchBookings(); // Ανανέωση των κρατήσεων
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'booking_sessions',
          filter: 'booking_type=eq.gym_visit'
        },
        (payload) => {
          console.log('Ενημέρωση κράτησης γυμναστηρίου:', payload);
          fetchBookings(); // Ανανέωση των κρατήσεων
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfileId]);

  const fetchBookings = async () => {
    try {
      // Also mark any past bookings as missed
      await supabase.rpc('mark_past_bookings_as_missed');

      const pageSize = 1000;
      let from = 0;
      let allBookings: GymBooking[] = [];

      while (true) {
        const { data, error } = await supabase
          .from('booking_sessions')
          .select(`
            *,
            section:booking_sections(name, description),
            app_users(name, email)
          `)
          .eq('booking_type', 'gym_visit')
          .order('booking_date', { ascending: true })
          .order('booking_time', { ascending: true })
          .range(from, from + pageSize - 1);

        if (error) throw error;

        const page = (data as any as GymBooking[]) || [];
        allBookings = [...allBookings, ...page];

        if (page.length < pageSize) break;
        from += pageSize;
      }

      setBookings(allBookings);
    } catch (error) {
      console.error('Error fetching gym bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings by status
  const upcomingBookings = bookings.filter(booking => {
    if (booking.status !== 'confirmed') return false;
    
    const bookingDate = new Date(`${booking.booking_date} ${booking.booking_time}`);
    const now = new Date();
    
    // Είναι μελλοντική κράτηση
    if (bookingDate <= now) return false;
    
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
  
  // Νέες κρατήσεις είναι μόνο αυτές που ΔΕΝ έχουν acknowledged
  const newBookings = bookings.filter(booking => !acknowledgedBookingIds.has(booking.id));
  
  const pastBookings = bookings.filter(booking => 
    (booking.status === 'confirmed' && new Date(`${booking.booking_date} ${booking.booking_time}`) <= new Date()) ||
    booking.status === 'cancelled'
  );

  const handleMarkAsRead = async () => {
    if (!userProfileId) return;
    
    setMarkingAsRead(true);
    
    try {
      // Εισαγωγή όλων των νέων bookings στη βάση ως acknowledged
      const acknowledgeRecords = newBookings.map(booking => ({
        booking_id: booking.id,
        admin_user_id: userProfileId
      }));

      if (acknowledgeRecords.length > 0) {
        const { error } = await supabase
          .from('acknowledged_gym_bookings')
          .upsert(acknowledgeRecords, { onConflict: 'booking_id,admin_user_id', ignoreDuplicates: true });

        if (error) throw error;
      }
      
      // Ενημερώνουμε το local state
      const newAcknowledgedIds = new Set(acknowledgedBookingIds);
      newBookings.forEach(booking => newAcknowledgedIds.add(booking.id));
      setAcknowledgedBookingIds(newAcknowledgedIds);
      
      // Ενημερώνουμε το sidebar
      window.dispatchEvent(new CustomEvent('gym-bookings-read'));
      
      toast.success('Η λίστα "Νέα" καθαρίστηκε επιτυχώς');
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Σφάλμα κατά την ενημέρωση');
    } finally {
      setMarkingAsRead(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  return (
    <div className={`space-y-${isMobile ? '4' : '6'}`}>
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
        <div className={`${isMobile ? 'text-left' : 'text-center'} flex-1`}>
          <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-2`}>Κρατήσεις Γυμναστηρίου</h2>
          <p className="text-gray-600">Διαχείριση όλων των κρατήσεων για το γυμναστήριο</p>
        </div>
        
        {newBookings.length > 0 && (
          <Button
            onClick={handleMarkAsRead}
            disabled={markingAsRead}
            className={`bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none ${isMobile ? 'w-full' : ''}`}
          >
            {markingAsRead ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Ενημερώθηκα
          </Button>
        )}
      </div>

      {/* Summary Statistics */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-4`}>
        <Card className="rounded-none">
          <CardHeader className={`${isMobile ? 'pb-2' : 'pb-2'}`}>
            <CardTitle className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium flex items-center gap-2`}>
              <Calendar className="w-4 h-4" />
              Νέες Κρατήσεις
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{newBookings.length}</div>
            <p className="text-xs text-gray-500">Χρειάζονται επισκόπηση</p>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className={`${isMobile ? 'pb-2' : 'pb-2'}`}>
            <CardTitle className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium flex items-center gap-2`}>
              <Users className="w-4 h-4" />
              Επερχόμενες Κρατήσεις
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{upcomingBookings.length}</div>
            <p className="text-xs text-gray-500">Εγκεκριμένες κρατήσεις</p>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className={`${isMobile ? 'pb-2' : 'pb-2'}`}>
            <CardTitle className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium flex items-center gap-2`}>
              <MapPin className="w-4 h-4" />
              Συνολικές Κρατήσεις
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{bookings.length}</div>
            <p className="text-xs text-gray-500">Όλες οι κρατήσεις</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings by status */}
      <Tabs defaultValue="new" className={`space-y-${isMobile ? '3' : '4'}`}>
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} rounded-none`}>
          <TabsTrigger value="new" className={`rounded-none ${isMobile ? 'text-sm py-2' : ''}`}>
            Νέα ({newBookings.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className={`rounded-none ${isMobile ? 'text-sm py-2' : ''}`}>
            Επερχόμενες ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="history" className={`rounded-none ${isMobile ? 'text-sm py-2' : ''}`}>
            Ιστορικό ({pastBookings.length})
          </TabsTrigger>
          
          {/* Mobile: Separate tabs */}
          {isMobile && (
            <div className="flex overflow-x-auto space-x-2 pb-2 mt-2">
              <TabsList className="grid grid-cols-3 rounded-none min-w-full">
                <TabsTrigger value="new" className="rounded-none text-xs">
                  Νέα ({newBookings.length})
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
        </TabsList>

        <TabsContent value="new" className={`space-y-${isMobile ? '3' : '4'}`}>
          {newBookings.length === 0 ? (
            <Card className="rounded-none">
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Δεν υπάρχουν νέες κρατήσεις</p>
              </CardContent>
            </Card>
          ) : (
            newBookings.map((booking) => (
              <Card key={booking.id} className="rounded-none border-l-4 border-l-[#00ffba]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        📅 Νέα κράτηση από {booking.app_users?.name || 'Άγνωστος χρήστης'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(booking.booking_date).toLocaleDateString('el-GR')} στις {booking.booking_time}
                        {booking.section?.name && ` - ${booking.section.name}`}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Δημιουργήθηκε: {new Date(booking.created_at || booking.booking_date).toLocaleString('el-GR')}
                      </div>
                    </div>
                    <div className="text-xs text-[#00ffba] font-medium">
                      ΝΈΑ
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="upcoming" className={`space-y-${isMobile ? '3' : '4'}`}>
          {upcomingBookings.length === 0 ? (
            <Card className="rounded-none">
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Δεν υπάρχουν επερχόμενες κρατήσεις</p>
              </CardContent>
            </Card>
          ) : (
            upcomingBookings.map((booking) => (
              <GymBookingCard
                key={booking.id}
                booking={booking}
                isAdmin={true}
                onRefresh={fetchBookings}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className={`space-y-${isMobile ? '2' : '2'}`}>
          {pastBookings.length === 0 ? (
            <Card className="rounded-none">
              <CardContent className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Δεν υπάρχει ιστορικό κρατήσεων</p>
              </CardContent>
            </Card>
          ) : (
            pastBookings.map((booking) => (
              <GymBookingCard
                key={booking.id}
                booking={booking}
                isAdmin={true}
                onRefresh={fetchBookings}
                isHistoryView={true}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};