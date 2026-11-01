import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvatarUpload } from "./AvatarUpload";
import { useEditUserDialog } from "./edit-user/useEditUserDialog";
import { ChildrenFields } from "./edit-user/ChildrenFields";
import { DialogActions } from "./edit-user/DialogActions";
import type { EditUserDialogProps } from "./edit-user/types";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const EditUserDialog = ({ isOpen, onClose, onUserUpdated, user }: EditUserDialogProps) => {
  const {
    name, setName,
    email, setEmail,
    phone, setPhone,
    role, setRole,
    gender, setGender,
    birthDate, setBirthDate,
    photoUrl, setPhotoUrl,
    cardNumber, setCardNumber,
    loading,
    handleSubmit,
    children,
    addChild,
    removeChild,
    updateChild,
  } = useEditUserDialog(user, isOpen);

  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  useEffect(() => { if (!isOpen) setNewPassword(""); }, [isOpen]);

  const handleSetPassword = async () => {
    if (!user?.id) return false;
    setSavingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-set-password", {
        body: { appUserId: user.id, password: newPassword },
      });
      if (error || data?.error) {
        let msg = data?.error || error?.message;
        try { const ctx = await (error as any)?.context?.json?.(); if (ctx?.error) msg = ctx.error; } catch {}
        toast.error(msg || "Αποτυχία αλλαγής κωδικού");
        return false;
      }
      toast.success("Ο κωδικός ορίστηκε");
      setNewPassword("");
      return true;
    } finally {
      setSavingPassword(false);
    }
  };

  const onSubmit = async () => {
    if (newPassword) {
      if (newPassword.length < 8) { toast.error("Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες"); return; }
      const ok = await handleSetPassword();
      if (!ok) return;
    }
    handleSubmit(onUserUpdated, onClose);
  };

  const fallback = (name || email || "?").trim().charAt(0).toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto rounded-none p-5">
        <DialogHeader className="space-y-1">
          <DialogTitle>Επεξεργασία Χρήστη</DialogTitle>
          <DialogDescription className="text-xs">
            Μόνο το όνομα και το email είναι υποχρεωτικά.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          <div className="flex justify-center">
            <AvatarUpload
              currentPhotoUrl={photoUrl || undefined}
              onPhotoChange={setPhotoUrl}
              disabled={loading}
              fallbackText={fallback}
              size={96}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs">Όνομα *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Όνομα" className="rounded-none h-9" disabled={loading} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs">Email *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="rounded-none h-9" disabled={loading} required />
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs">Τηλέφωνο</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Τηλέφωνο" className="rounded-none h-9" disabled={loading} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="birthDate" className="text-xs">Ημ. Γέννησης</Label>
              <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="rounded-none h-9" disabled={loading} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="gender" className="text-xs">Φύλο</Label>
              <Select value={gender} onValueChange={setGender} disabled={loading}>
                <SelectTrigger className="rounded-none h-9"><SelectValue placeholder="Φύλο" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Άνδρας</SelectItem>
                  <SelectItem value="female">Γυναίκα</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="role" className="text-xs">Ρόλος</Label>
              <Select value={role} onValueChange={setRole} disabled={loading}>
                <SelectTrigger className="rounded-none h-9"><SelectValue placeholder="Ρόλος" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="club">Club</SelectItem>
                  <SelectItem value="federation">Federation</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="athlete">Athlete</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {role === "athlete" && (
            <div className="space-y-1">
              <Label htmlFor="cardNumber" className="text-xs">Αριθμός Δελτίου</Label>
              <Input id="cardNumber" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="π.χ. 12345" className="rounded-none h-9" disabled={loading} />
            </div>
          )}


          {role === "parent" && (
            <ChildrenFields
              children={children}
              addChild={addChild}
              removeChild={removeChild}
              updateChild={updateChild}
              loading={loading}
            />
          )}

          <div className="space-y-1">
            <Label htmlFor="newPassword" className="text-xs">Κωδικός Πρόσβασης</Label>
            <div className="flex gap-2">
              <Input id="newPassword" type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Νέος κωδικός (τουλάχιστον 8 χαρακτήρες)" className="rounded-none h-9" disabled={loading || savingPassword} autoComplete="new-password" />
              <Button type="button" variant="outline" className="rounded-none h-9" onClick={handleSetPassword} disabled={savingPassword || newPassword.length < 8}>
                {savingPassword ? "..." : "Ορισμός"}
              </Button>
            </div>
          </div>

          <DialogActions loading={loading} onClose={onClose} onSubmit={onSubmit} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
