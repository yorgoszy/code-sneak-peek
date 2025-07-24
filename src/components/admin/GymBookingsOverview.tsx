import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GymBookingCard } from "./GymBookingCard";

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
  
  const pendingBookings = bookings.filter(booking => booking.status === 'pending');
  
  const pastBookings = bookings.filter(booking => 
    (booking.status === 'confirmed' && new Date(`${booking.booking_date} ${booking.booking_time}`) <= new Date()) ||
    booking.status === 'cancelled'
  );

  if (loading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Κρατήσεις Γυμναστηρίου</h2>
        <p className="text-gray-600">Διαχείριση όλων των κρατήσεων για το γυμναστήριο</p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Εκκρεμείς Κρατήσεις
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings.length}</div>
            <p className="text-xs text-gray-500">Χρειάζονται έγκριση</p>
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
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 rounded-none">
          <TabsTrigger value="pending" className="rounded-none">
            Εκκρεμείς ({pendingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="rounded-none">
            Επερχόμενες ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-none">
            Ιστορικό ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingBookings.length === 0 ? (
            <Card className="rounded-none">
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Δεν υπάρχουν εκκρεμείς κρατήσεις</p>
              </CardContent>
            </Card>
          ) : (
            pendingBookings.map((booking) => (
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