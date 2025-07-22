import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";

interface BookingSession {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  booking_type: string;
  section: {
    name: string;
    max_capacity: number;
  };
  app_users: {
    name: string;
    email: string;
  };
}

export const BookingSessionsOverview = () => {
  const [bookings, setBookings] = useState<BookingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  const fetchBookings = async () => {
    try {
      const startDate = format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const endDate = format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('booking_sessions')
        .select(`
          *,
          section:booking_sections(name, max_capacity),
          app_users(name, email)
        `)
        .gte('booking_date', startDate)
        .lte('booking_date', endDate)
        .eq('status', 'confirmed')
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (error) throw error;
      setBookings((data as any) || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBookingsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.filter(booking => booking.booking_date === dateStr);
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  if (loading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Επισκόπηση Κρατήσεων</h2>
        <p className="text-gray-600">Εβδομάδα {format(selectedDate, 'dd/MM/yyyy')} - {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd/MM/yyyy')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {getWeekDays().map((day, index) => {
          const dayBookings = getBookingsForDay(day);
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          return (
            <Card key={index} className={`rounded-none ${isToday ? 'ring-2 ring-[#00ffba]' : ''}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-center">
                  <div className="font-medium">
                    {['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'][day.getDay()]}
                  </div>
                  <div className="text-lg font-bold">
                    {format(day, 'dd/MM')}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayBookings.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">Δεν υπάρχουν κρατήσεις</p>
                ) : (
                  dayBookings.map((booking) => (
                    <div key={booking.id} className="bg-gray-50 p-2 rounded-none text-xs">
                      <div className="flex items-center space-x-1 mb-1">
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">{booking.booking_time}</span>
                      </div>
                      <div className="flex items-center space-x-1 mb-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{booking.section.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span className="truncate">{booking.app_users.name}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Συνολικές Κρατήσεις</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-gray-500">Αυτή την εβδομάδα</p>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Σήμερα</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getBookingsForDay(new Date()).length}
            </div>
            <p className="text-xs text-gray-500">Προγραμματισμένες κρατήσεις</p>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Πιο Δημοφιλής Ώρα</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.length > 0 ? (
                Object.entries(
                  bookings.reduce((acc: any, booking) => {
                    acc[booking.booking_time] = (acc[booking.booking_time] || 0) + 1;
                    return acc;
                  }, {})
                ).sort(([,a]: any, [,b]: any) => b - a)[0]?.[0] || '-'
              ) : '-'}
            </div>
            <p className="text-xs text-gray-500">Περισσότερες κρατήσεις</p>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Πιο Δημοφιλές Τμήμα</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {bookings.length > 0 ? (
                Object.entries(
                  bookings.reduce((acc: any, booking) => {
                    acc[booking.section.name] = (acc[booking.section.name] || 0) + 1;
                    return acc;
                  }, {})
                ).sort(([,a]: any, [,b]: any) => b - a)[0]?.[0] || '-'
              ) : '-'}
            </div>
            <p className="text-xs text-gray-500">Περισσότερες κρατήσεις</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};