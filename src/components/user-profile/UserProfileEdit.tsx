import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface UserProfileEditProps {
  userProfile: any;
  onProfileUpdated?: () => void;
}

export const UserProfileEdit = ({ userProfile, onProfileUpdated }: UserProfileEditProps) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Χωρίζουμε το name σε first και last name
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

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
      
      // Δημιουργία unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload στο Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Λήψη public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
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
  };

  // Έλεγχος αν ο χρήστης μπορεί να επεξεργαστεί το προφίλ
  const canEdit = currentUser?.email === userProfile?.email || 
                 currentUser && userProfile && 
                 currentUser.user_metadata?.role === 'admin';

  if (!canEdit) {
    return (
      <Card className="rounded-none">
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            Δεν έχετε δικαίωμα επεξεργασίας αυτού του προφίλ
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Επεξεργασία Προφίλ</CardTitle>
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
            <label className="absolute bottom-0 right-0 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-full p-2 cursor-pointer transition-colors">
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
              Ανέβασμα φωτογραφίας...
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Όνομα *</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Εισάγετε το όνομα"
              className="rounded-none"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Επώνυμο</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Εισάγετε το επώνυμο"
              className="rounded-none"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Εισάγετε το email"
              className="rounded-none"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Τηλέφωνο</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Εισάγετε το τηλέφωνο"
              className="rounded-none"
              disabled={loading}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="birthDate">Ημερομηνία Γέννησης</Label>
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

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading}
            className="rounded-none"
          >
            <X className="w-4 h-4 mr-2" />
            Επαναφορά
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};