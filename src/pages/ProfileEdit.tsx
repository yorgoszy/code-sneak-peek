import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Upload, Eye, EyeOff } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  birth_date?: string;
  phone?: string;
  avatar_url?: string;
}

export default function ProfileEdit() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birth_date: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Check if current user can edit this profile
  const canEdit = currentUser?.role === 'admin' || currentUser?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email, birth_date, phone, avatar_url')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setUserProfile(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          birth_date: data.birth_date || '',
          phone: data.phone || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Σφάλμα",
        description: "Αδυναμία φόρτωσης προφίλ χρήστη",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    try {
      setUploading(true);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Σφάλμα",
          description: "Παρακαλώ επιλέξτε μια εικόνα",
          variant: "destructive"
        });
        return;
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      // Delete existing avatar if any
      if (userProfile?.avatar_url) {
        const oldPath = userProfile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${userId}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('app_users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setUserProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);

      toast({
        title: "Επιτυχία",
        description: "Η φωτογραφία προφίλ ενημερώθηκε",
      });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Σφάλμα",
        description: "Αδυναμία ανεβάσματος φωτογραφίας",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // Update basic profile info
      const { error: profileError } = await supabase
        .from('app_users')
        .update({
          name: formData.name,
          email: formData.email,
          birth_date: formData.birth_date || null,
          phone: formData.phone || null
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Handle password change if requested
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast({
            title: "Σφάλμα",
            description: "Οι κωδικοί πρόσβασης δεν ταιριάζουν",
            variant: "destructive"
          });
          return;
        }

        if (formData.newPassword.length < 6) {
          toast({
            title: "Σφάλμα",
            description: "Ο κωδικός πρόσβασης πρέπει να έχει τουλάχιστον 6 χαρακτήρες",
            variant: "destructive"
          });
          return;
        }

        // Only admin can change password without current password
        if (currentUser?.role !== 'admin' && !formData.currentPassword) {
          toast({
            title: "Σφάλμα",
            description: "Παρακαλώ εισάγετε τον τρέχοντα κωδικό πρόσβασης",
            variant: "destructive"
          });
          return;
        }

        // Get user's auth_user_id to update password
        const { data: authData } = await supabase
          .from('app_users')
          .select('auth_user_id')
          .eq('id', userId)
          .single();

        if (authData?.auth_user_id) {
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            authData.auth_user_id,
            { password: formData.newPassword }
          );

          if (passwordError) throw passwordError;
        }
      }

      toast({
        title: "Επιτυχία",
        description: "Το προφίλ ενημερώθηκε επιτυχώς",
      });

      // Refresh profile data
      await fetchUserProfile();
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setShowPasswordFields(false);

    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Σφάλμα",
        description: "Αδυναμία ενημέρωσης προφίλ",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ffba] mx-auto mb-4"></div>
          <p className="text-gray-600">Φόρτωση προφίλ...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Το προφίλ δεν βρέθηκε</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Επιστροφή
          </Button>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Δεν έχετε δικαίωμα επεξεργασίας αυτού του προφίλ</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Επιστροφή
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            onClick={() => navigate(-1)} 
            variant="ghost" 
            className="mr-4 rounded-none"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Επιστροφή
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Επεξεργασία Προφίλ</h1>
        </div>

        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>Στοιχεία Χρήστη</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20 rounded-none">
                <AvatarImage src={userProfile.avatar_url} />
                <AvatarFallback className="rounded-none bg-[#00ffba] text-black text-xl">
                  {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button variant="outline" className="rounded-none" disabled={uploading}>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Ανέβασμα...' : 'Αλλαγή Φωτογραφίας'}
                  </Button>
                </Label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Επιτρεπόμενα: JPG, PNG (μέγ. 2MB)
                </p>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Ονοματεπώνυμο *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="rounded-none"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="rounded-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birth_date">Ημερομηνία Γέννησης</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  className="rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="phone">Τηλέφωνο</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="rounded-none"
                  placeholder="π.χ. 6912345678"
                />
              </div>
            </div>

            {/* Password Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Αλλαγή Κωδικού Πρόσβασης</h3>
                <Button
                  variant="outline"
                  className="rounded-none"
                  onClick={() => setShowPasswordFields(!showPasswordFields)}
                >
                  {showPasswordFields ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>

              {showPasswordFields && (
                <div className="space-y-4">
                  {currentUser?.role !== 'admin' && (
                    <div>
                      <Label htmlFor="currentPassword">Τρέχων Κωδικός Πρόσβασης</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                        className="rounded-none"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newPassword">Νέος Κωδικός Πρόσβασης</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        className="rounded-none"
                        placeholder="Τουλάχιστον 6 χαρακτήρες"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Επιβεβαίωση Κωδικού</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="rounded-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="rounded-none"
              >
                Ακύρωση
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={saving || !formData.name || !formData.email}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                {saving ? 'Αποθήκευση...' : 'Αποθήκευση Αλλαγών'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}