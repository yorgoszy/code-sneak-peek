import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

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

export const useBookingSections = () => {
  const [sections, setSections] = useState<BookingSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_sections')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSections(data || []);
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
        .eq('status', 'confirmed');

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

  return {
    sections,
    loading,
    getAvailableSlots,
    refetch: fetchSections
  };
};