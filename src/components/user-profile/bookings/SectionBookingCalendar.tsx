import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Check, X, Clock } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday, isPast } from "date-fns";
import { el } from "date-fns/locale";
import { useBookingSections } from "@/hooks/useBookingSections";

interface BookingSession {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  section_id: string;
  booking_type: string;
  notes?: string;
  section?: {
    name: string;
    description?: string;
  };
  attended?: boolean;
}

interface SectionBookingCalendarProps {
  sectionId: string;
  sectionName: string;
  availableHours: any;
  bookings: BookingSession[];
  onCancelBooking?: (bookingId: string) => Promise<void>;
  onCreateBooking?: (sectionId: string, date: string, time: string, type: string) => Promise<void>;
}

export const SectionBookingCalendar: React.FC<SectionBookingCalendarProps> = ({ 
  sectionId,
  sectionName,
  availableHours,
  bookings,
  onCancelBooking,
  onCreateBooking
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());


  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get available time slots for each day
  const getAvailableHoursForDay = (dayIndex: number) => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayIndex];
    return availableHours?.[dayName] || [];
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  // Check if booking can be cancelled (12 hours before)
  const canCancelBooking = (bookingDate: string, bookingTime: string) => {
    const bookingDateTime = new Date(`${bookingDate} ${bookingTime}`);
    const cancellationDeadline = new Date(bookingDateTime.getTime() - 12 * 60 * 60 * 1000);
    return new Date() < cancellationDeadline;
  };

  // Get booking for specific date and time
  const getBookingForSlot = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.find(booking => 
      booking.booking_date === dateStr && 
      booking.booking_time.slice(0, 5) === time && 
      booking.section_id === sectionId
    );
  };

  // Get booking status display
  const getBookingStatusIcon = (booking: BookingSession) => {
    const bookingDateTime = new Date(`${booking.booking_date} ${booking.booking_time}`);
    const isPastBooking = isPast(bookingDateTime);
    const canCancel = canCancelBooking(booking.booking_date, booking.booking_time);

    if (isPastBooking) {
      if (booking.attended === true) {
        return { icon: <Check className="w-3 h-3" />, color: 'text-[#00ffba]' };
      } else if (booking.attended === false) {
        return { icon: <X className="w-3 h-3" />, color: 'text-red-500' };
      }
    }
    
    if (!canCancel) {
      return { icon: <Check className="w-3 h-3" />, color: 'text-gray-400' };
    }
    
    return { icon: <Check className="w-3 h-3" />, color: 'text-blue-500' };
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!onCancelBooking) return;
    
    try {
      await onCancelBooking(bookingId);
    } catch (error: any) {
      console.error('Cancel booking error:', error);
    }
  };

  const dayNames = ['Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ', 'Κυρ'];

  // Get all unique time slots for this section
  const allTimeSlots = new Set<string>();
  weekDays.forEach((_, dayIndex) => {
    const hours = getAvailableHoursForDay(dayIndex);
    hours.forEach((hour: string) => allTimeSlots.add(hour));
  });
  const timeSlotsList = Array.from(allTimeSlots).sort();

  return (
    <Card className="rounded-none mb-6">
      <CardHeader className="p-3 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center text-sm md:text-lg">
            <Clock className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            {sectionName} - Εβδομαδιαίο Πρόγραμμα
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
              className="rounded-none h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              className="rounded-none h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs md:text-sm text-gray-600">
          {format(weekStart, 'dd MMM', { locale: el })} - {format(addDays(weekStart, 6), 'dd MMM yyyy', { locale: el })}
        </p>
      </CardHeader>
      
      <CardContent className="p-3 md:p-6 pt-0">
        <div className="flex gap-2 overflow-x-auto">
          {/* Available Hours List */}
          <div className="flex-shrink-0 w-8 md:w-10">
            <div className="space-y-1">
              <div className="h-12 flex items-center justify-center text-xs font-medium text-gray-700 border-b">
                Ώρες
              </div>
              {timeSlotsList.map((timeSlot) => (
                <div key={timeSlot} className="h-8 flex items-center justify-center text-xs text-gray-600 px-1">
                  {timeSlot.slice(0, 5)}
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {weekDays.map((day, index) => (
                <div key={index} className="text-center flex flex-col items-center justify-center">
                  <div className={`font-medium text-xs py-2 w-full text-center ${isToday(day) ? 'bg-[#00ffba] text-black rounded-none' : 'text-gray-700'}`}>
                    {dayNames[index]}
                  </div>
                  <div className={`text-xs w-full text-center ${isToday(day) ? 'font-bold' : 'text-gray-500'}`}>
                    {format(day, 'dd')}
                  </div>
                </div>
              ))}
              
              {/* Time slots grid */}
              {timeSlotsList.map((timeSlot) => (
                <React.Fragment key={timeSlot}>
                  {weekDays.map((day, dayIndex) => {
                    const dayHours = getAvailableHoursForDay(dayIndex);
                    const isTimeAvailable = dayHours.includes(timeSlot);
                    const booking = getBookingForSlot(day, timeSlot);
                    
                    if (!isTimeAvailable) {
                      return (
                        <div key={`${timeSlot}-${dayIndex}`} className="h-8 bg-white border border-gray-100 rounded-none"></div>
                      );
                    }
                    
                    return (
                      <div key={`${timeSlot}-${dayIndex}`} className="h-8 border border-gray-200 bg-white rounded-none flex items-center justify-center relative group">
                        {booking ? (
                          <div className="flex items-center justify-center w-full h-full">
                            <div className="relative flex items-center justify-center w-full h-full">
                              <div className={getBookingStatusIcon(booking).color}>
                                {getBookingStatusIcon(booking).icon}
                              </div>
                              
                              {/* Cancel button - only show on hover for cancellable bookings */}
                              {canCancelBooking(booking.booking_date, booking.booking_time) && onCancelBooking && (
                                <button
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Ακύρωση ραντεβού"
                                >
                                  <X className="w-2 h-2" />
                                </button>
                              )}
                              
                              {/* Tooltip with booking details */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                {booking.booking_time.slice(0, 5)} - {sectionName}
                                {!canCancelBooking(booking.booking_date, booking.booking_time) && isPast(new Date(`${booking.booking_date} ${booking.booking_time}`)) && (
                                  <div className="text-gray-300">Δεν μπορεί να ακυρωθεί</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Available slot - show booking button
                          <button
                            onClick={() => onCreateBooking?.(sectionId, format(day, 'yyyy-MM-dd'), timeSlot, 'gym_visit')}
                            className="w-full h-full bg-gray-50 hover:bg-[#00ffba]/20 transition-colors text-xs text-gray-600 hover:text-black flex items-center justify-center"
                            title="Κλείσε ραντεβού"
                            disabled={isPast(day)}
                          >
                            +
                          </button>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center space-x-1">
              <Check className="w-3 h-3 text-blue-500" />
              <span>Επερχόμενο</span>
            </div>
            <div className="flex items-center space-x-1">
              <Check className="w-3 h-3 text-[#00ffba]" />
              <span>Παρουσία</span>
            </div>
            <div className="flex items-center space-x-1">
              <X className="w-3 h-3 text-red-500" />
              <span>Απουσία</span>
            </div>
            <div className="flex items-center space-x-1">
              <Check className="w-3 h-3 text-gray-400" />
              <span>Δεν μπορεί να ακυρωθεί</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};