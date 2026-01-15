import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface GymBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  booking_type: string;
  section_id: string;
  section?: {
    name: string;
    max_capacity: number;
  };
}

interface BookingSection {
  id: string;
  name: string;
  max_capacity: number;
  available_hours: any;
}

interface LiveProgramSectionProps {
  translations: {
    [key: string]: string;
  };
}

const LiveProgramSection: React.FC<LiveProgramSectionProps> = ({ translations }) => {
  const [sections, setSections] = useState<BookingSection[]>([]);
  const [weekBookings, setWeekBookings] = useState<{ [key: string]: GymBooking[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  
  const isMobile = useIsMobile();
  const currentWeek = new Date();

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    if (sections.length > 0) {
      fetchWeekBookings();
    }
  }, [sections]);

  // Set selected day to today's weekday on mount
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    setSelectedDayIndex(adjustedDay);
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_sections')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
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
    if (sections.length === 0) return;

    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
      const allSectionIds = sections.map(s => s.id);
      
      const { data: existingBookings, error } = await supabase
        .from('booking_sessions')
        .select(`
          *,
          section:booking_sections(name, max_capacity)
        `)
        .in('section_id', allSectionIds)
        .gte('booking_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('booking_date', format(weekEnd, 'yyyy-MM-dd'))
        .eq('booking_type', 'gym_visit')
        .eq('status', 'confirmed')
        .order('booking_time', { ascending: true });

      if (error) throw error;

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
    if (percentage === 0) return 'bg-gray-300';
    if (percentage <= 50) return 'bg-[#cb8954]';
    if (percentage <= 80) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const getAllTimes = () => {
    const allTimes = new Set<string>();
    sections.forEach(section => {
      Object.values(section.available_hours || {}).forEach((hours: any) => {
        (hours as string[]).forEach(h => allTimes.add(h));
      });
    });
    return Array.from(allTimes).sort();
  };

  if (loading || sections.length === 0) {
    return null;
  }

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(currentWeek, { weekStartsOn: 1 })
  });

  const dayNames = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];
  const sortedTimes = getAllTimes();

  // Mobile View
  if (isMobile) {
    const selectedDay = weekDays[selectedDayIndex];
    const selectedDateStr = format(selectedDay, 'yyyy-MM-dd');
    const dayOfWeek = selectedDay.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    return (
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Robert Pro, sans-serif', color: '#aca097' }}>
              Live Program
            </h2>
            <div className="w-16 h-1 mx-auto mb-4" style={{ backgroundColor: '#aca097' }}></div>
            <p className="text-sm" style={{ color: '#aca097' }}>
              {format(weekStart, 'dd/MM')} - {format(weekDays[6], 'dd/MM')}
            </p>
          </div>

          {/* Day Selector - Compact for mobile */}
          <div className="flex gap-1 mb-4 justify-center">
            {weekDays.map((day, index) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayBookings = weekBookings[dateStr] || [];
              const hasBookings = dayBookings.length > 0;
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const isSelected = index === selectedDayIndex;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDayIndex(index)}
                  className={cn(
                    "flex-1 min-w-0 py-1.5 px-0.5 border rounded-none transition-all",
                    isSelected 
                      ? "border-[#cb8954] bg-[#cb8954]/20" 
                      : hasBookings 
                        ? "border-gray-600 bg-gray-900"
                        : "border-gray-700 bg-gray-800"
                  )}
                >
                  <div className={cn(
                    "text-[9px] font-medium",
                    isToday ? "text-[#cb8954]" : isSelected ? "text-[#cb8954]" : "text-gray-400"
                  )}>
                    {dayNames[index]}
                  </div>
                  <div className={cn(
                    "text-[11px] font-bold",
                    isToday ? "text-[#cb8954]" : isSelected ? "text-white" : "text-gray-300"
                  )}>
                    {format(day, 'dd')}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Time Slots - Compact layout */}
          <div className="space-y-1">
            {sortedTimes.map((time) => {
              const sectionsForSlot = sections.filter(s => {
                const sectionHours = s.available_hours?.[dayOfWeek] || [];
                return sectionHours.includes(time);
              });

              if (sectionsForSlot.length === 0) return null;

              const dayBookings = weekBookings[selectedDateStr] || [];

              return (
                <div key={time} className="space-y-1">
                  {sectionsForSlot.map((section) => {
                    const slotBookings = dayBookings.filter(booking => {
                      const bookingTime = booking.booking_time.length > 5 
                        ? booking.booking_time.substring(0, 5) 
                        : booking.booking_time;
                      return bookingTime === time && booking.section_id === section.id;
                    });

                    const currentBookings = slotBookings.length;
                    const capacity = section.max_capacity;

                    return (
                      <div 
                        key={section.id} 
                        className="flex items-center gap-2 px-2 py-1.5 rounded-none bg-gray-900 border border-gray-700"
                      >
                        <span className="text-[10px] font-semibold text-[#cb8954] w-10 flex-shrink-0">{time}</span>
                        <span className="text-[10px] font-medium text-gray-300 truncate flex-1 min-w-0">
                          {section.name}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0 w-20">
                          <div className="flex-1 h-1.5 bg-gray-700 rounded-none overflow-hidden">
                            <div
                              className={`h-full transition-all ${getLoadingBarColor(currentBookings, capacity)}`}
                              style={{ width: `${capacity > 0 ? (currentBookings / capacity) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-gray-400 font-medium">
                            {currentBookings}/{capacity}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Desktop View
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Robert Pro, sans-serif', color: '#aca097' }}>
            Live Program
          </h2>
          <div className="w-16 h-1 mx-auto mb-4" style={{ backgroundColor: '#aca097' }}></div>
          <p style={{ color: '#aca097' }}>
            {format(weekStart, 'dd/MM')} - {format(weekDays[6], 'dd/MM')}
          </p>
        </div>

        {/* Weekly Grid */}
        <div className="space-y-1 overflow-x-auto">
          {/* Header Row */}
          <div className="grid grid-cols-8 gap-1 min-w-[800px]">
            <div className="text-xs font-medium text-gray-500 p-2"></div>
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayBookings = weekBookings[dateStr] || [];
              const hasBookings = dayBookings.length > 0;
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              return (
                  <div 
                    key={dateStr} 
                    className={cn(
                      "text-center p-2 border rounded-none",
                      hasBookings ? 'bg-black border-gray-700' : 'bg-black border-gray-700'
                    )}
                  >
                    <div className={cn(
                      "font-medium text-xs",
                      isToday ? "text-[#cb8954]" : "text-gray-300"
                    )}>
                    {dayNames[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                  </div>
                  <div className={cn(
                    "text-sm font-bold",
                    isToday ? "text-[#cb8954]" : "text-white"
                  )}>
                    {format(day, 'dd/MM')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Rows */}
          {sortedTimes.map((time) => (
            <div key={time} className="grid grid-cols-8 gap-1 min-w-[800px]">
              <div className="bg-black border border-gray-700 rounded-none p-2 flex items-center justify-center">
                <span className="text-xs font-medium text-[#cb8954]">{time}</span>
              </div>

              {weekDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayOfWeek = day.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                
                const sectionsForSlot = sections.filter(s => {
                  const sectionHours = s.available_hours?.[dayOfWeek] || [];
                  return sectionHours.includes(time);
                });

                if (sectionsForSlot.length === 0) {
                  return (
                    <div key={dateStr} className="bg-black/50 border border-gray-800 rounded-none p-1" />
                  );
                }

                const dayBookings = weekBookings[dateStr] || [];

                return (
                  <div key={dateStr} className="border border-gray-700 rounded-none bg-black p-1 space-y-1">
                    {sectionsForSlot.map((section) => {
                      const slotBookings = dayBookings.filter(booking => {
                        const bookingTime = booking.booking_time.length > 5 
                          ? booking.booking_time.substring(0, 5) 
                          : booking.booking_time;
                        return bookingTime === time && booking.section_id === section.id;
                      });

                      const currentBookings = slotBookings.length;
                      const capacity = section.max_capacity;
                      const isHovered = hoveredSection === section.id;

                      return (
                        <div 
                          key={section.id} 
                          className={cn(
                            "space-y-0.5 p-1 rounded-none transition-all cursor-pointer",
                            isHovered
                              ? 'bg-[#cb8954]/20 border border-[#cb8954]'
                              : 'bg-gray-900 border border-gray-700 hover:bg-gray-800'
                          )}
                          onMouseEnter={() => setHoveredSection(section.id)}
                          onMouseLeave={() => setHoveredSection(null)}
                        >
                          <div className={cn(
                            "text-[9px] font-medium truncate",
                            isHovered ? 'text-white' : 'text-gray-400'
                          )}>
                            {section.name}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <div className="flex-1 h-1.5 bg-gray-700 rounded-none overflow-hidden">
                              <div
                                className={`h-full transition-all ${getLoadingBarColor(currentBookings, capacity)}`}
                                style={{ width: `${capacity > 0 ? (currentBookings / capacity) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-[9px] flex-shrink-0 text-gray-500">
                              {currentBookings}/{capacity}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveProgramSection;
