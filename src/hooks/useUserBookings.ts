import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useAuth';

interface BookingAvailability {
  type: 'hypergym' | 'visit_packages' | 'videocall' | 'single_videocall' | 'none';
  total_monthly?: number;
  used_monthly?: number;
  available_monthly?: number;
  total_visits?: number;
  used_visits?: number;
  available_visits?: number;
  subscription_name?: string;
  has_videocall?: boolean;
  videocall_subscription?: string;
  single_videocall_sessions?: number;
  has_gym_access?: boolean;
}

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
}

export const useUserBookings = () => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<BookingAvailability | null>(null);
  const [bookings, setBookings] = useState<BookingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      fetchAvailability();
      fetchBookings();
    }
  }, [userProfile]);

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('app_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    setUserProfile(data);
  };

  const fetchAvailability = async () => {
    if (!user || !userProfile) return;

    try {
      const { data } = await supabase.rpc('get_user_available_bookings', {
        user_uuid: userProfile.id
      });

      setAvailability(data as unknown as BookingAvailability);
    } catch (error) {
      console.error('Error fetching booking availability:', error);
    }
  };

  const fetchBookings = async () => {
    if (!user || !userProfile) return;

    try {
      const { data } = await supabase
        .from('booking_sessions')
        .select(`
          *,
          section:booking_sections(name, description)
        `)
        .eq('user_id', userProfile.id)
        .eq('status', 'confirmed')
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .order('booking_date', { ascending: true });

      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (sectionId: string, bookingDate: string, bookingTime: string, bookingType: string) => {
    if (!userProfile) throw new Error('User profile not found');

    const { data, error } = await supabase
      .from('booking_sessions')
      .insert({
        user_id: userProfile.id,
        section_id: sectionId,
        booking_date: bookingDate,
        booking_time: bookingTime,
        booking_type: bookingType,
        status: 'confirmed'
      })
      .select()
      .single();

    if (error) throw error;

    // Refresh data after creating booking
    await Promise.all([fetchAvailability(), fetchBookings()]);
    
    return data;
  };

  const cancelBooking = async (bookingId: string) => {
    const { data: canCancel } = await supabase.rpc('can_cancel_booking', {
      booking_id: bookingId
    });

    if (!canCancel) {
      throw new Error('Cannot cancel booking within 12 hours of the scheduled time');
    }

    const { error } = await supabase
      .from('booking_sessions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) throw error;

    // Refresh data after cancelling
    await Promise.all([fetchAvailability(), fetchBookings()]);
  };

  return {
    availability,
    bookings,
    loading,
    userProfile,
    createBooking,
    cancelBooking,
    refetch: () => Promise.all([fetchAvailability(), fetchBookings()])
  };
};