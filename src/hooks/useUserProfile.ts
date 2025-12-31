import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { processAvatarImage } from '@/utils/imageProcessing';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  birth_date?: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  auth_user_id: string;
}

export const useUserProfile = (userId?: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('app_users')
        .select('id, name, email, birth_date, phone, avatar_url, role, auth_user_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setProfile(data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err.message : 'Αδυναμία φόρτωσης προφίλ');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return false;

    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('app_users')
        .update(updates)
        .eq('id', profile.id);

      if (updateError) {
        throw updateError;
      }

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Αδυναμία ενημέρωσης προφίλ');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!profile) return null;

    try {
      setLoading(true);
      setError(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Παρακαλώ επιλέξτε μια εικόνα');
      }

      // Process the image (crop to square, resize, compress)
      const processed = await processAvatarImage(file);
      
      // Create unique filename (always .jpg after processing)
      const fileName = `${profile.id}/avatar.jpg`;

      // Delete existing avatar if any
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${profile.id}/${oldPath}`]);
        }
      }

      // Upload processed avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, processed.blob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const updated = await updateProfile({ avatar_url: publicUrl });
      
      return updated ? publicUrl : null;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err instanceof Error ? err.message : 'Αδυναμία ανεβάσματος φωτογραφίας');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (newPassword: string, currentPassword?: string) => {
    if (!profile) return false;

    try {
      setLoading(true);
      setError(null);

      if (newPassword.length < 6) {
        throw new Error('Ο κωδικός πρόσβασης πρέπει να έχει τουλάχιστον 6 χαρακτήρες');
      }

      // Use Supabase admin API to update password
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        profile.auth_user_id,
        { password: newPassword }
      );

      if (passwordError) throw passwordError;

      return true;
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err instanceof Error ? err.message : 'Αδυναμία αλλαγής κωδικού');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    }
  }, [userId]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
    setError
  };
};