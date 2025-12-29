import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export const CoachProfileSettings: React.FC<CoachProfileSettingsProps> = ({ coachId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coachData, setCoachData] = useState<{ name: string; email: string; avatar_url: string | null }>({
    name: '',
    email: '',
    avatar_url: null
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

  useEffect(() => {
    if (coachId) {
      fetchProfile();
    }
  }, [coachId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch coach basic info
      const { data: coach, error: coachError } = await supabase
        .from('app_users')
        .select('name, email, avatar_url')
        .eq('id', coachId)
        .single();

      if (coachError) throw coachError;
      setCoachData(coach);

      // Fetch coach profile
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

      // Upload logo if changed
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

      // Check if profile exists
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-gray-500">Φόρτωση...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ρυθμίσεις Προφίλ</h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-none">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Basic Info Card */}
      <Card className="rounded-none">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Βασικά Στοιχεία</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={coachData.avatar_url || undefined} />
              <AvatarFallback>{coachData.name?.charAt(0) || 'C'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{coachData.name}</p>
              <p className="text-sm text-gray-500">{coachData.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Info Card */}
      <Card className="rounded-none">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Επαγγελματικά Στοιχεία</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 border border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-gray-400 text-xs text-center">Λογότυπο</span>
              )}
            </div>
            <div>
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-3 py-2 border text-sm hover:bg-gray-50">
                  <Upload className="h-4 w-4" />
                  Ανέβασμα Λογότυπου
                </div>
              </Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Επωνυμία</Label>
              <Input
                value={profile.business_name}
                onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                className="rounded-none h-9 text-sm"
                placeholder="Επωνυμία επιχείρησης"
              />
            </div>
            <div>
              <Label className="text-xs">ΑΦΜ</Label>
              <Input
                value={profile.vat_number}
                onChange={(e) => setProfile({ ...profile, vat_number: e.target.value })}
                className="rounded-none h-9 text-sm"
                placeholder="ΑΦΜ"
              />
            </div>
            <div>
              <Label className="text-xs">ΔΟΥ</Label>
              <Input
                value={profile.tax_office}
                onChange={(e) => setProfile({ ...profile, tax_office: e.target.value })}
                className="rounded-none h-9 text-sm"
                placeholder="ΔΟΥ"
              />
            </div>
            <div>
              <Label className="text-xs">Τηλέφωνο</Label>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="rounded-none h-9 text-sm"
                placeholder="Τηλέφωνο"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Card */}
      <Card className="rounded-none">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Διεύθυνση</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-xs">Διεύθυνση</Label>
              <Input
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="rounded-none h-9 text-sm"
                placeholder="Διεύθυνση"
              />
            </div>
            <div>
              <Label className="text-xs">Πόλη</Label>
              <Input
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="rounded-none h-9 text-sm"
                placeholder="Πόλη"
              />
            </div>
            <div>
              <Label className="text-xs">Τ.Κ.</Label>
              <Input
                value={profile.postal_code}
                onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                className="rounded-none h-9 text-sm"
                placeholder="Τ.Κ."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Card */}
      <Card className="rounded-none">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Υπηρεσίες & Πληροφορίες</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Υπηρεσίες</Label>
            <Textarea
              value={profile.services}
              onChange={(e) => setProfile({ ...profile, services: e.target.value })}
              className="rounded-none text-sm min-h-20"
              placeholder="Περιγραφή υπηρεσιών..."
            />
          </div>
          <div>
            <Label className="text-xs">Website</Label>
            <Input
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              className="rounded-none h-9 text-sm"
              placeholder="https://..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Bank Card */}
      <Card className="rounded-none">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Τραπεζικά Στοιχεία</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Τράπεζα</Label>
              <Input
                value={profile.bank_name}
                onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                className="rounded-none h-9 text-sm"
                placeholder="Όνομα τράπεζας"
              />
            </div>
            <div>
              <Label className="text-xs">IBAN</Label>
              <Input
                value={profile.bank_iban}
                onChange={(e) => setProfile({ ...profile, bank_iban: e.target.value })}
                className="rounded-none h-9 text-sm"
                placeholder="IBAN"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
        </Button>
      </div>
    </div>
  );
};
