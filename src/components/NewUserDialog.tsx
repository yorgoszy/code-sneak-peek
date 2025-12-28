
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
import { PhotoUpload } from "./PhotoUpload";
import { ChildrenFields } from "./edit-user/ChildrenFields";

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

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Το όνομα και το email είναι υποχρεωτικά",
      });
      return;
    }

    setLoading(true);

    try {
      const userData: any = {
        name: name.trim(),
        email: email.trim(),
        role: role || 'general',
        user_status: 'active'
      };

      // Add optional fields only if they have values
      if (phone.trim()) userData.phone = phone.trim();
      if (gender) userData.gender = gender;
      if (birthDate) userData.birth_date = birthDate;
      if (photoUrl) userData.photo_url = photoUrl;

      const { data: newUser, error } = await supabase
        .from('app_users')
        .insert([userData])
        .select()
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Δεν ήταν δυνατή η δημιουργία του χρήστη",
        });
        return;
      }

      // Insert children if role is parent
      if (role === 'parent' && children.length > 0 && newUser) {
        for (const child of children) {
          if (child.name.trim()) {
            await supabase
              .from('children')
              .insert({
                parent_id: newUser.id,
                name: child.name.trim(),
                birth_date: child.birth_date
              });
          }
        }
      }

      toast({
        title: "Επιτυχία",
        description: "Ο χρήστης δημιουργήθηκε επιτυχώς",
      });
      
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setRole("");
      setGender("");
      setBirthDate("");
      setPhotoUrl(null);
      setChildren([]);
      
      onUserCreated();
      onClose();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Προέκυψε σφάλμα κατά τη δημιουργία του χρήστη",
      });
    } finally {
      setLoading(false);
    }
  };

  const addChild = () => {
    setChildren([...children, { name: '', birth_date: '' }]);
  };

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const updateChild = (index: number, field: keyof Child, value: string) => {
    const newChildren = [...children];
    newChildren[index] = { ...newChildren[index], [field]: value };
    setChildren(newChildren);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Νέος Χρήστης</DialogTitle>
          <DialogDescription>
            Δημιουργήστε έναν νέο χρήστη. Μόνο το όνομα και το email είναι υποχρεωτικά.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Όνομα *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Εισάγετε το όνομα"
              required
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
              required
            />
          </div>

          <PhotoUpload
            currentPhotoUrl={photoUrl || undefined}
            onPhotoChange={setPhotoUrl}
            disabled={loading}
          />

          <div className="space-y-2">
            <Label htmlFor="phone">Τηλέφωνο</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Εισάγετε το τηλέφωνο"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Ρόλος</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επιλέξτε ρόλο" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="trainer">Trainer</SelectItem>
                <SelectItem value="athlete">Athlete</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Φύλο</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επιλέξτε φύλο" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Άνδρας</SelectItem>
                <SelectItem value="female">Γυναίκα</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Ημερομηνία Γέννησης</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          {role === 'parent' && (
            <ChildrenFields
              children={children}
              addChild={addChild}
              removeChild={removeChild}
              updateChild={updateChild}
              loading={loading}
            />
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="rounded-none"
            >
              Ακύρωση
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-none"
            >
              {loading ? "Δημιουργία..." : "Δημιουργία"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
