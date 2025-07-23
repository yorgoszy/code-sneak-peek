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
  videocall_packages_available?: number;
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
    if (!user) {
      console.log('🚫 fetchUserProfile: No user found');
      return;
    }

    console.log('🔄 Fetching user profile for auth_user_id:', user.id);
    
    // First try to get from URL if we're on a user profile page
    const urlPath = window.location.pathname;
    const userIdFromUrl = urlPath.match(/\/dashboard\/user-profile\/([^\/]+)/)?.[1];
    
    if (userIdFromUrl && userIdFromUrl !== 'online-booking' && userIdFromUrl !== 'shop') {
      console.log('🔄 Using user ID from URL:', userIdFromUrl);
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', userIdFromUrl)
        .single();

      if (!error && data) {
        console.log('✅ User profile found from URL:', data);
        setUserProfile(data);
        return;
      }
    }

    // Fallback to auth user
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (error) {
      console.error('❌ Error fetching user profile:', error);
      return;
    }

    console.log('✅ User profile found:', data);
    setUserProfile(data);
  };

  const fetchAvailability = async () => {
    if (!user || !userProfile) {
      console.log('🚫 fetchAvailability: Missing user or userProfile', { user: !!user, userProfile: !!userProfile });
      return;
    }

    try {
      console.log('🔄 Fetching booking availability for user:', userProfile.id);
      const { data, error } = await supabase.rpc('get_user_available_bookings', {
        user_uuid: userProfile.id
      });

      if (error) {
        console.error('❌ RPC error:', error);
        throw error;
      }

      console.log('✅ Availability data received:', data);
      
      // Refresh component after successful fetch
      setAvailability(data as unknown as BookingAvailability);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching booking availability:', error);
      setLoading(false);
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
        status: bookingType === 'videocall' ? 'pending' : 'confirmed'
      })
      .select()
      .single();

    if (error) throw error;

    // If it's a gym visit, deduct from visit package using the existing function
    if (bookingType === 'gym_visit') {
      try {
        await supabase.rpc('record_visit', {
          p_user_id: userProfile.id,
          p_visit_type: 'booking',
          p_notes: `Booking ID: ${data.id}`
        });
      } catch (visitError) {
        console.error('Error recording visit:', visitError);
        // Still continue since the booking was created successfully
      }
    }

    // If it's a videocall and status is confirmed, deduct from videocall package
    if (bookingType === 'videocall' && data.status === 'confirmed') {
      try {
        await supabase.rpc('record_videocall', {
          p_user_id: userProfile.id,
          p_videocall_type: 'booking',
          p_notes: `Booking ID: ${data.id}`
        });
      } catch (videocallError) {
        console.error('Error recording videocall:', videocallError);
      }
    }

    // Refresh data after creating booking
    await Promise.all([fetchAvailability(), fetchBookings()]);
    
    return data;
  };

  const cancelBooking = async (bookingId: string) => {
    // First get the booking details
    const { data: booking } = await supabase
      .from('booking_sessions')
      .select('booking_type, user_id')
      .eq('id', bookingId)
      .single();

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

    // If it's a gym visit, return the visit to the package
    if (booking?.booking_type === 'gym_visit' && booking?.user_id) {
      try {
        // Get the current visit package
        const { data: visitPackage } = await supabase
          .from('visit_packages')
          .select('remaining_visits')
          .eq('user_id', booking.user_id)
          .in('status', ['active', 'used'])
          .order('purchase_date', { ascending: false })
          .limit(1)
          .single();

        if (visitPackage) {
          // Update the visit package
          const { error: visitError } = await supabase
            .from('visit_packages')
            .update({ 
              remaining_visits: visitPackage.remaining_visits + 1,
              updated_at: new Date().toISOString(),
              status: 'active'
            })
            .eq('user_id', booking.user_id)
            .in('status', ['active', 'used'])
            .order('purchase_date', { ascending: false })
            .limit(1);

          if (visitError) {
            console.error('Error returning visit to package:', visitError);
          }
        }

        // Also delete the visit record if it exists
        await supabase
          .from('user_visits')
          .delete()
          .ilike('notes', `%Booking ID: ${bookingId}%`);

      } catch (visitError) {
        console.error('Error handling visit return:', visitError);
      }
    }

    // If it's a videocall, return the videocall to the package
    if (booking?.booking_type === 'videocall' && booking?.user_id) {
      try {
        // Get the current videocall package
        const { data: videocallPackage } = await supabase
          .from('videocall_packages')
          .select('remaining_videocalls')
          .eq('user_id', booking.user_id)
          .eq('status', 'active')
          .order('purchase_date', { ascending: false })
          .limit(1)
          .single();

        if (videocallPackage) {
          // Update the videocall package
          const { error: videocallError } = await supabase
            .from('videocall_packages')
            .update({ 
              remaining_videocalls: videocallPackage.remaining_videocalls + 1,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', booking.user_id)
            .eq('status', 'active')
            .order('purchase_date', { ascending: false })
            .limit(1);

          if (videocallError) {
            console.error('Error returning videocall to package:', videocallError);
          }
        }

        // Also delete the videocall record if it exists
        await supabase
          .from('user_videocalls')
          .delete()
          .ilike('notes', `%Booking ID: ${bookingId}%`);

      } catch (videocallError) {
        console.error('Error handling videocall return:', videocallError);
      }
    }

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