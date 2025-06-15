
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AppUser } from "./types";

export const useEditUserDialog = (user: AppUser | null, isOpen: boolean) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [category, setCategory] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setRole(user.role || "");
      setCategory(user.category || "");
      setUserStatus(user.user_status || "");
      setBirthDate(user.birth_date || "");
      setPhotoUrl(user.photo_url || null);
    }
  }, [user, isOpen]);

  const handleSubmit = async (onUserUpdated: () => void, onClose: () => void) => {
    if (!name.trim() || !email.trim()) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Το όνομα και το email είναι υποχρεωτικά",
      });
      return;
    }

    if (!user) return;

    setLoading(true);
    console.log('🔄 Updating user:', user.id, { role, userStatus });

    try {
      const userData: any = {
        name: name.trim(),
        email: email.trim(),
        role: role || 'general',
        user_status: userStatus || 'active'
      };

      userData.phone = phone.trim() || null;
      userData.category = category.trim() || null;
      userData.birth_date = birthDate || null;
      userData.photo_url = photoUrl || null;

      console.log('📝 Updating app_users with data:', userData);

      const { error } = await supabase
        .from('app_users')
        .update(userData)
        .eq('id', user.id);

      if (error) {
        console.error('❌ Error updating user in app_users:', error);
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Δεν ήταν δυνατή η ενημέρωση του χρήστη",
        });
        return;
      }

      console.log('✅ User updated successfully in app_users');

      if (role !== user.role) {
        console.log('🎭 Role changed, updating user_roles table');
        
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.auth_user_id || user.id);

        if (deleteError) {
          console.error('❌ Error deleting old role:', deleteError);
        } else {
          console.log('✅ Old role deleted');
        }

        if (user.auth_user_id || user.id) {
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.auth_user_id || user.id,
              role: role as any
            });

          if (insertError) {
            console.error('❌ Error inserting new role:', insertError);
            toast({
              variant: "destructive",
              title: "Προειδοποίηση",
              description: "Ο χρήστης ενημερώθηκε αλλά μπορεί να υπάρχει πρόβλημα με τον ρόλο",
            });
          } else {
            console.log('✅ New role inserted');
          }
        }
      }

      toast({
        title: "Επιτυχία",
        description: "Ο χρήστης ενημερώθηκε επιτυχώς",
      });
      onUserUpdated();
      onClose();
    } catch (error) {
      console.error('💥 Error updating user:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Προέκυψε σφάλμα κατά την ενημέρωση του χρήστη",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    name, setName,
    email, setEmail,
    phone, setPhone,
    role, setRole,
    category, setCategory,
    userStatus, setUserStatus,
    birthDate, setBirthDate,
    photoUrl, setPhotoUrl,
    loading,
    handleSubmit
  };
};
