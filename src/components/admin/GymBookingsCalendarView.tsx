import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, User, Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { el } from "date-fns/locale";

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

interface TimeSlot {
  time: string;
  bookings: GymBooking[];
  capacity: number;
}

interface DaySchedule {
  date: string;
  timeSlots: TimeSlot[];
}

const AVAILABLE_HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

const MAX_CAPACITY = 6;

export const GymBookingsCalendarView = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [bookings, setBookings] = useState<GymBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [currentWeek]);

  const fetchBookings = async () => {
    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

      const { data, error } = await supabase
        .from('booking_sessions')
        .select(`
          *,
          section:booking_sections(name, description),
          app_users(name, email)
        `)
        .eq('booking_type', 'gym_visit')
        .gte('booking_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('booking_date', format(weekEnd, 'yyyy-MM-dd'))
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

  const getWeekDays = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    
    return days;
  };

  const getDaySchedule = (date: Date): DaySchedule => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayBookings = bookings.filter(booking => booking.booking_date === dateStr);
    
    const timeSlots: TimeSlot[] = AVAILABLE_HOURS.map(time => {
      const slotBookings = dayBookings.filter(booking => 
        booking.booking_time === time + ':00' && booking.status === 'confirmed'
      );
      
      return {
        time,
        bookings: slotBookings,
        capacity: MAX_CAPACITY
      };
    });

    return {
      date: dateStr,
      timeSlots
    };
  };

  const getLoadingBarColor = (bookingsCount: number, capacity: number) => {
    const percentage = (bookingsCount / capacity) * 100;
    if (percentage === 0) return 'bg-gray-200';
    if (percentage <= 50) return 'bg-[#00ffba]';
    if (percentage <= 80) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = addDays(currentWeek, direction === 'next' ? 7 : -7);
    setCurrentWeek(newWeek);
    setSelectedDate(null);
  };

  const toggleDayDetails = (dateStr: string) => {
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  if (loading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  const weekDays = getWeekDays();

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateWeek('prev')}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-none hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4" />
          Προηγούμενη
        </button>
        
        <h3 className="text-lg font-semibold">
          {format(weekDays[0], 'd MMM', { locale: el })} - {format(weekDays[6], 'd MMM yyyy', { locale: el })}
        </h3>
        
        <button
          onClick={() => navigateWeek('next')}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-none hover:bg-gray-50"
        >
          Επόμενη
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((date) => {
          const daySchedule = getDaySchedule(date);
          const isSelected = selectedDate === daySchedule.date;
          const totalBookings = daySchedule.timeSlots.reduce((sum, slot) => sum + slot.bookings.length, 0);
          
          return (
            <div key={daySchedule.date} className="space-y-2">
              <Card 
                className={`rounded-none cursor-pointer transition-colors ${
                  isSelected ? 'ring-2 ring-[#00ffba] bg-[#00ffba]/5' : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleDayDetails(daySchedule.date)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-center">
                    <div className="font-medium">
                      {format(date, 'EEE', { locale: el })}
                    </div>
                    <div className="text-lg font-bold">
                      {format(date, 'd')}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-center mb-3">
                    <Badge variant="outline" className="rounded-none text-xs">
                      {totalBookings} άτομα
                    </Badge>
                  </div>
                  
                  {/* Time Slots with Loading Bars */}
                  <div className="space-y-1">
                    {daySchedule.timeSlots.map((slot) => (
                      <div key={slot.time} className="flex items-center gap-2 text-xs">
                        <span className="w-10 text-gray-600">{slot.time}</span>
                        <div className="flex-1 flex gap-0.5">
                          {Array.from({ length: slot.capacity }).map((_, index) => (
                            <div
                              key={index}
                              className={`h-2 flex-1 rounded-none ${
                                index < slot.bookings.length
                                  ? getLoadingBarColor(slot.bookings.length, slot.capacity)
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-500 w-6 text-right">
                          {slot.bookings.length}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Selected Day Details */}
      {selectedDate && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Λεπτομέρειες για {format(new Date(selectedDate), 'EEEE, d MMMM yyyy', { locale: el })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getDaySchedule(new Date(selectedDate)).timeSlots
                .filter(slot => slot.bookings.length > 0)
                .map((slot) => (
                  <div key={slot.time} className="border border-gray-200 rounded-none p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4" />
                      <h4 className="font-medium">{slot.time}</h4>
                      <Badge variant="outline" className="rounded-none">
                        {slot.bookings.length}/{slot.capacity} άτομα
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {slot.bookings.map((booking) => (
                        <div key={booking.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-none">
                          <User className="w-4 h-4 text-gray-600" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {booking.app_users?.name || 'Άγνωστος χρήστης'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.app_users?.email}
                            </div>
                          </div>
                          <Badge 
                            variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                            className="rounded-none text-xs"
                          >
                            {booking.status === 'confirmed' ? 'Επιβεβαιωμένο' : 'Εκκρεμές'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              
              {getDaySchedule(new Date(selectedDate)).timeSlots.every(slot => slot.bookings.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  Δεν υπάρχουν κρατήσεις για αυτή την ημέρα
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};