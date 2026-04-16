import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Clock, MapPin, TrendingUp, CalendarDays, BarChart3, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, addDays, startOfMonth, endOfMonth } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

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

const formatTime = (time: string) => {
  return time.length > 5 ? time.substring(0, 5) : time;
};

export const BookingSessionsOverview = () => {
  const isMobile = useIsMobile();
  const [bookings, setBookings] = useState<BookingSession[]>([]);
  const [monthlyBookings, setMonthlyBookings] = useState<BookingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchBookings();
    fetchMonthlyBookings();
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

  const fetchMonthlyBookings = async () => {
    try {
      const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('booking_sessions')
        .select(`
          *,
          section:booking_sections(name, max_capacity),
          app_users(name, email)
        `)
        .gte('booking_date', startDate)
        .lte('booking_date', endDate)
        .eq('status', 'confirmed');

      if (error) throw error;
      setMonthlyBookings((data as any) || []);
    } catch (error) {
      console.error('Error fetching monthly bookings:', error);
    }
  };

  const getBookingsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.filter(booking => booking.booking_date === dateStr);
  };

  const getMostPopularTime = (data: BookingSession[]) => {
    if (data.length === 0) return '-';
    const counts = data.reduce((acc: any, b) => {
      const t = formatTime(b.booking_time);
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort(([,a]: any, [,b]: any) => b - a)[0]?.[0] || '-';
  };

  const getMostPopularSection = (data: BookingSession[]) => {
    if (data.length === 0) return '-';
    const counts = data.reduce((acc: any, b) => {
      acc[b.section.name] = (acc[b.section.name] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort(([,a]: any, [,b]: any) => b - a)[0]?.[0] || '-';
  };

  const getUniqueUsersCount = (data: BookingSession[]) => {
    const uniqueUsers = new Set(data.map(b => b.app_users?.email));
    return uniqueUsers.size;
  };

  // Section breakdown
  const getSectionBreakdown = (data: BookingSession[]) => {
    const counts: { [key: string]: number } = {};
    data.forEach(b => {
      counts[b.section.name] = (counts[b.section.name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / data.length) * 100) }));
  };

  // Time breakdown  
  const getTimeBreakdown = (data: BookingSession[]) => {
    const counts: { [key: string]: number } = {};
    data.forEach(b => {
      const t = formatTime(b.booking_time);
      counts[t] = (counts[t] || 0) + 1;
    });
    const maxCount = Math.max(...Object.values(counts), 1);
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, count]) => ({ time, count, percentage: Math.round((count / maxCount) * 100) }));
  };

  const previousWeek = () => {
    setSelectedDate(new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const nextWeek = () => {
    setSelectedDate(new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  if (loading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  const todayBookings = getBookingsForDay(new Date()).length;
  const weeklyBreakdown = getSectionBreakdown(bookings);
  const timeBreakdown = getTimeBreakdown(bookings);

  return (
    <div className={`space-y-${isMobile ? '4' : '5'}`}>
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button onClick={previousWeek} variant="ghost" size="sm" className="rounded-none">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>Στατιστικά Κρατήσεων</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd/MM')} - {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd/MM/yyyy')}
          </p>
        </div>
        <Button onClick={nextWeek} variant="ghost" size="sm" className="rounded-none">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Key Metrics - Compact Grid */}
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-3`}>
        <Card className="rounded-none border-l-4 border-l-gray-900">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Εβδομάδα</p>
                <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 mt-0.5`}>{bookings.length}</p>
              </div>
              <CalendarDays className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-l-4 border-l-[#00ffba]">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Σήμερα</p>
                <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 mt-0.5`}>{todayBookings}</p>
              </div>
              <Calendar className="w-5 h-5 text-[#00ffba]" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-l-4 border-l-[#cb8954]">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Μήνας</p>
                <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 mt-0.5`}>{monthlyBookings.length}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-[#cb8954]" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-l-4 border-l-[#aca097]">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Μοναδικοί</p>
                <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 mt-0.5`}>{getUniqueUsersCount(bookings)}</p>
              </div>
              <Users className="w-5 h-5 text-[#aca097]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Row */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
        {/* Section Breakdown */}
        <Card className="rounded-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Κατανομή ανά Τμήμα</h3>
            </div>
            {weeklyBreakdown.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">Δεν υπάρχουν δεδομένα</p>
            ) : (
              <div className="space-y-2.5">
                {weeklyBreakdown.map(({ name, count, percentage }) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 truncate max-w-[60%]">{name}</span>
                      <span className="text-xs text-gray-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-none">
                      <div 
                        className="h-full bg-gray-900 rounded-none transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Breakdown */}
        <Card className="rounded-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Κατανομή ανά Ώρα</h3>
            </div>
            {timeBreakdown.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">Δεν υπάρχουν δεδομένα</p>
            ) : (
              <div className="space-y-2">
                {timeBreakdown.map(({ time, count, percentage }) => (
                  <div key={time} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-600 w-10 shrink-0">{time}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-none">
                      <div 
                        className="h-full bg-[#00ffba] rounded-none transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-6 text-right shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Info */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
        <Card className="rounded-none bg-gray-50">
          <CardContent className="p-3 flex items-center gap-3">
            <Clock className="w-4 h-4 text-gray-500 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">Πιο δημοφιλής ώρα</p>
              <p className="text-sm font-bold text-gray-900">{getMostPopularTime(bookings)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none bg-gray-50">
          <CardContent className="p-3 flex items-center gap-3">
            <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">Πιο δημοφιλές τμήμα</p>
              <p className="text-sm font-bold text-gray-900">{getMostPopularSection(bookings)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};