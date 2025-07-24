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
  const [markingAsRead, setMarkingAsRead] = useState(false);

  useEffect(() => {
    fetchBookings();
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
  const upcomingBookings = bookings.filter(booking => 
    booking.status === 'confirmed' && new Date(`${booking.booking_date} ${booking.booking_time}`) > new Date()
  );
  
  // Νέες κρατήσεις είναι όλες οι κρατήσεις που δεν έχουν "διαβαστεί"
  const newBookings = bookings.filter(booking => 
    !readBookingIds.has(booking.id)
  );
  
  const pastBookings = bookings.filter(booking => 
    (booking.status === 'confirmed' && new Date(`${booking.booking_date} ${booking.booking_time}`) <= new Date()) ||
    booking.status === 'cancelled'
  );

  const handleMarkAsRead = async () => {
    setMarkingAsRead(true);
    
    try {
      // Προσθέτουμε όλες τις νέες κρατήσεις στο set των διαβασμένων
      const newReadIds = new Set([...readBookingIds, ...newBookings.map(b => b.id)]);
      setReadBookingIds(newReadIds);
      
      // Αποθηκεύουμε στο localStorage
      localStorage.setItem('readGymBookingIds', JSON.stringify([...newReadIds]));
      
      // Ενημερώνουμε το sidebar
      window.dispatchEvent(new CustomEvent('gym-bookings-read'));
      
      console.log('Marked as read:', [...newReadIds]);
      toast.success('Όλες οι νέες κρατήσεις μεταφέρθηκαν στο "Ενημερώθηκα"');
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