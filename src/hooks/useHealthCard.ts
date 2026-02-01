import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addYears, differenceInDays, format } from 'date-fns';

interface HealthCard {
  id: string;
  user_id: string;
  image_url: string | null;
  start_date: string;
  end_date: string;
  notification_sent: boolean;
  created_at: string;
  updated_at: string;
}

export const useHealthCard = (userId?: string) => {
  const [healthCard, setHealthCard] = useState<HealthCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthCard = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('health_cards')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setHealthCard(data);
    } catch (err) {
      console.error('Error fetching health card:', err);
      setError(err instanceof Error ? err.message : 'Σφάλμα φόρτωσης κάρτας υγείας');
    } finally {
      setLoading(false);
    }
  };

  const uploadHealthCard = async (file: File, startDate: Date) => {
    if (!userId) return false;

    try {
      setLoading(true);
      setError(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Παρακαλώ επιλέξτε μια εικόνα');
      }

      // Delete old image if exists
      if (healthCard?.image_url) {
        const oldPath = healthCard.image_url.split('/health-cards/')[1];
        if (oldPath) {
          await supabase.storage.from('health-cards').remove([oldPath]);
        }
      }

      // Upload new image
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/health-card-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('health-cards')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('health-cards')
        .getPublicUrl(fileName);

      // Calculate end date (1 year from start date)
      const endDate = addYears(startDate, 1);

      // Upsert health card record
      const { error: upsertError } = await supabase
        .from('health_cards')
        .upsert({
          user_id: userId,
          image_url: publicUrl,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          notification_sent: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) throw upsertError;

      toast.success('Η κάρτα υγείας αποθηκεύτηκε επιτυχώς');
      await fetchHealthCard();
      return true;
    } catch (err) {
      console.error('Error uploading health card:', err);
      setError(err instanceof Error ? err.message : 'Σφάλμα αποθήκευσης κάρτας υγείας');
      toast.error('Σφάλμα αποθήκευσης κάρτας υγείας');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteHealthCard = async () => {
    if (!userId || !healthCard) return false;

    try {
      setLoading(true);

      // Delete image from storage
      if (healthCard.image_url) {
        const oldPath = healthCard.image_url.split('/health-cards/')[1];
        if (oldPath) {
          await supabase.storage.from('health-cards').remove([oldPath]);
        }
      }

      // Delete record
      const { error: deleteError } = await supabase
        .from('health_cards')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      setHealthCard(null);
      toast.success('Η κάρτα υγείας διαγράφηκε');
      return true;
    } catch (err) {
      console.error('Error deleting health card:', err);
      toast.error('Σφάλμα διαγραφής κάρτας υγείας');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (): number | null => {
    if (!healthCard) return null;
    const endDate = new Date(healthCard.end_date);
    const today = new Date();
    return differenceInDays(endDate, today);
  };

  const isExpiringSoon = (): boolean => {
    const daysLeft = getDaysUntilExpiry();
    return daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
  };

  const isExpired = (): boolean => {
    const daysLeft = getDaysUntilExpiry();
    return daysLeft !== null && daysLeft < 0;
  };

  useEffect(() => {
    if (userId) {
      fetchHealthCard();
    }
  }, [userId]);

  return {
    healthCard,
    loading,
    error,
    fetchHealthCard,
    uploadHealthCard,
    deleteHealthCard,
    getDaysUntilExpiry,
    isExpiringSoon,
    isExpired
  };
};
