import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Check, X, Clock } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday, isPast, isSameDay } from "date-fns";
import { el } from "date-fns/locale";

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
  attended?: boolean; // null/undefined = not checked, true = attended, false = missed
}

interface WeeklyBookingCalendarProps {
  bookings: BookingSession[];
}

export const WeeklyBookingCalendar: React.FC<WeeklyBookingCalendarProps> = ({ bookings }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start on Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.filter(booking => booking.booking_date === dateStr);
  };

  // Get booking status color and icon
  const getBookingDisplay = (booking: BookingSession, date: Date) => {
    const bookingDateTime = new Date(`${booking.booking_date} ${booking.booking_time}`);
    const isPastBooking = isPast(bookingDateTime);

    if (isPastBooking) {
      if (booking.attended === true) {
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <Check className="w-3 h-3" />,
          label: 'Παρουσία'
        };
      } else if (booking.attended === false) {
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <X className="w-3 h-3" />,
          label: 'Απουσία'
        };
      } else {
        // Past booking but attendance not recorded
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Clock className="w-3 h-3" />,
          label: 'Εκκρεμής'
        };
      }
    } else {
      // Future booking
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Clock className="w-3 h-3" />,
        label: 'Επερχόμενο'
      };
    }
  };

  const dayNames = ['Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ', 'Κυρ'];

  return (
    <Card className="rounded-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Εβδομαδιαίο Πρόγραμμα Κρατήσεων
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
              className="rounded-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentWeek}
              className="rounded-none"
            >
              Σήμερα
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              className="rounded-none"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {format(weekStart, 'dd MMM', { locale: el })} - {format(addDays(weekStart, 6), 'dd MMM yyyy', { locale: el })}
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {weekDays.map((day, index) => (
            <div key={index} className="text-center">
              <div className={`font-medium text-sm p-2 ${isToday(day) ? 'bg-[#00ffba] text-black rounded-none' : 'text-gray-700'}`}>
                {dayNames[index]}
              </div>
              <div className={`text-xs ${isToday(day) ? 'font-bold' : 'text-gray-500'}`}>
                {format(day, 'dd')}
              </div>
            </div>
          ))}
          
          {/* Booking slots */}
          {weekDays.map((day, dayIndex) => {
            const dayBookings = getBookingsForDate(day);
            
            return (
              <div key={dayIndex} className="min-h-[120px] border border-gray-200 rounded-none p-1">
                <div className="space-y-1">
                  {dayBookings.length === 0 ? (
                    <div className="text-center text-gray-400 text-xs py-8">
                      Χωρίς κρατήσεις
                    </div>
                  ) : (
                    dayBookings.map((booking) => {
                      const display = getBookingDisplay(booking, day);
                      
                      return (
                        <div
                          key={booking.id}
                          className={`px-1 py-1 border rounded-none text-xs ${display.color}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {booking.booking_time.slice(0, 5)}
                            </span>
                            {display.icon}
                          </div>
                          <div className="text-xs opacity-80 truncate">
                            {booking.section?.name || 'Τμήμα'}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded-none"></div>
              <span>Επερχόμενο</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded-none"></div>
              <span>Παρουσία</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded-none"></div>
              <span>Απουσία</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-none"></div>
              <span>Εκκρεμής</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};