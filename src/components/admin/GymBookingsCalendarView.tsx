import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [sections, setSections] = useState<BookingSection[]>([]);
  const [bookings, setBookings] = useState<GymBooking[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [fullSlots, setFullSlots] = useState<string[]>([]);
  const [bookingCounts, setBookingCounts] = useState<{ [time: string]: number }>({});
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
    if (selectedDate && selectedSection) {
      fetchBookingsForDate();
    }
  }, [selectedDate, selectedSection]);

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

  const fetchBookingsForDate = async () => {
    if (!selectedDate || !selectedSection) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const section = sections.find(s => s.id === selectedSection);
      if (!section) return;

      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const availableHours = section.available_hours[dayOfWeek] || [];

      // Get bookings for this date and section
      const { data: existingBookings, error } = await supabase
        .from('booking_sessions')
        .select(`
          *,
          section:booking_sections(name, description, max_capacity),
          app_users(name, email)
        `)
        .eq('section_id', selectedSection)
        .eq('booking_date', dateStr)
        .eq('booking_type', 'gym_visit')
        .eq('status', 'confirmed')
        .order('booking_time', { ascending: true });

      if (error) throw error;

      // Count bookings per time slot
      const counts: { [time: string]: number } = {};
      (existingBookings || []).forEach(booking => {
        const time = booking.booking_time.length > 5 
          ? booking.booking_time.substring(0, 5) 
          : booking.booking_time;
        counts[time] = (counts[time] || 0) + 1;
      });

      // Categorize slots
      const available: string[] = [];
      const full: string[] = [];

      availableHours.forEach((time: string) => {
        const currentBookings = counts[time] || 0;
        if (currentBookings >= section.max_capacity) {
          full.push(time);
        } else {
          available.push(time);
        }
      });

      setBookings(existingBookings || []);
      setAvailableSlots(available);
      setFullSlots(full);
      setBookingCounts(counts);
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

  const getBookingsForTimeSlot = (time: string) => {
    return bookings.filter(booking => {
      const bookingTime = booking.booking_time.length > 5 
        ? booking.booking_time.substring(0, 5) 
        : booking.booking_time;
      return bookingTime === time;
    });
  };

  if (loading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Επισκόπηση Κρατήσεων</h2>
        <p className="text-gray-600">Διαχείριση όλων των κρατήσεων για το γυμναστήριο</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>Επίλεξε Ημερομηνία</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < addDays(new Date(), -30)}
              className={cn("w-full pointer-events-auto")}
            />
          </CardContent>
        </Card>

        {/* Section & Time Selection */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>Επίλεξε Χώρο & Ώρα</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Section Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Χώρος Γυμναστηρίου
              </label>
              <div className="space-y-2">
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
            </div>

            {/* Time Selection */}
            {selectedDate && selectedSection && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Κρατήσεις για {format(selectedDate, 'dd/MM/yyyy')}
                </label>
                {(availableSlots.length > 0 || fullSlots.length > 0) ? (
                  <div className="space-y-2">
                    {/* Available slots with booking details */}
                    {availableSlots.map((time) => {
                      const selectedSection_obj = sections.find(s => s.id === selectedSection);
                      const capacity = selectedSection_obj?.max_capacity || 6;
                      const currentBookings = bookingCounts[time] || 0;
                      const slotBookings = getBookingsForTimeSlot(time);
                      
                      return (
                        <div key={time} className="border border-gray-200 rounded-none">
                          <div className="p-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">{time}</span>
                                
                                {/* Loading Bar - inline */}
                                <div className="flex gap-0.5 mx-2">
                                  {Array.from({ length: capacity }).map((_, index) => (
                                    <div
                                      key={index}
                                      className={`h-2 w-3 rounded-none ${
                                        index < currentBookings
                                          ? getLoadingBarColor(currentBookings, capacity)
                                          : 'bg-gray-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <span className="text-sm text-gray-500">
                                {currentBookings}/{capacity}
                              </span>
                            </div>
                            
                            {/* Bookings for this time slot */}
                            {slotBookings.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {slotBookings.map((booking) => (
                                  <div key={booking.id} className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded-none">
                                    <User className="w-3 h-3" />
                                    <span className="font-medium">{booking.app_users?.name || 'Άγνωστος'}</span>
                                    <span className="text-gray-500">({booking.app_users?.email})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Full slots */}
                    {fullSlots.map((time) => {
                      const selectedSection_obj = sections.find(s => s.id === selectedSection);
                      const capacity = selectedSection_obj?.max_capacity || 6;
                      const currentBookings = bookingCounts[time] || capacity;
                      const slotBookings = getBookingsForTimeSlot(time);
                      
                      return (
                        <div key={time} className="border border-gray-200 rounded-none bg-red-50">
                          <div className="p-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">{time}</span>
                                <span className="text-sm text-red-600">(Πλήρης)</span>
                                
                                {/* Loading Bar - inline */}
                                <div className="flex gap-0.5 mx-2">
                                  {Array.from({ length: capacity }).map((_, index) => (
                                    <div
                                      key={index}
                                      className="h-2 w-3 rounded-none bg-red-400"
                                    />
                                  ))}
                                </div>
                              </div>
                              <span className="text-sm text-gray-500">
                                {currentBookings}/{capacity}
                              </span>
                            </div>
                            
                            {/* Bookings for this time slot */}
                            {slotBookings.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {slotBookings.map((booking) => (
                                  <div key={booking.id} className="flex items-center gap-2 text-xs bg-white p-2 rounded-none">
                                    <User className="w-3 h-3" />
                                    <span className="font-medium">{booking.app_users?.name || 'Άγνωστος'}</span>
                                    <span className="text-gray-500">({booking.app_users?.email})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Δεν υπάρχουν διαθέσιμες ώρες για αυτή την ημερομηνία
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};