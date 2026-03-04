import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Menu, Save, Lock } from "lucide-react";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FederationEditProfile = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile, refreshUserProfile } = useRoleCheck();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setEmail(userProfile.email || "");
      setPhone(userProfile.phone || "");
      setNotes(userProfile.notes || "");
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!userProfile?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from("app_users")
      .update({ name, phone, notes, updated_at: new Date().toISOString() })
      .eq("id", userProfile.id);

    if (error) {
      toast.error(t("federation.editProfile.saveError"));
    } else {
      await refreshUserProfile();
      toast.success(t("federation.editProfile.saveSuccess"));
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error(t("federation.editProfile.passwordMinLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("federation.editProfile.passwordMismatch"));
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(t("federation.editProfile.passwordChangeError"));
    } else {
      toast.success(t("federation.editProfile.passwordChanged"));
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  const renderSidebar = () => (
    <FederationSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden lg:block">{renderSidebar()}</div>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 h-full">{renderSidebar()}</div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">{t("federation.editProfile.title")}</h1>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-bold text-foreground">{t("federation.editProfile.title")}</h1>
              <p className="text-muted-foreground text-sm">{t("federation.editProfile.subtitle")}</p>
            </div>

            <div className="max-w-2xl space-y-6">
              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle className="text-lg">{t("federation.editProfile.basicInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("federation.editProfile.federationName")}</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-none" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("federation.editProfile.email")}</Label>
                    <Input value={email} disabled className="rounded-none bg-muted" />
                    <p className="text-xs text-muted-foreground">{t("federation.editProfile.emailCantChange")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("federation.editProfile.phone")}</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-none" placeholder={t("federation.editProfile.phonePlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("federation.editProfile.notes")}</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-none" rows={4} placeholder={t("federation.editProfile.notesPlaceholder")} />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={saving} className="rounded-none bg-foreground hover:bg-foreground/90 text-background">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? t("federation.editProfile.saving") : t("federation.editProfile.save")}
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    {t("federation.editProfile.changePassword")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("federation.editProfile.newPassword")}</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-none" placeholder={t("federation.editProfile.newPasswordPlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("federation.editProfile.confirmPassword")}</Label>
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="rounded-none" placeholder={t("federation.editProfile.confirmPasswordPlaceholder")} />
                  </div>
                  <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword} variant="outline" className="rounded-none">
                    <Lock className="h-4 w-4 mr-2" />
                    {changingPassword ? t("federation.editProfile.changingPassword") : t("federation.editProfile.changePasswordBtn")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FederationEditProfile;
