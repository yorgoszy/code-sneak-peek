import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface WaitingListEntry {
  id: string;
  user_id: string;
  section_id: string;
  booking_date: string;
  booking_time: string;
  position: number;
  status: string;
  created_at: string;
}

interface WaitingListStats {
  position: number | null;
  total_waiting: number;
  is_waiting: boolean;
}

export const useWaitingList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('app_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
    
    if (data) {
      setUserProfile(data);
    }
  };

  const joinWaitingList = async (
    sectionId: string, 
    bookingDate: string, 
    bookingTime: string
  ): Promise<boolean> => {
    if (!userProfile) {
      toast({
        title: "Σφάλμα",
        description: "Δεν βρέθηκε το προφίλ χρήστη",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('join_waiting_list', {
        p_user_id: userProfile.id,
        p_section_id: sectionId,
        p_booking_date: bookingDate,
        p_booking_time: bookingTime
      });

      if (error) {
        console.error('Error joining waiting list:', error);
        toast({
          title: "Σφάλμα",
          description: error.message.includes('already in the waiting list') 
            ? "Είστε ήδη στη λίστα αναμονής για αυτή την ώρα" 
            : "Σφάλμα κατά την προσθήκη στη λίστα αναμονής",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Επιτυχία!",
        description: "Προστεθήκατε στη λίστα αναμονής. Θα ειδοποιηθείτε όταν ελευθερωθεί θέση.",
        variant: "default",
      });

      return true;
    } catch (error) {
      console.error('Error joining waiting list:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά την προσθήκη στη λίστα αναμονής",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const leaveWaitingList = async (
    sectionId: string, 
    bookingDate: string, 
    bookingTime: string
  ): Promise<boolean> => {
    if (!userProfile) {
      toast({
        title: "Σφάλμα",
        description: "Δεν βρέθηκε το προφίλ χρήστη",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('leave_waiting_list', {
        p_user_id: userProfile.id,
        p_section_id: sectionId,
        p_booking_date: bookingDate,
        p_booking_time: bookingTime
      });

      if (error) {
        console.error('Error leaving waiting list:', error);
        toast({
          title: "Σφάλμα",
          description: "Σφάλμα κατά την αφαίρεση από τη λίστα αναμονής",
          variant: "destructive",
        });
        return false;
      }

      if (!data) {
        toast({
          title: "Πληροφορία",
          description: "Δεν βρισκόσασταν στη λίστα αναμονής για αυτή την ώρα",
          variant: "default",
        });
        return false;
      }

      toast({
        title: "Επιτυχία!",
        description: "Αφαιρεθήκατε από τη λίστα αναμονής",
        variant: "default",
      });

      return true;
    } catch (error) {
      console.error('Error leaving waiting list:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά την αφαίρεση από τη λίστα αναμονής",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getWaitingListStatus = async (
    sectionId: string, 
    bookingDate: string, 
    bookingTime: string
  ): Promise<WaitingListStats> => {
    if (!userProfile) {
      return { position: null, total_waiting: 0, is_waiting: false };
    }

    try {
      // Check if user is in waiting list
      const { data: userEntry } = await supabase
        .from('booking_waiting_list')
        .select('position')
        .eq('user_id', userProfile.id)
        .eq('section_id', sectionId)
        .eq('booking_date', bookingDate)
        .eq('booking_time', bookingTime)
        .eq('status', 'waiting')
        .single();

      // Get total waiting
      const { count: totalWaiting } = await supabase
        .from('booking_waiting_list')
        .select('*', { count: 'exact' })
        .eq('section_id', sectionId)
        .eq('booking_date', bookingDate)
        .eq('booking_time', bookingTime)
        .eq('status', 'waiting');

      return {
        position: userEntry?.position || null,
        total_waiting: totalWaiting || 0,
        is_waiting: !!userEntry
      };
    } catch (error) {
      console.error('Error getting waiting list status:', error);
      return { position: null, total_waiting: 0, is_waiting: false };
    }
  };

  const getUserWaitingListEntries = async (): Promise<WaitingListEntry[]> => {
    if (!userProfile) return [];

    try {
      const { data, error } = await supabase
        .from('booking_waiting_list')
        .select(`
          *,
          booking_sections!fk_waiting_list_section(name)
        `)
        .eq('user_id', userProfile.id)
        .eq('status', 'waiting')
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (error) {
        console.error('Error fetching user waiting list entries:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user waiting list entries:', error);
      return [];
    }
  };

  return {
    loading,
    joinWaitingList,
    leaveWaitingList,
    getWaitingListStatus,
    getUserWaitingListEntries
  };
};