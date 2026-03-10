import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useGoogleCalendar = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const getGoogleToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.provider_token) {
      // No Google token - user needs to connect via Google OAuth
      return null;
    }
    
    return session.provider_token;
  };

  const connectGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar',
          redirectTo: window.location.origin + window.location.pathname,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast.error('Σφάλμα σύνδεσης με Google');
        console.error('Google OAuth error:', error);
        return;
      }

      if (data?.url) {
        // Open in popup to bypass iframe cookie restrictions
        const popup = window.open(data.url, 'google-oauth', 'width=500,height=600,scrollbars=yes');
        
        if (!popup) {
          // Popup blocked - fall back to redirect
          toast.info('Παρακαλώ επιτρέψτε τα popups ή ανοίξτε την εφαρμογή σε νέο tab');
          window.open(window.location.href, '_blank');
          return;
        }

        toast.info('🔗 Ολοκληρώστε τη σύνδεση στο παράθυρο Google...');

        // Poll for popup close and session change
        const pollInterval = setInterval(async () => {
          if (popup.closed) {
            clearInterval(pollInterval);
            // Check if we got a session with provider token
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.provider_token) {
              toast.success('✅ Σύνδεση με Google Calendar επιτυχής!');
              window.location.reload();
            }
          }
        }, 1000);

        // Timeout after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 120000);
      }
    } catch (err) {
      console.error('Google OAuth error:', err);
      toast.error('Σφάλμα σύνδεσης με Google');
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
        toast.info('🔗 Σύνδεση με Google Calendar... Θα ανακατευθυνθείτε στο Google.');
        await connectGoogle();
        return null;
      }

      const startDateTime = `${booking.booking_date}T${booking.booking_time}:00`;
      const endHour = parseInt(booking.booking_time.split(':')[0]) + 1;
      const endTime = `${endHour.toString().padStart(2, '0')}:${booking.booking_time.split(':')[1]}`;
      const endDateTime = `${booking.booking_date}T${endTime}:00`;

      let summary: string;
      if (booking.booking_type === 'competition') {
        summary = `🥊 Αγώνας - ${booking.section_name || ''}`;
      } else if (booking.booking_type === 'videocall') {
        summary = `📹 Βιντεοκλήση - ${booking.section_name || 'HyperKids'}`;
      } else {
        summary = `🏋️ Γυμναστήριο - ${booking.section_name || 'HyperKids'}`;
      }

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
    day_flags?: Array<{
      is_competition_day?: boolean;
      is_test_day?: boolean;
      test_types?: string[];
    }>;
  }) => {
    setIsSyncing(true);
    try {
      const providerToken = await getGoogleToken();
      if (!providerToken) {
        toast.info('🔗 Σύνδεση με Google Calendar... Θα ανακατευθυνθείτε στο Google.');
        await connectGoogle();
        return null;
      }

      const events = training.dates.map((date, index) => {
        const flags = training.day_flags?.[index];
        const dayName = training.day_names?.[index] || `Ημέρα ${index + 1}`;
        
        let summary: string;
        let description: string;
        let startTime = '09:00:00';
        let endTime = '10:00:00';

        if (flags?.is_competition_day) {
          summary = `🥊 Αγώνας - ${training.program_name}`;
          description = `Ημέρα αγώνα: ${dayName}\nΠρόγραμμα: ${training.program_name}`;
          startTime = '09:00:00';
          endTime = '18:00:00';
        } else if (flags?.is_test_day) {
          const testTypesStr = flags.test_types?.length 
            ? flags.test_types.join(', ') 
            : 'Γενικό τεστ';
          summary = `📋 Τεστ - ${training.program_name}`;
          description = `Ημέρα τεστ: ${dayName}\nΤύποι: ${testTypesStr}\nΠρόγραμμα: ${training.program_name}`;
        } else {
          summary = `💪 ${training.program_name} - ${dayName}`;
          description = `Πρόγραμμα προπόνησης: ${training.program_name}`;
        }

        return {
          summary,
          description,
          start_datetime: `${date}T${startTime}`,
          end_datetime: `${date}T${endTime}`,
        };
      });

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
