import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, X } from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { useBookingSections } from "@/hooks/useBookingSections";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface BookingCalendarProps {
  onBookingCreate: (sectionId: string, date: string, time: string, type: string) => Promise<void>;
  onClose: () => void;
  bookingType: string;
  availability: any;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  onBookingCreate,
  onClose,
  bookingType,
  availability
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [fullSlots, setFullSlots] = useState<string[]>([]);
  const [bookingCounts, setBookingCounts] = useState<{ [time: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const { sections, getTimeSlotStatus, getTimeSlotBookings } = useBookingSections(bookingType);

  // Set default section when sections load
  useEffect(() => {
    if (sections.length > 0 && !selectedSection) {
      setSelectedSection(sections[0].id);
    }
  }, [sections, selectedSection]);

  // Update available slots when date or section changes
  useEffect(() => {
    if (selectedDate && selectedSection) {
      updateAvailableSlots();
    }
  }, [selectedDate, selectedSection]);

  // Set up realtime updates for booking changes
  useEffect(() => {
    const channel = supabase
      .channel('user-booking-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_sessions'
        },
        (payload) => {
          console.log('🔄 Real-time booking update:', payload);
          // Re-fetch available slots when bookings change
          if (selectedDate && selectedSection) {
            updateAvailableSlots();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate, selectedSection]);

  const updateAvailableSlots = async () => {
    if (!selectedDate || !selectedSection) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { available, full } = await getTimeSlotStatus(selectedSection, dateStr, bookingType);
    const counts = await getTimeSlotBookings(selectedSection, dateStr, bookingType);
    
    setAvailableSlots(available);
    setFullSlots(full);
    setBookingCounts(counts);
    setSelectedTime(''); // Reset selected time when slots change
  };

  const handleBookingSubmit = async () => {
    if (!selectedDate || !selectedSection || !selectedTime) return;

    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await onBookingCreate(selectedSection, dateStr, selectedTime, bookingType);
      onClose();
    } catch (error) {
      console.error('Error creating booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const canBook = () => {
    if (!availability) {
      console.log('❌ canBook: No availability data');
      return false;
    }

    console.log('🔍 canBook check:', { bookingType, availability });

    if (bookingType === 'videocall') {
      return availability.has_videocall && 
        ((availability.single_videocall_sessions || 0) > 0 || (availability.videocall_packages_available || 0) > 0);
    }

    if (availability.type === 'hypergym') {
      const canBookGym = (availability.available_monthly || 0) > 0;
      console.log('🏋️ Hypergym booking check:', canBookGym, 'available:', availability.available_monthly);
      return canBookGym;
    } else if (availability.type === 'visit_packages') {
      const canBookVisits = (availability.available_visits || 0) > 0;
      console.log('📦 Visit packages booking check:', canBookVisits, 'available:', availability.available_visits);
      return canBookVisits;
    }
    
    console.log('❌ No valid booking type found');
    return false;
  };

  const getLoadingBarColor = (bookingsCount: number, capacity: number) => {
    const percentage = (bookingsCount / capacity) * 100;
    if (percentage === 0) return 'bg-gray-200';
    if (percentage <= 50) return 'bg-[#00ffba]';
    if (percentage <= 80) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  if (!canBook()) {
    return (
      <Card className="rounded-none max-w-md mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Δεν έχεις διαθέσιμες επισκέψεις</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            {bookingType === 'videocall' 
              ? 'Για να κλείσεις videocall, χρειάζεται να έχεις διαθέσιμες βιντεοκλήσεις.'
              : 'Για να κλείσεις ραντεβού, χρειάζεται να έχεις ενεργό πακέτο επισκέψεων ή συνδρομή Hypergym.'
            }
          </p>
          <Button onClick={onClose} className="w-full rounded-none">
            Κλείσιμο
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="rounded-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {bookingType === 'videocall' ? 'Κλείσε Videocall' : 'Κλείσε Ραντεβού'}
            </CardTitle>
            <div className="mt-2">
              {bookingType === 'videocall' && availability?.has_videocall && (
                <Badge variant="outline" className="rounded-none">
                  Videocalls: {(availability.videocall_packages_available || 0) + (availability.single_videocall_sessions || 0)} διαθέσιμες
                </Badge>
              )}
              {bookingType !== 'videocall' && availability?.type === 'hypergym' && (
                <Badge variant="outline" className="rounded-none">
                  Hypergym: {availability.available_monthly}/{availability.total_monthly} διαθέσιμες αυτό το μήνα
                </Badge>
              )}
              {bookingType !== 'videocall' && availability?.type === 'visit_packages' && (
                <Badge variant="outline" className="rounded-none">
                  Επισκέψεις: {availability.available_visits} διαθέσιμες
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
      </Card>

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
              disabled={(date) => date < addDays(new Date(), 0)}
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
                {bookingType === 'videocall' ? 'Χώρος Videocall' : 'Χώρος Γυμναστηρίου'}
              </label>
               <div className="space-y-2">
                {sections.map((section) => (
                    <Button
                      key={section.id}
                      variant={selectedSection === section.id ? "default" : "outline"}
                      className="w-full justify-start rounded-none"
                      onClick={() => setSelectedSection(section.id)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{section.name}</div>
                        {section.description && (
                          <div className="text-xs text-gray-500">{section.description}</div>
                        )}
                      </div>
                    </Button>
                  ))}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && selectedSection && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Διαθέσιμες Ώρες για {format(selectedDate, 'dd/MM/yyyy')}
                </label>
                {(availableSlots.length > 0 || fullSlots.length > 0) ? (
                  <div className="space-y-2">
                    {/* Available slots with loading bars */}
                    {availableSlots.map((time) => {
                      const selectedSection_obj = sections.find(s => s.id === selectedSection);
                      const capacity = selectedSection_obj?.max_capacity || 1;
                      const currentBookings = bookingCounts[time] || 0;
                      
                      return (
                        <div
                          key={time}
                          className={`p-1.5 border rounded-none cursor-pointer transition-colors ${
                            selectedTime === time 
                              ? 'border-[#00ffba] bg-[#00ffba]/10' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedTime(time)}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs font-medium">{time}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {currentBookings}/{capacity}
                            </span>
                          </div>
                          
                          {/* Loading Bar */}
                          <div className="flex gap-0.5">
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
                        </div>
                      );
                    })}
                    
                    {/* Full slots */}
                    {fullSlots.map((time) => {
                      const selectedSection_obj = sections.find(s => s.id === selectedSection);
                      const capacity = selectedSection_obj?.max_capacity || 1;
                      const currentBookings = bookingCounts[time] || capacity;
                      
                      return (
                        <div
                          key={time}
                          className="p-1.5 border border-gray-200 rounded-none opacity-50 cursor-not-allowed"
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs font-medium">{time}</span>
                              <span className="text-xs text-red-600">(Πλήρης)</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {currentBookings}/{capacity}
                            </span>
                          </div>
                          
                          {/* Loading Bar - Full */}
                          <div className="flex gap-0.5">
                            {Array.from({ length: capacity }).map((_, index) => (
                              <div
                                key={index}
                                className="h-1 flex-1 rounded-none bg-red-400"
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Δεν υπάρχουν διαθέσιμες ώρες για αυτή την ημερομηνία
                  </p>
                )}
              </div>
            )}

            {/* Booking Button */}
            <Button
              onClick={handleBookingSubmit}
              disabled={!selectedDate || !selectedSection || !selectedTime || loading}
              className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              {loading ? 'Δημιουργία...' : 'Επιβεβαίωση Ραντεβού'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};