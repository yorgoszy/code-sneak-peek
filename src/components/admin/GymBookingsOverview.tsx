import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Calendar, Users, CalendarIcon, Filter } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { el } from "date-fns/locale";
import { cn } from "@/lib/utils";
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
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'all'>('all');

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

  // Apply date filter
  const applyDateFilter = (bookingsList: GymBooking[]) => {
    if (filterType === 'all') return bookingsList;
    
    const now = new Date();
    let start: Date, end: Date;
    
    switch (filterType) {
      case 'day':
        if (dateFrom) {
          start = new Date(dateFrom);
          end = new Date(dateFrom);
          end.setHours(23, 59, 59, 999);
        } else {
          start = new Date(now);
          end = new Date(now);
          end.setHours(23, 59, 59, 999);
        }
        break;
      case 'week':
        start = dateFrom ? startOfWeek(dateFrom, { locale: el }) : startOfWeek(now, { locale: el });
        end = dateFrom ? endOfWeek(dateFrom, { locale: el }) : endOfWeek(now, { locale: el });
        break;
      case 'month':
        start = dateFrom ? startOfMonth(dateFrom) : startOfMonth(now);
        end = dateFrom ? endOfMonth(dateFrom) : endOfMonth(now);
        break;
      default:
        return bookingsList;
    }
    
    if (dateTo) {
      end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
    }
    
    return bookingsList.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return isWithinInterval(bookingDate, { start, end });
    });
  };

  // Filter bookings by status and date
  const filteredBookings = applyDateFilter(bookings);
  
  const upcomingBookings = filteredBookings.filter(booking => 
    booking.status === 'confirmed' && new Date(`${booking.booking_date} ${booking.booking_time}`) > new Date()
  );
  
  const pendingBookings = filteredBookings.filter(booking => booking.status === 'pending');
  
  const pastBookings = filteredBookings.filter(booking => 
    (booking.status === 'confirmed' && new Date(`${booking.booking_date} ${booking.booking_time}`) <= new Date()) ||
    booking.status === 'cancelled'
  );

  const resetFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setFilterType('all');
  };

  if (loading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Κρατήσεις Γυμναστηρίου</h2>
        <p className="text-gray-600">Διαχείριση όλων των κρατήσεων για το γυμναστήριο</p>
      </div>

      {/* Date Filters */}
      <Card className="rounded-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Φίλτρα Ημερομηνιών
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Type Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
              className="rounded-none"
            >
              Όλες
            </Button>
            <Button
              variant={filterType === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('day')}
              className="rounded-none"
            >
              Ημέρα
            </Button>
            <Button
              variant={filterType === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('week')}
              className="rounded-none"
            >
              Εβδομάδα
            </Button>
            <Button
              variant={filterType === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('month')}
              className="rounded-none"
            >
              Μήνας
            </Button>
          </div>

          {/* Date Pickers */}
          {filterType !== 'all' && (
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Από:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[200px] justify-start text-left font-normal rounded-none",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: el }) : "Επιλέξτε ημερομηνία"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {filterType === 'day' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Έως:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[200px] justify-start text-left font-normal rounded-none",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: el }) : "Επιλέξτε ημερομηνία"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="rounded-none"
              >
                Καθαρισμός
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
            <div className="text-2xl font-bold">{filteredBookings.length}</div>
            <p className="text-xs text-gray-500">Φιλτραρισμένες κρατήσεις</p>
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