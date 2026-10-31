import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { canBookSection } from './bookingSectionAccess';

interface BookingSection {
  id: string;
  name: string;
  description?: string;
  max_capacity: number;
  available_hours: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useBookingSections = (bookingType?: string, allowedSections?: string[], userId?: string) => {
  const [sections, setSections] = useState<BookingSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSections();
    
    // Set up realtime subscription for booking_sessions changes
    const channel = supabase
      .channel(`booking-sessions-changes-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_sessions'
        },
        (payload) => {
          console.log('🔄 Booking sessions change detected:', payload);
          // Trigger re-fetch of current data when bookings change
          // This will be handled by the components calling the hook functions
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingType, userId]);

  const fetchSections = async () => {
    try {
      setLoading(true);
      setSections([]);
      let query = supabase
        .from('booking_sections')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (bookingType === 'videocall') {
        let profileQuery = supabase.from('app_users').select('coach_id');
        if (userId) profileQuery = profileQuery.eq('id', userId);
        else {
          const { data: auth } = await supabase.auth.getUser();
          if (!auth.user) return;
          profileQuery = profileQuery.eq('auth_user_id', auth.user.id);
        }
        const { data: profile, error: profileError } = await profileQuery.single();
        if (profileError) throw profileError;
        if (profile.coach_id) {
          const { data: coach, error: coachError } = await supabase.from('app_users').select('role').eq('id', profile.coach_id).single();
          if (coachError) throw coachError;
          query = coach.role === 'admin' ? query.is('coach_id', null) : query.eq('coach_id', profile.coach_id).eq('booking_type', 'videocall');
        } else query = query.is('coach_id', null);
      } else query = query.is('coach_id', null);
      const { data, error } = await query;

      if (error) throw error;
      
      // Filter sections based on booking type and allowed sections
      let filteredData = data || [];
      
      setSections(filteredData);
    } catch (error) {
      console.error('Error fetching booking sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableSlots = async (sectionId: string, date: string) => {
    try {
      // Get the section to check available hours
      const section = sections.find(s => s.id === sectionId);
      if (!section) return [];

      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const availableHours = section.available_hours[dayOfWeek] || [];

      // Get existing bookings for this date and section
      const { data: existingBookings } = await supabase
        .from('booking_sessions')
        .select('booking_time')
        .eq('section_id', sectionId)
        .eq('booking_date', date)
        .in('status', ['confirmed', 'pending']);

      // Count bookings per time slot
      const bookingCounts: { [time: string]: number } = {};
      existingBookings?.forEach(booking => {
        const time = booking.booking_time;
        bookingCounts[time] = (bookingCounts[time] || 0) + 1;
      });

      // Filter available slots based on capacity
      const availableSlots = availableHours.filter((time: string) => {
        const currentBookings = bookingCounts[time] || 0;
        return currentBookings < section.max_capacity;
      });

      return availableSlots;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return [];
    }
  };

  const getTimeSlotStatus = async (sectionId: string, date: string, bookingType?: string) => {
    try {
      // Get the section to check available hours
      const section = sections.find(s => s.id === sectionId);
      if (!section) return { available: [], full: [] };

      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const availableHours = section.available_hours[dayOfWeek] || [];

      if (bookingType === 'videocall') {
        const { data, error } = await supabase.rpc('get_coaching_slot_counts', { p_section: sectionId, p_date: date });
        if (error) throw error;
        const occupied = new Set((data || []).map(slot => slot.booking_time.slice(0, 5)));
        return { available: availableHours.filter((time: string) => !occupied.has(time)), full: availableHours.filter((time: string) => occupied.has(time)) };
      }

      // Get existing confirmed bookings for this date and section (matching admin panel logic)
      let query = supabase
        .from('booking_sessions')
        .select('booking_time, booking_type')
        .eq('section_id', sectionId)
        .eq('booking_date', date)
        .eq('status', 'confirmed'); // Only count confirmed bookings like admin panel

      const { data: existingBookings } = await query;

      // Count bookings per time slot
      const bookingCounts: { [time: string]: number } = {};
      const videocallTimes: Set<string> = new Set();
      
      existingBookings?.forEach(booking => {
        // Handle both "HH:MM" and "HH:MM:SS" formats to match admin panel
        const time = booking.booking_time.length > 5 
          ? booking.booking_time.substring(0, 5) 
          : booking.booking_time;
        bookingCounts[time] = (bookingCounts[time] || 0) + 1;
        
        // Track times that already have videocalls
        if (booking.booking_type === 'videocall') {
          videocallTimes.add(time);
        }
      });

      // Categorize slots
      const available: string[] = [];
      const full: string[] = [];

      availableHours.forEach((time: string) => {
        const currentBookings = bookingCounts[time] || 0;
        
        if (bookingType === 'videocall') {
          // For videocalls, if there's already a videocall at this time, it's full
          if (videocallTimes.has(time)) {
            full.push(time);
          } else {
            available.push(time);
          }
        } else {
          // For gym visits, use normal capacity check
          if (currentBookings >= section.max_capacity) {
            full.push(time);
          } else {
            available.push(time);
          }
        }
      });

      return { available, full };
    } catch (error) {
      console.error('Error fetching time slot status:', error);
      return { available: [], full: [] };
    }
  };

  const getTimeSlotBookings = async (sectionId: string, date: string, bookingType?: string) => {
    try {
      if (bookingType === 'videocall') {
        const { data, error } = await supabase.rpc('get_coaching_slot_counts', { p_section: sectionId, p_date: date });
        if (error) throw error;
        return Object.fromEntries((data || []).map(slot => [slot.booking_time.slice(0, 5), Number(slot.booking_count)]));
      }
      const section = sections.find(s => s.id === sectionId);
      if (!section) return {};

      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const availableHours = section.available_hours[dayOfWeek] || [];

      // Get ALL confirmed bookings for this time slot to show accurate counts (matching admin panel)
      let query = supabase
        .from('booking_sessions')
        .select('booking_time, booking_type, status')
        .eq('section_id', sectionId)
        .eq('booking_date', date)
        .eq('status', 'confirmed'); // Only count confirmed bookings like admin panel

      const { data: existingBookings } = await query;

      const bookingCounts: { [time: string]: number } = {};
      
      existingBookings?.forEach(booking => {
        // Handle both "HH:MM" and "HH:MM:SS" formats
        const time = booking.booking_time.length > 5 
          ? booking.booking_time.substring(0, 5) 
          : booking.booking_time;
        bookingCounts[time] = (bookingCounts[time] || 0) + 1;
      });

      return bookingCounts;
    } catch (error) {
      console.error('Error fetching time slot bookings:', error);
      return {};
    }
  };

  return {
    // Filter during render so late-arriving or changed availability is respected.
    sections: sections.filter(section => {
      if (bookingType !== 'videocall' && !canBookSection(section.id, allowedSections)) return false;
      if (!bookingType) return true;
      const text = `${section.name} ${section.description || ''}`.toLowerCase();
      const isVideocall = ['videocall', 'online', 'βιντεοκλήσεις', 'βιντεοκληση'].some(term => text.includes(term));
      return bookingType === 'videocall' ? isVideocall : !isVideocall;
    }),
    loading,
    getAvailableSlots,
    getTimeSlotStatus,
    getTimeSlotBookings,
    refetch: fetchSections
  };
};