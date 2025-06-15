
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
    console.log('🔄 Updating user:', user.id, { 
      name: name.trim(),
      email: email.trim(),
      role,
      userStatus,
      phone: phone.trim() || null,
      category: category.trim() || null,
      birthDate: birthDate || null,
      photoUrl: photoUrl || null
    });

    try {
      // Update app_users table
      const userData: any = {
        name: name.trim(),
        email: email.trim(),
        role: role || 'general',
        user_status: userStatus || 'active',
        phone: phone.trim() || null,
        category: category.trim() || null,
        birth_date: birthDate || null,
        photo_url: photoUrl || null
      };

      console.log('📝 Updating app_users with data:', userData);

      const { error: updateError } = await supabase
        .from('app_users')
        .update(userData)
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Error updating user in app_users:', updateError);
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: `Δεν ήταν δυνατή η ενημέρωση του χρήστη: ${updateError.message}`,
        });
        return;
      }

      console.log('✅ User updated successfully in app_users');

      // Handle role changes in user_roles table if role is different
      if (role && role !== user.role) {
        console.log('🎭 Role changed from', user.role, 'to', role);
        
        // First, let's check if user has auth_user_id and use that, otherwise use the regular id
        const userIdForRoles = user.auth_user_id || user.id;
        console.log('👤 Using user ID for roles:', userIdForRoles);

        // Delete existing roles for this user
        console.log('🗑️ Deleting existing roles for user:', userIdForRoles);
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userIdForRoles);

        if (deleteError) {
          console.error('❌ Error deleting old roles:', deleteError);
        } else {
          console.log('✅ Old roles deleted successfully');
        }

        // Convert role names to match user_roles table enum
        let roleForUserRoles = role;
        if (role === 'trainer') {
          roleForUserRoles = 'coach';
        }

        console.log('➕ Inserting new role:', roleForUserRoles, 'for user:', userIdForRoles);

        // Insert new role
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userIdForRoles,
            role: roleForUserRoles as 'admin' | 'coach' | 'athlete' | 'general' | 'parent'
          });

        if (insertError) {
          console.error('❌ Error inserting new role:', insertError);
          toast({
            variant: "destructive",
            title: "Προειδοποίηση",
            description: `Ο χρήστης ενημερώθηκε αλλά υπήρξε πρόβλημα με τον ρόλο: ${insertError.message}`,
          });
        } else {
          console.log('✅ New role inserted successfully');
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
