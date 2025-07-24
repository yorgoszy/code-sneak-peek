import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";

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
    max_capacity: number;
  };
  app_users?: {
    name: string;
    email: string;
  };
}

interface BookingSection {
  id: string;
  name: string;
  description?: string;
  max_capacity: number;
  available_hours: any;
}

const AVAILABLE_HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

export const GymBookingsCalendarView = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [sections, setSections] = useState<BookingSection[]>([]);
  const [weekBookings, setWeekBookings] = useState<{ [key: string]: GymBooking[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    if (sections.length > 0 && !selectedSection) {
      setSelectedSection(sections[0].id);
    }
  }, [sections, selectedSection]);

  useEffect(() => {
    if (selectedSection) {
      fetchWeekBookings();
    }
  }, [currentWeek, selectedSection]);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_sections')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      // Filter out videocall sections
      const gymSections = (data || []).filter(section => 
        !section.name.toLowerCase().includes('videocall') && 
        !section.name.toLowerCase().includes('online') &&
        !section.name.toLowerCase().includes('βιντεοκλήσεις') &&
        !section.name.toLowerCase().includes('βιντεοκληση')
      );
      
      setSections(gymSections);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekBookings = async () => {
    if (!selectedSection) return;

    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
      
      const { data: existingBookings, error } = await supabase
        .from('booking_sessions')
        .select(`
          *,
          section:booking_sections(name, description, max_capacity),
          app_users(name, email)
        `)
        .eq('section_id', selectedSection)
        .gte('booking_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('booking_date', format(weekEnd, 'yyyy-MM-dd'))
        .eq('booking_type', 'gym_visit')
        .eq('status', 'confirmed')
        .order('booking_time', { ascending: true });

      if (error) throw error;

      // Group bookings by date
      const groupedBookings: { [key: string]: GymBooking[] } = {};
      (existingBookings || []).forEach(booking => {
        if (!groupedBookings[booking.booking_date]) {
          groupedBookings[booking.booking_date] = [];
        }
        groupedBookings[booking.booking_date].push(booking);
      });

      setWeekBookings(groupedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const getLoadingBarColor = (bookingsCount: number, capacity: number) => {
    const percentage = (bookingsCount / capacity) * 100;
    if (percentage === 0) return 'bg-gray-200';
    if (percentage <= 50) return 'bg-[#00ffba]';
    if (percentage <= 80) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const getBookingsForDateAndTime = (date: string, time: string) => {
    const dayBookings = weekBookings[date] || [];
    return dayBookings.filter(booking => {
      const bookingTime = booking.booking_time.length > 5 
        ? booking.booking_time.substring(0, 5) 
        : booking.booking_time;
      return bookingTime === time;
    });
  };

  const getBookingCounts = (date: string, time: string) => {
    return getBookingsForDateAndTime(date, time).length;
  };

  const previousWeek = () => {
    setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const nextWeek = () => {
    setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  if (loading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(currentWeek, { weekStartsOn: 1 })
  });

  const selectedSectionObj = sections.find(s => s.id === selectedSection);

  return (
    <div className="max-w-full mx-auto space-y-6 overflow-x-auto">
      {/* Section Selection */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Χώρος Γυμναστηρίου</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`p-3 border rounded-none cursor-pointer transition-colors ${
                  selectedSection === section.id 
                    ? 'border-[#00ffba] bg-[#00ffba]/10' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedSection(section.id)}
              >
                <div className="font-medium">{section.name}</div>
                {section.description && (
                  <div className="text-xs text-gray-500">{section.description}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  Χωρητικότητα: {section.max_capacity} άτομα
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button onClick={previousWeek} variant="outline" className="rounded-none">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Προηγούμενη Εβδομάδα
        </Button>
        <h3 className="text-lg font-semibold">
          Εβδομάδα {format(weekStart, 'dd/MM')} - {format(weekDays[6], 'dd/MM/yyyy')}
        </h3>
        <Button onClick={nextWeek} variant="outline" className="rounded-none">
          Επόμενη Εβδομάδα
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Weekly Grid */}
      {selectedSectionObj && (
        <div className="grid grid-cols-7 gap-2 min-w-full">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayOfWeek = day.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const availableHours = selectedSectionObj.available_hours[dayOfWeek] || [];

            return (
              <div key={dateStr} className="min-w-0">
                <div className="text-center p-2 bg-gray-50 border border-gray-200 rounded-none">
                  <div className="font-medium text-sm">
                    {['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'][day.getDay() === 0 ? 6 : day.getDay() - 1]}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(day, 'dd/MM')}
                  </div>
                </div>
                
                <div className="space-y-1 mt-2">
                  {availableHours.map((time: string) => {
                    const capacity = selectedSectionObj.max_capacity || 6;
                    const currentBookings = getBookingCounts(dateStr, time);
                    const slotBookings = getBookingsForDateAndTime(dateStr, time);
                    
                    return (
                      <div key={time} className="border border-gray-200 rounded-none bg-white">
                        <div className="p-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{time}</span>
                            <span>{currentBookings}/{capacity}</span>
                          </div>
                          
                          {/* Loading Bar */}
                          <div className="flex gap-0.5 my-1">
                            {Array.from({ length: capacity }).map((_, index) => (
                              <div
                                key={index}
                                className={`h-1 flex-1 rounded-none ${
                                  index < currentBookings
                                    ? getLoadingBarColor(currentBookings, capacity)
                                    : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          
                          {/* Position Bubbles */}
                          <div className="flex gap-0.5 mt-1">
                            {Array.from({ length: capacity }).map((_, index) => (
                              <div
                                key={index}
                                className={`w-4 h-4 rounded-full border border-gray-200 flex items-center justify-center ${
                                  index < currentBookings 
                                    ? 'bg-[#00ffba]' 
                                    : 'bg-gray-100'
                                }`}
                              >
                                {index < slotBookings.length && (
                                  <Avatar className="w-3 h-3">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="text-xs bg-transparent text-black">
                                      {slotBookings[index]?.app_users?.name?.charAt(0) || 'Α'}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};