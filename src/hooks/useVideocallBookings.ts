import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useAuth';

interface VideocallBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  booking_type: string;
  notes?: string;
  meeting_link?: string;
  user_id: string;
  section?: {
    name: string;
    description?: string;
  };
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const useVideocallBookings = (isAdmin = false) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<VideocallBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (userProfile || isAdmin) {
      fetchBookings();
    }
  }, [userProfile, isAdmin]);

  const fetchUserProfile = async () => {
    if (!user) return;

    // If on user profile page, get user ID from URL
    const urlPath = window.location.pathname;
    const userIdFromUrl = urlPath.match(/\/dashboard\/user-profile\/([^\/]+)/)?.[1];
    
    if (userIdFromUrl && userIdFromUrl !== 'online-coaching') {
      const { data } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', userIdFromUrl)
        .single();
      if (data) {
        setUserProfile(data);
        return;
      }
    }

    // Fallback to auth user
    const { data } = await supabase
      .from('app_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
    
    if (data) {
      setUserProfile(data);
    }
  };

  const fetchBookings = async () => {
    try {
      let query = supabase
        .from('booking_sessions')
        .select(`
          *,
          section:booking_sections(name, description),
          user:app_users!user_id(first_name, last_name, email)
        `)
        .eq('booking_type', 'videocall')
        .eq('status', 'confirmed')
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      // If not admin, filter by user
      if (!isAdmin && userProfile) {
        query = query.eq('user_id', userProfile.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Generate meeting links for bookings that don't have them
      const bookingsWithLinks = await Promise.all(
        (data || []).map(async (booking: any) => {
          if (!booking.meeting_link) {
            const meetingLink = generateMeetingLink(booking.id);
            
            // Update the booking with the meeting link
            await supabase
              .from('booking_sessions')
              .update({ meeting_link: meetingLink })
              .eq('id', booking.id);
            
            return { ...booking, meeting_link: meetingLink };
          }
          return booking;
        })
      );

      setBookings(bookingsWithLinks);
    } catch (error) {
      console.error('Error fetching videocall bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMeetingLink = (bookingId: string) => {
    // Generate a unique meeting link based on booking ID
    const baseUrl = window.location.origin;
    const roomId = btoa(bookingId).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    return `${baseUrl}/meeting/${roomId}`;
  };

  const joinMeeting = (booking: VideocallBooking) => {
    if (booking.meeting_link) {
      window.open(booking.meeting_link, '_blank');
    }
  };

  return {
    bookings,
    loading,
    fetchBookings,
    joinMeeting
  };
};