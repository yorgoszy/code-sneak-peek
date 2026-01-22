import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Save, Camera, Lock, Building2, MapPin, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CoachProfile {
  id?: string;
  coach_id: string;
  business_name: string;
  logo_url: string;
  vat_number: string;
  tax_office: string;
  address: string;
  city: string;
  postal_code: string;
  services: string;
  phone: string;
  website: string;
  bank_name: string;
  bank_iban: string;
  notes: string;
}

interface CoachProfileSettingsProps {
  coachId: string;
  onClose?: () => void;
}

export const CoachProfileSettings: React.FC<CoachProfileSettingsProps> = ({ coachId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coachData, setCoachData] = useState<{ name: string; email: string; avatar_url: string | null; auth_user_id: string | null }>({
    name: '',
    email: '',
    avatar_url: null,
    auth_user_id: null
  });
  const [profile, setProfile] = useState<CoachProfile>({
    coach_id: coachId,
    business_name: '',
    logo_url: '',
    vat_number: '',
    tax_office: '',
    address: '',
    city: '',
    postal_code: '',
    services: '',
    phone: '',
    website: '',
    bank_name: '',
    bank_iban: '',
    notes: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (coachId) {
      fetchProfile();
    }
  }, [coachId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const { data: coach, error: coachError } = await supabase
        .from('app_users')
        .select('name, email, avatar_url, auth_user_id')
        .eq('id', coachId)
        .single();

      if (coachError) throw coachError;
      setCoachData(coach);

      const { data: profileData, error: profileError } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('coach_id', coachId)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
      if (profileData) {
        setProfile({
          ...profile,
          ...profileData,
          business_name: profileData.business_name || '',
          logo_url: profileData.logo_url || '',
          vat_number: profileData.vat_number || '',
          tax_office: profileData.tax_office || '',
          address: profileData.address || '',
          city: profileData.city || '',
          postal_code: profileData.postal_code || '',
          services: profileData.services || '',
          phone: profileData.phone || '',
          website: profileData.website || '',
          bank_name: profileData.bank_name || '',
          bank_iban: profileData.bank_iban || '',
          notes: profileData.notes || ''
        });
        if (profileData.logo_url) {
          setLogoPreview(profileData.logo_url);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error("Αποτυχία φόρτωσης προφίλ");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAvatarUploading(true);

      if (!file.type.startsWith('image/')) {
        toast.error('Παρακαλώ επιλέξτε μια εικόνα');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${coachId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('app_users')
        .update({ avatar_url: publicUrl })
        .eq('id', coachId);

      if (updateError) throw updateError;

      setCoachData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Η φωτογραφία ενημερώθηκε');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Σφάλμα: ' + error.message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return profile.logo_url || null;

    const fileExt = logoFile.name.split('.').pop();
    const fileName = `coach-logo-${coachId}-${Date.now()}.${fileExt}`;
    const filePath = `coach-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, logoFile, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      // Update coach name in app_users
      const { error: nameError } = await supabase
        .from('app_users')
        .update({ name: coachData.name })
        .eq('id', coachId);

      if (nameError) throw nameError;

      let logoUrl = profile.logo_url;
      if (logoFile) {
        logoUrl = await uploadLogo() || '';
      }

      const profileData = {
        coach_id: coachId,
        business_name: profile.business_name,
        logo_url: logoUrl,
        vat_number: profile.vat_number,
        tax_office: profile.tax_office,
        address: profile.address,
        city: profile.city,
        postal_code: profile.postal_code,
        services: profile.services,
        phone: profile.phone,
        website: profile.website,
        bank_name: profile.bank_name,
        bank_iban: profile.bank_iban,
        notes: profile.notes
      };

      const { data: existing } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('coach_id', coachId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('coach_profiles')
          .update(profileData)
          .eq('coach_id', coachId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('coach_profiles')
          .insert(profileData);

        if (error) throw error;
      }

      toast.success("Αποθηκεύτηκε");
      setProfile(prev => ({ ...prev, logo_url: logoUrl }));
      setLogoFile(null);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error("Σφάλμα: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Οι κωδικοί δεν ταιριάζουν');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες');
      return;
    }

    try {
      setChangingPassword(true);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: coachData.email,
        password: currentPassword
      });

      if (signInError) {
        toast.error('Λάθος τρέχων κωδικός');
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      toast.success('Ο κωδικός άλλαξε επιτυχώς');
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error('Σφάλμα: ' + error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-gray-500 text-sm">Φόρτωση...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Basic Info - Compact */}
      <Card className="rounded-none">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar 
                className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleAvatarClick}
              >
                <AvatarImage src={coachData.avatar_url || undefined} />
                <AvatarFallback className="text-sm">{coachData.name?.charAt(0) || 'C'}</AvatarFallback>
              </Avatar>
              <div 
                className="absolute -bottom-1 -right-1 bg-[#00ffba] rounded-full p-0.5 cursor-pointer"
                onClick={handleAvatarClick}
              >
                <Camera className="h-2.5 w-2.5 text-black" />
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={avatarUploading}
              />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div>
                <Label className="text-[10px] text-gray-500">Όνομα</Label>
                <Input
                  value={coachData.name}
                  onChange={(e) => setCoachData({ ...coachData, name: e.target.value })}
                  className="rounded-none h-7 text-xs"
                />
              </div>
              <p className="text-xs text-gray-500 truncate">{coachData.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-none text-xs h-7"
              onClick={() => setShowPasswordDialog(true)}
            >
              <Lock className="h-3 w-3 mr-1" />
              Αλλαγή Κωδικού
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Business Info - Compact */}
      <Card className="rounded-none">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium">Επαγγελματικά Στοιχεία</span>
          </div>
          <div className="flex gap-3 mb-2">
            <div className="w-16 h-16 border border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-gray-400 text-[10px] text-center">Logo</span>
              )}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-gray-500">Επωνυμία</Label>
                <Input
                  value={profile.business_name}
                  onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                  className="rounded-none h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">ΑΦΜ</Label>
                <Input
                  value={profile.vat_number}
                  onChange={(e) => setProfile({ ...profile, vat_number: e.target.value })}
                  className="rounded-none h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">ΔΟΥ</Label>
                <Input
                  value={profile.tax_office}
                  onChange={(e) => setProfile({ ...profile, tax_office: e.target.value })}
                  className="rounded-none h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">Τηλέφωνο</Label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="rounded-none h-7 text-xs"
                />
              </div>
            </div>
          </div>
          <Label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 border text-[10px] hover:bg-gray-50">
            <Upload className="h-3 w-3" />
            Ανέβασμα Logo
          </Label>
          <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        </CardContent>
      </Card>

      {/* Address - Compact */}
      <Card className="rounded-none">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium">Διεύθυνση</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3">
              <Input
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="rounded-none h-7 text-xs"
                placeholder="Διεύθυνση"
              />
            </div>
            <div className="col-span-2">
              <Input
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="rounded-none h-7 text-xs"
                placeholder="Πόλη"
              />
            </div>
            <div>
              <Input
                value={profile.postal_code}
                onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                className="rounded-none h-7 text-xs"
                placeholder="Τ.Κ."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services & Website - Compact */}
      <Card className="rounded-none">
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-[10px] text-gray-500">Υπηρεσίες</Label>
              <Textarea
                value={profile.services}
                onChange={(e) => setProfile({ ...profile, services: e.target.value })}
                className="rounded-none text-xs min-h-[50px]"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-[10px] text-gray-500">Website</Label>
              <Input
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                className="rounded-none h-7 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank - Compact */}
      <Card className="rounded-none">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium">Τραπεζικά Στοιχεία</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                value={profile.bank_name}
                onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                className="rounded-none h-7 text-xs"
                placeholder="Τράπεζα"
              />
            </div>
            <div>
              <Input
                value={profile.bank_iban}
                onChange={(e) => setProfile({ ...profile, bank_iban: e.target.value })}
                className="rounded-none h-7 text-xs"
                placeholder="IBAN"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes - Compact */}
      <Card className="rounded-none">
        <CardContent className="p-3">
          <Label className="text-[10px] text-gray-500">Σημειώσεις</Label>
          <Textarea
            value={profile.notes}
            onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
            className="rounded-none text-xs min-h-[40px]"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black h-8 text-sm"
      >
        <Save className="h-4 w-4 mr-2" />
        {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
      </Button>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="rounded-none max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Αλλαγή Κωδικού</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Τρέχων Κωδικός</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded-none h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Νέος Κωδικός</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-none h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Επιβεβαίωση Κωδικού</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-none h-8 text-sm"
              />
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={changingPassword}
              className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black h-8 text-sm"
            >
              {changingPassword ? 'Αλλαγή...' : 'Αλλαγή Κωδικού'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
