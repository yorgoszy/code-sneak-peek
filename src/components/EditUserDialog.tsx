
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhotoUpload } from "./PhotoUpload";
import { useEditUserDialog } from "./edit-user/useEditUserDialog";
import { BasicInfoFields } from "./edit-user/BasicInfoFields";
import { RoleStatusFields } from "./edit-user/RoleStatusFields";
import { ChildrenFields } from "./edit-user/ChildrenFields";
import { DialogActions } from "./edit-user/DialogActions";
import type { EditUserDialogProps } from "./edit-user/types";

export const EditUserDialog = ({ isOpen, onClose, onUserUpdated, user }: EditUserDialogProps) => {
  const {
    name, setName,
    email, setEmail,
    phone, setPhone,
    role, setRole,
    category, setCategory,
    gender, setGender,
    birthDate, setBirthDate,
    photoUrl, setPhotoUrl,
    loading,
    handleSubmit,
    children,
    addChild,
    removeChild,
    updateChild
  } = useEditUserDialog(user, isOpen);

  const onSubmit = () => {
    handleSubmit(onUserUpdated, onClose);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle>Επεξεργασία Χρήστη</DialogTitle>
          <DialogDescription>
            Επεξεργαστείτε τις πληροφορίες του χρήστη. Μόνο το όνομα και το email είναι υποχρεωτικά.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <BasicInfoFields
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
            category={category}
            setCategory={setCategory}
            birthDate={birthDate}
            setBirthDate={setBirthDate}
            loading={loading}
          />

          <PhotoUpload
            currentPhotoUrl={photoUrl || undefined}
            onPhotoChange={setPhotoUrl}
            disabled={loading}
          />

          <RoleStatusFields
            role={role}
            setRole={setRole}
            gender={gender}
            setGender={setGender}
            loading={loading}
          />

          {role === 'parent' && (
            <ChildrenFields
              children={children}
              addChild={addChild}
              removeChild={removeChild}
              updateChild={updateChild}
              loading={loading}
            />
          )}
          
          <DialogActions
            loading={loading}
            onClose={onClose}
            onSubmit={onSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
