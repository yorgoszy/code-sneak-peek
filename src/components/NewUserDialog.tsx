import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AvatarUpload } from "./AvatarUpload";
import { ChildrenFields } from "./edit-user/ChildrenFields";
import { useRoleCheck } from "@/hooks/useRoleCheck";

interface Child {
  name: string;
  birth_date: string;
}

interface NewUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export const NewUserDialog = ({ isOpen, onClose, onUserCreated }: NewUserDialogProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isCoach, isAdmin, userProfile } = useRoleCheck();

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      toast({ variant: "destructive", title: "Σφάλμα", description: "Το όνομα και το email είναι υποχρεωτικά" });
      return;
    }

    setLoading(true);
    try {
      const userData: any = {
        name: name.trim(),
        email: email.trim(),
        role: role || "general",
        user_status: "active",
      };
      if (phone.trim()) userData.phone = phone.trim();
      if (gender) userData.gender = gender;
      if (birthDate) userData.birth_date = birthDate;
      if (photoUrl) userData.photo_url = photoUrl;

      if (isCoach() && !isAdmin() && userProfile?.id) {
        userData.coach_id = userProfile.id;
      } else if (isAdmin()) {
        userData.coach_id = "c6d44641-3b95-46bd-8270-e5ed72de25ad";
      }

      const { data: newUser, error } = await supabase
        .from("app_users")
        .insert([userData])
        .select()
        .single();

      if (error) {
        toast({ variant: "destructive", title: "Σφάλμα", description: "Δεν ήταν δυνατή η δημιουργία" });
        return;
      }

      if (role === "parent" && children.length > 0 && newUser) {
        for (const child of children) {
          if (child.name.trim()) {
            await supabase.from("children").insert({
              parent_id: newUser.id,
              name: child.name.trim(),
              birth_date: child.birth_date,
            });
          }
        }
      }

      toast({ title: "Επιτυχία", description: "Ο χρήστης δημιουργήθηκε" });

      setName(""); setEmail(""); setPhone(""); setRole("");
      setGender(""); setBirthDate(""); setPhotoUrl(null); setChildren([]);

      onUserCreated();
      onClose();
    } catch (error) {
      console.error("Error creating user:", error);
      toast({ variant: "destructive", title: "Σφάλμα", description: "Σφάλμα δημιουργίας" });
    } finally {
      setLoading(false);
    }
  };

  const addChild = () => setChildren([...children, { name: "", birth_date: "" }]);
  const removeChild = (i: number) => setChildren(children.filter((_, idx) => idx !== i));
  const updateChild = (i: number, field: keyof Child, value: string) => {
    const next = [...children];
    next[i] = { ...next[i], [field]: value };
    setChildren(next);
  };

  const fallback = (name || email || "?").trim().charAt(0).toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto rounded-none p-5">
        <DialogHeader className="space-y-1">
          <DialogTitle>Νέος Χρήστης</DialogTitle>
          <DialogDescription className="text-xs">
            Μόνο το όνομα και το email είναι υποχρεωτικά.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 pt-1">
              <AvatarUpload
                currentPhotoUrl={photoUrl || undefined}
                onPhotoChange={setPhotoUrl}
                disabled={loading}
                fallbackText={fallback}
                size={120}
              />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs">Όνομα *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Όνομα" className="rounded-none h-9" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">Email *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="rounded-none h-9" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs">Τηλέφωνο</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Τηλέφωνο" className="rounded-none h-9" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="birthDate" className="text-xs">Ημ. Γέννησης</Label>
                <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="rounded-none h-9" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gender" className="text-xs">Φύλο</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="rounded-none h-9"><SelectValue placeholder="Φύλο" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Άνδρας</SelectItem>
                    <SelectItem value="female">Γυναίκα</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="role" className="text-xs">Ρόλος</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="rounded-none h-9"><SelectValue placeholder="Ρόλος" /></SelectTrigger>
                  <SelectContent>
                    {isAdmin() && <SelectItem value="admin">Admin</SelectItem>}
                    {isAdmin() && <SelectItem value="coach">Coach</SelectItem>}
                    {isAdmin() && <SelectItem value="federation">Federation</SelectItem>}
                    <SelectItem value="trainer">Trainer</SelectItem>
                    <SelectItem value="athlete">Athlete</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone" className="text-xs">Τηλέφωνο</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Τηλέφωνο" className="rounded-none h-9" />
          </div>

          {role === "parent" && (
            <ChildrenFields
              children={children}
              addChild={addChild}
              removeChild={removeChild}
              updateChild={updateChild}
              loading={loading}
            />
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-none">
              Ακύρωση
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="rounded-none">
              {loading ? "Δημιουργία..." : "Δημιουργία"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
