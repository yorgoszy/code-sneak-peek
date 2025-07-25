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
        .in('status', ['confirmed', 'pending'])
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

    // Check availability before creating booking
    console.log('🔍 Checking availability before creating booking:', { bookingType, availability });
    
    if (!availability) {
      throw new Error('Δεν υπάρχουν διαθέσιμα δεδομένα κράτησης');
    }

    // Validate booking availability
    if (bookingType === 'gym_visit') {
      if (availability.type === 'hypergym') {
        if ((availability.available_monthly || 0) <= 0) {
          throw new Error('Δεν έχεις διαθέσιμες επισκέψεις αυτό το μήνα');
        }
      } else if (availability.type === 'visit_packages') {
        if ((availability.available_visits || 0) <= 0) {
          throw new Error('Δεν έχεις διαθέσιμες επισκέψεις στο πακέτο σου');
        }
      } else {
        throw new Error('Δεν έχεις ενεργή συνδρομή ή πακέτο για κρατήσεις');
      }
    } else if (bookingType === 'videocall') {
      if (!availability.has_videocall || 
          ((availability.single_videocall_sessions || 0) <= 0 && 
           (availability.videocall_packages_available || 0) <= 0)) {
        throw new Error('Δεν έχεις διαθέσιμες βιντεοκλήσεις');
      }
    }

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
        console.log('✅ Visit recorded successfully');
      } catch (visitError) {
        console.error('❌ Error recording visit:', visitError);
        // Delete the booking if visit recording fails
        await supabase.from('booking_sessions').delete().eq('id', data.id);
        throw new Error('Σφάλμα κατά την καταγραφή της επίσκεψης');
      }
    }

    // If it's a videocall, charge the package immediately
    if (bookingType === 'videocall') {
      try {
        await supabase.rpc('record_videocall', {
          p_user_id: userProfile.id,
          p_videocall_type: 'booking',
          p_notes: `Booking ID: ${data.id}`
        });
        console.log('✅ Videocall recorded successfully');
      } catch (videocallError) {
        console.error('❌ Error recording videocall:', videocallError);
        // Delete the booking if videocall recording fails
        await supabase.from('booking_sessions').delete().eq('id', data.id);
        throw new Error('Σφάλμα κατά την καταγραφή της βιντεοκλήσης');
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
      .select('booking_type, user_id, status')
      .eq('id', bookingId)
      .single();

    const { data: canCancel } = await supabase.rpc('can_cancel_booking', {
      booking_id: bookingId
    });

    if (!canCancel) {
      throw new Error('Cannot cancel booking within 12 hours of the scheduled time');
    }

    // Delete the booking instead of updating status
    const { error } = await supabase
      .from('booking_sessions')
      .delete()
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

    // If it's a videocall, return the videocall to the package (since it was charged immediately)
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

    // Send cancellation notification
    try {
      await supabase.functions.invoke('send-videocall-notifications', {
        body: {
          type: 'booking_cancelled',
          bookingId: bookingId,
          userId: booking?.user_id
        }
      });
    } catch (notificationError) {
      console.error('Error sending cancellation notification:', notificationError);
      // Don't throw error here - booking is already cancelled
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