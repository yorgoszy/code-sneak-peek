import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Camera, Save, X, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from 'react-i18next';

interface UserProfileEditProps {
  userProfile: any;
  onProfileUpdated?: () => void;
}

export const UserProfileEdit = ({ userProfile, onProfileUpdated }: UserProfileEditProps) => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Προφίλ πεδία
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Κωδικός πεδία
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (userProfile) {
      // Χωρίζουμε το name αν περιέχει κενό
      const nameParts = userProfile.name ? userProfile.name.split(' ') : ['', ''];
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setEmail(userProfile.email || '');
      setPhone(userProfile.phone || '');
      setBirthDate(userProfile.birth_date || '');
      setPhotoUrl(userProfile.photo_url || '');
    }
  }, [userProfile]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Έλεγχος αν το αρχείο είναι εικόνα και κάτω από 5MB
      if (!file.type.startsWith('image/')) {
        toast.error('Παρακαλώ επιλέξτε αρχείο εικόνας');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Το αρχείο πρέπει να είναι μικρότερο από 5MB');
        return;
      }

      // Δημιουργία unique filename με το auth uid στο path
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Διαγραφή παλιάς φωτογραφίας αν υπάρχει
      if (photoUrl) {
        try {
          const oldPath = photoUrl.split('/profile-photos/')[1];
          if (oldPath) {
            await supabase.storage
              .from('profile-photos')
              .remove([oldPath]);
          }
        } catch (error) {
          console.log('Could not delete old photo:', error);
        }
      }

      // Upload στο Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Λήψη public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      setPhotoUrl(publicUrl);
      toast.success('Η φωτογραφία ανέβηκε επιτυχώς!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Σφάλμα κατά την ανέβασμα της φωτογραφίας');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !email.trim()) {
      toast.error('Το όνομα και το email είναι υποχρεωτικά');
      return;
    }

    try {
      setLoading(true);

      // Συνδυάζουμε first και last name
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      const updates = {
        name: fullName,
        email: email.trim(),
        phone: phone.trim() || null,
        birth_date: birthDate || null,
        photo_url: photoUrl || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('app_users')
        .update(updates)
        .eq('id', userProfile.id);

      if (error) {
        throw error;
      }

      toast.success('Το προφίλ ενημερώθηκε επιτυχώς!');
      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Σφάλμα κατά την ενημέρωση του προφίλ');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast.error('Παρακαλώ συμπληρώστε όλα τα πεδία κωδικού');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Οι κωδικοί δεν ταιριάζουν');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Ο νέος κωδικός πρέπει να είναι τουλάχιστον 6 χαρακτήρες');
      return;
    }

    try {
      setPasswordLoading(true);

      // Προσπάθεια sign in με τα τρέχοντα στοιχεία για validation
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userProfile.email,
        password: currentPassword
      });

      if (signInError) {
        toast.error('Ο τρέχων κωδικός είναι λάθος');
        return;
      }

      // Αλλαγή κωδικού
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      toast.success('Ο κωδικός ενημερώθηκε επιτυχώς!');
      
      // Καθαρισμός πεδίων κωδικού
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Σφάλμα κατά την αλλαγή κωδικού');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleReset = () => {
    if (userProfile) {
      const nameParts = userProfile.name ? userProfile.name.split(' ') : ['', ''];
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setEmail(userProfile.email || '');
      setPhone(userProfile.phone || '');
      setBirthDate(userProfile.birth_date || '');
      setPhotoUrl(userProfile.photo_url || '');
    }
    
    // Καθαρισμός πεδίων κωδικού
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Έλεγχος αν ο χρήστης μπορεί να επεξεργαστεί το προφίλ
  console.log('🔍 UserProfileEdit Debug:', {
    currentUser: currentUser,
    userProfile: userProfile,
    currentUserId: currentUser?.id,
    userProfileAuthId: userProfile?.auth_user_id,
    currentUserEmail: currentUser?.email,
    userProfileEmail: userProfile?.email,
    isIdMatch: currentUser?.id === userProfile?.auth_user_id,
    isAdmin: currentUser?.email === 'yorgoszy@gmail.com',
    userMetadata: currentUser?.user_metadata
  });

  const canEdit = (currentUser && userProfile && currentUser.id === userProfile.auth_user_id) || 
                  (currentUser && userProfile && currentUser.email === 'yorgoszy@gmail.com') ||
                  (currentUser && userProfile && currentUser.user_metadata?.role === 'admin');

  if (!canEdit) {
    return (
      <Card className="rounded-none">
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            {t('profile.noEditPermission')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{t('sidebar.editProfile')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={photoUrl} alt="Profile photo" />
              <AvatarFallback className="text-xl">
                {firstName.charAt(0)}{lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 bg-[#004aad] hover:bg-[#004aad]/90 text-white rounded-full p-2 cursor-pointer transition-colors">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
          {uploading && (
            <div className="text-sm text-gray-500">
              {t('profile.uploadingPhoto')}
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">{t('profile.firstName')} *</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t('profile.enterFirstName')}
              className="rounded-none"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">{t('profile.lastName')}</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t('profile.enterLastName')}
              className="rounded-none"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('profile.email')} *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('profile.enterEmail')}
              className="rounded-none"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('profile.phone')}</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('profile.enterPhone')}
              className="rounded-none"
              disabled={loading}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="birthDate">{t('profile.birthDate')}</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="rounded-none"
              disabled={loading}
            />
          </div>
        </div>

        {/* Separator */}
        <Separator />

        {/* Password Change Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">{t('profile.changePassword')}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('profile.currentPassword')} *</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('profile.enterCurrentPassword')}
                className="rounded-none"
                disabled={passwordLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('profile.newPassword')} *</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('profile.enterNewPassword')}
                className="rounded-none"
                disabled={passwordLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('profile.confirmPassword')} *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('profile.confirmNewPassword')}
                className="rounded-none"
                disabled={passwordLoading}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleChangePassword}
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              className="bg-[#004aad] hover:bg-[#004aad]/90 text-white rounded-none"
            >
              <Lock className="w-4 h-4 mr-2" />
              {passwordLoading ? t('profile.changing') : t('profile.changePassword')}
            </Button>
          </div>
        </div>

        {/* Separator */}
        <Separator />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading}
            className="rounded-none"
          >
            <X className="w-4 h-4 mr-2" />
            {t('profile.reset')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#004aad] hover:bg-[#004aad]/90 text-white rounded-none"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? t('profile.saving') : t('profile.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};