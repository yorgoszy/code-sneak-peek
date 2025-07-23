import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, Users, History } from "lucide-react";
import { VideocallBookingCard } from "@/components/online-coaching/VideocallBookingCard";
import { useVideocallBookings } from "@/hooks/useVideocallBookings";
import { useAuth } from '@/hooks/useAuth';

const OnlineCoaching: React.FC = () => {
  const { user } = useAuth();
  const { bookings, loading } = useVideocallBookings();

  // Διαχωρισμός bookings σε επερχόμενα και ιστορικό
  const now = new Date();
  const upcomingBookings = bookings.filter(booking => 
    booking.status === 'confirmed' && new Date(booking.booking_date) >= now
  );
  const pastBookings = bookings.filter(booking => 
    booking.status !== 'confirmed' || new Date(booking.booking_date) < now
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">Φόρτωση...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Online Coaching</h1>
          <p className="text-gray-600">Οι προγραμματισμένες βιντεοκλήσεις σου</p>
        </div>

        {/* Stats Card */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Επισκόπηση
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#00ffba]">{bookings.length}</div>
                <div className="text-sm text-gray-600">Συνολικές Κλήσεις</div>
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

        {/* Bookings Tabs */}
        <Card className="rounded-none">
          <CardContent className="p-0">
            <Tabs defaultValue="upcoming" className="w-full">
              <div className="border-b border-gray-200 px-6 pt-6">
                <TabsList className="grid w-full grid-cols-2 rounded-none">
                  <TabsTrigger value="upcoming" className="rounded-none flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Επερχόμενες ({upcomingBookings.length})
                  </TabsTrigger>
                  <TabsTrigger value="history" className="rounded-none flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Ιστορικό ({pastBookings.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Επερχόμενες Κλήσεις */}
              <TabsContent value="upcoming" className="p-6">
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Video className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Δεν έχεις προγραμματισμένες κλήσεις</h3>
                    <p>Κλείσε μια βιντεοκλήση από το online booking</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <VideocallBookingCard key={booking.id} booking={booking} />
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
                    <p>Οι ολοκληρωμένες κλήσεις θα εμφανίζονται εδώ</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastBookings.map((booking) => (
                      <VideocallBookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnlineCoaching;