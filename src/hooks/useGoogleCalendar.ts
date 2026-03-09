import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useGoogleCalendar = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const getGoogleToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.provider_token) {
      // Need to re-auth with Google to get calendar access
      toast.error('Πρέπει να συνδεθείτε με Google για sync ημερολογίου');
      return null;
    }
    
    return session.provider_token;
  };

  const connectGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar',
        redirectTo: window.location.origin + window.location.pathname,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      toast.error('Σφάλμα σύνδεσης με Google');
      console.error('Google OAuth error:', error);
    }
  };

  const syncBookingToCalendar = async (booking: {
    booking_date: string;
    booking_time: string;
    booking_type: string;
    section_name?: string;
    notes?: string;
  }) => {
    setIsSyncing(true);
    try {
      const providerToken = await getGoogleToken();
      if (!providerToken) {
        await connectGoogle();
        return null;
      }

      const startDateTime = `${booking.booking_date}T${booking.booking_time}:00`;
      const endHour = parseInt(booking.booking_time.split(':')[0]) + 1;
      const endTime = `${endHour.toString().padStart(2, '0')}:${booking.booking_time.split(':')[1]}`;
      const endDateTime = `${booking.booking_date}T${endTime}:00`;

      const summary = booking.booking_type === 'videocall' 
        ? `📹 Βιντεοκλήση - ${booking.section_name || 'HyperKids'}`
        : `🏋️ Γυμναστήριο - ${booking.section_name || 'HyperKids'}`;

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'create_event',
          provider_token: providerToken,
          event: {
            summary,
            description: booking.notes || `Κράτηση ${booking.booking_type === 'videocall' ? 'βιντεοκλήσης' : 'γυμναστηρίου'}`,
            start_datetime: startDateTime,
            end_datetime: endDateTime,
          },
        },
      });

      if (error) throw error;
      if (data?.code === 'NO_GOOGLE_TOKEN') {
        await connectGoogle();
        return null;
      }

      toast.success('✅ Η κράτηση προστέθηκε στο Google Calendar');
      return data;
    } catch (error) {
      console.error('Calendar sync error:', error);
      toast.error('Σφάλμα κατά το sync με Google Calendar');
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncTrainingToCalendar = async (training: {
    dates: string[];
    program_name: string;
    day_names?: string[];
  }) => {
    setIsSyncing(true);
    try {
      const providerToken = await getGoogleToken();
      if (!providerToken) {
        await connectGoogle();
        return null;
      }

      const events = training.dates.map((date, index) => ({
        summary: `💪 ${training.program_name} - ${training.day_names?.[index] || `Ημέρα ${index + 1}`}`,
        description: `Πρόγραμμα προπόνησης: ${training.program_name}`,
        start_datetime: `${date}T09:00:00`,
        end_datetime: `${date}T10:00:00`,
      }));

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'create_multiple',
          provider_token: providerToken,
          events,
        },
      });

      if (error) throw error;
      if (data?.code === 'NO_GOOGLE_TOKEN') {
        await connectGoogle();
        return null;
      }

      toast.success(`✅ ${data?.created || 0} προπονήσεις προστέθηκαν στο Google Calendar`);
      return data;
    } catch (error) {
      console.error('Calendar sync error:', error);
      toast.error('Σφάλμα κατά το sync προπονήσεων');
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    connectGoogle,
    syncBookingToCalendar,
    syncTrainingToCalendar,
  };
};
