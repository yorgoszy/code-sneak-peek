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
import { WaitingListButton } from "@/components/user-profile/bookings/WaitingListButton";

interface BookingCalendarProps {
  onBookingCreate: (sectionId: string, date: string, time: string, type: string) => Promise<void>;
  onClose: () => void;
  bookingType: string;
  availability: any;
  userId?: string;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  onBookingCreate,
  onClose,
  bookingType,
  availability,
  userId
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [fullSlots, setFullSlots] = useState<string[]>([]);
  const [bookingCounts, setBookingCounts] = useState<{ [time: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const [disabledDates, setDisabledDates] = useState<Set<string>>(new Set());
  const { sections, getTimeSlotStatus, getTimeSlotBookings } = useBookingSections(bookingType, availability?.allowed_sections, userId);

  // Set default section when sections load
  useEffect(() => {
    if (!sections.some(section => section.id === selectedSection)) {
      setSelectedSection(sections[0]?.id || '');
      setSelectedTime('');
    }
  }, [sections, selectedSection]);

  // Update disabled dates when section changes
  useEffect(() => {
    if (selectedSection) {
      updateDisabledDates();
    }
  }, [selectedSection]);

  // Update available slots when date or section changes
  useEffect(() => {
    if (selectedDate && selectedSection) {
      updateAvailableSlots();
    }
  }, [selectedDate, selectedSection]);

  // Set up realtime updates for booking changes
  useEffect(() => {
    const channel = supabase
      .channel(`user-booking-updates-${Math.random().toString(36).slice(2)}`)
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

  const updateDisabledDates = async () => {
    if (!selectedSection) return;

    const disabled = new Set<string>();
    const selectedSectionObj = sections.find(s => s.id === selectedSection);
    
    // Get subscription end date if it exists
    let subscriptionEndDate: Date | null = null;
    if (availability?.subscription_end_date) {
      subscriptionEndDate = new Date(availability.subscription_end_date);
      console.log('🔍 Subscription end date found:', subscriptionEndDate);
    } else {
      console.log('🔍 No subscription end date - no date restrictions for subscription expiry');
    }
    
    // Check the next 365 days for availability
    for (let i = 0; i < 365; i++) {
      const checkDate = addDays(new Date(), i);
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      let shouldDisable = true; // Start with disabled by default
      
      try {
        // First check: Is this date after subscription expiry?
        if (subscriptionEndDate && checkDate > subscriptionEndDate) {
          console.log('🚫 Date disabled due to subscription expiry:', dateStr);
          shouldDisable = true;
        } else {
          // Second check: Does the section work on this day of the week?
          const sectionAvailableHours = selectedSectionObj?.available_hours;
          if (sectionAvailableHours && typeof sectionAvailableHours === 'object') {
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const currentDayName = dayNames[dayOfWeek];
            
            // Check if this day has any available hours
            const dayHours = sectionAvailableHours[currentDayName];
            const dayHasHours = dayHours && Array.isArray(dayHours) && dayHours.length > 0;
            
            if (dayHasHours) {
              console.log('✅ Section available on', currentDayName, 'for date:', dateStr, 'Hours:', dayHours);
              // Third check: Are there any time slots available?
              if (dayHours.length > 0) {
                shouldDisable = false; // This date should be enabled
              } else {
                console.log('🚫 Date disabled - no time slots:', dateStr);
              }
            } else {
              console.log('🚫 Date disabled - section not available on', currentDayName, ':', dateStr, 'Available hours for section:', sectionAvailableHours);
            }
          } else {
            console.log('🚫 Date disabled - no available hours config:', dateStr);
          }
        }
      } catch (error) {
        console.log('🚫 Date disabled due to error:', dateStr, error);
        shouldDisable = true;
      }
      
      if (shouldDisable) {
        disabled.add(dateStr);
      }
    }
    
    console.log('🔍 Total disabled dates:', disabled.size, 'out of 365');
    setDisabledDates(disabled);
  };

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
    if (!selectedDate || !selectedSection || !selectedTime || !sections.some(section => section.id === selectedSection)) return;

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
        (availability.videocall_subscription || (availability.single_videocall_sessions || 0) > 0 || (availability.videocall_packages_available || 0) > 0);
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
      <div className="bg-white border border-gray-200 rounded-none" style={{ margin: '0' }}>
        <div className="p-6 text-center">
          <X className="h-6 w-6 text-red-500 mx-auto mb-4" />
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {bookingType === 'videocall' 
              ? 'Δεν έχεις διαθέσιμες βιντεοκλήσεις'
              : 'Δεν έχεις διαθέσιμες επισκέψεις'
            }
          </h3>
          
          <p className="text-sm text-gray-600 mb-6">
            {bookingType === 'videocall' 
              ? 'Για να κλείσεις videocall, χρειάζεται να αγοράσεις μια βιντεοκλήση από τις αγορές'
              : 'Για να κλείσεις ραντεβού, χρειάζεται να έχεις διαθέσιμες επισκέψεις'
            }
          </p>
          
          <Button 
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white rounded-none"
          >
            Κλείσε
          </Button>
        </div>
      </div>
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
              <div className="mt-2 space-y-2">
                {/* Διαθέσιμα ραντεβού για τον μήνα */}
                <div className="text-sm text-gray-600">
                  Διαθέσιμα ραντεβού για {format(selectedDate || new Date(), 'MMMM yyyy')}
                </div>
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
              disabled={(date) => {
                if (date < addDays(new Date(), 0)) return true;
                
                // Check if this date is disabled for the selected section
                const dateStr = format(date, 'yyyy-MM-dd');
                if (disabledDates.has(dateStr)) return true;
                
                return false;
              }}
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
                       const isPendingSelection = selectedTime === time;
                       const displayBookings = isPendingSelection ? currentBookings + 1 : currentBookings;
                       
                       return (
                         <div
                           key={time}
                           className={`p-2 border rounded-none cursor-pointer transition-colors ${
                             selectedTime === time 
                               ? 'border-[#00ffba] bg-[#00ffba]/10' 
                               : 'border-gray-200 hover:border-gray-300'
                           }`}
                           onClick={() => setSelectedTime(time)}
                         >
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
                                       index < displayBookings
                                         ? isPendingSelection && index === currentBookings
                                           ? 'bg-orange-400' // Pending selection color
                                           : getLoadingBarColor(currentBookings, capacity)
                                         : 'bg-gray-200'
                                     }`}
                                   />
                                 ))}
                               </div>
                             </div>
                             <span className="text-sm text-gray-500">
                               {displayBookings}/{capacity}
                             </span>
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
                          <div key={time} className="space-y-2">
                            <div className="p-2 border border-gray-200 rounded-none opacity-50 cursor-not-allowed">
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
                            </div>
                            
                            {/* Waiting List Button - for both gym and videocall bookings */}
                            {selectedDate && (
                              <WaitingListButton
                                sectionId={selectedSection}
                                bookingDate={format(selectedDate, 'yyyy-MM-dd')}
                                bookingTime={time}
                                isTimeSlotFull={true}
                                bookingType={bookingType}
                                onStatusChange={updateAvailableSlots}
                              />
                            )}
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
              {loading ? 'Δημιουργία...' : 
                `Κλείσε Ραντεβού (${
                  bookingType === 'videocall' 
                    ? (availability?.videocall_packages_available || 0) + (availability?.single_videocall_sessions || 0)
                    : availability?.type === 'hypergym' 
                      ? availability?.available_monthly || 0
                      : availability?.available_visits || 0
                } διαθέσιμες)`
              }
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};