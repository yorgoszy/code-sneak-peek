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

export const EditUserDialog = ({ isOpen, onClose, onUserUpdated, user }: EditUserDialogProps) => {
  const {
    name, setName,
    email, setEmail,
    phone, setPhone,
    role, setRole,
    gender, setGender,
    birthDate, setBirthDate,
    photoUrl, setPhotoUrl,
    loading,
    handleSubmit,
    children,
    addChild,
    removeChild,
    updateChild,
  } = useEditUserDialog(user, isOpen);

  const onSubmit = () => handleSubmit(onUserUpdated, onClose);

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
                  <SelectItem value="federation">Federation</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="athlete">Athlete</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          <DialogActions loading={loading} onClose={onClose} onSubmit={onSubmit} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
