import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Users, Check, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GymBookingCard } from "./GymBookingCard";
import { toast } from "sonner";

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
  const [bookings, setBookings] = useState<GymBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [readBookingIds, setReadBookingIds] = useState<Set<string>>(() => {
    // Φορτώνουμε από localStorage κατά την αρχικοποίηση
    const saved = localStorage.getItem('readGymBookingIds');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [lastCheckTimestamp, setLastCheckTimestamp] = useState<number>(() => {
    // Φορτώνουμε το timestamp της τελευταίας "ενημέρωσης"
    const saved = localStorage.getItem('lastGymBookingCheck');
    return saved ? parseInt(saved) : Date.now();
  });
  const [markingAsRead, setMarkingAsRead] = useState(false);

  useEffect(() => {
    fetchBookings();
    
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
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_sessions')
        .select(`
          *,
          section:booking_sections(name, description),
          app_users(name, email)
        `)
        .eq('booking_type', 'gym_visit')
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (error) throw error;
      setBookings((data as any) || []);
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
  
  // Νέες κρατήσεις είναι μόνο αυτές που δημιουργήθηκαν μετά το τελευταίο check
  const newBookings = bookings.filter(booking => {
    const bookingCreatedAt = new Date(booking.created_at || booking.booking_date).getTime();
    return bookingCreatedAt > lastCheckTimestamp;
  });
  
  const pastBookings = bookings.filter(booking => 
    (booking.status === 'confirmed' && new Date(`${booking.booking_date} ${booking.booking_time}`) <= new Date()) ||
    booking.status === 'cancelled'
  );

  const handleMarkAsRead = async () => {
    setMarkingAsRead(true);
    
    try {
      // Παίρνουμε όλα τα booking IDs και τα σημειώνουμε ως διαβασμένα
      const allBookingIds = bookings.map(b => b.id);
      localStorage.setItem('readGymBookingIds', JSON.stringify(allBookingIds));
      
      // Ενημερώνουμε το timestamp της τελευταίας επισκόπησης
      const currentTimestamp = Date.now();
      setLastCheckTimestamp(currentTimestamp);
      localStorage.setItem('lastGymBookingCheck', currentTimestamp.toString());
      
      // Καθαρισμός του sidebar count άμεσα
      window.dispatchEvent(new CustomEvent('clear-gym-bookings-count'));
      
      // Ενημερώνουμε και το sidebar για πλήρη ανανέωση
      window.dispatchEvent(new CustomEvent('gym-bookings-read'));
      
      console.log('Marked all bookings as read');
      toast.success('Όλες οι κρατήσεις σημειώθηκαν ως διαβασμένες');
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Κρατήσεις Γυμναστηρίου</h2>
          <p className="text-gray-600">Διαχείριση όλων των κρατήσεων για το γυμναστήριο</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={fetchBookings}
            disabled={loading}
            variant="outline"
            className="rounded-none"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Ανανέωση
          </Button>
          
          {newBookings.length > 0 && (
            <Button
              onClick={handleMarkAsRead}
              disabled={markingAsRead}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
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
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Νέες Κρατήσεις
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newBookings.length}</div>
            <p className="text-xs text-gray-500">Χρειάζονται επισκόπηση</p>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Επερχόμενες Κρατήσεις
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingBookings.length}</div>
            <p className="text-xs text-gray-500">Εγκεκριμένες κρατήσεις</p>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Συνολικές Κρατήσεις
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-gray-500">Όλες οι κρατήσεις</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings by status */}
      <Tabs defaultValue="new" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 rounded-none">
          <TabsTrigger value="new" className="rounded-none">
            Νέα ({newBookings.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="rounded-none">
            Επερχόμενες ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-none">
            Ιστορικό ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-4">
          {newBookings.length === 0 ? (
            <Card className="rounded-none">
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Δεν υπάρχουν νέες κρατήσεις</p>
              </CardContent>
            </Card>
          ) : (
            newBookings.map((booking) => (
              <GymBookingCard
                key={booking.id}
                booking={booking}
                isAdmin={true}
                onRefresh={fetchBookings}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
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

        <TabsContent value="history" className="space-y-4">
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
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};