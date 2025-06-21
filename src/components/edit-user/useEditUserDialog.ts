
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useEditUserDialog = (user: any, isOpen: boolean) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [category, setCategory] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      console.log('🔧 Setting form data for user:', user);
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setRole(user.role || "");
      setCategory(user.category || "");
      setUserStatus(user.user_status || "");
      setSubscriptionStatus(user.subscription_status || "");
      setBirthDate(user.birth_date || "");
      setPhotoUrl(user.photo_url || "");
    }
  }, [user, isOpen]);

  const handleSubmit = async (onUserUpdated: () => void, onClose: () => void) => {
    if (!name.trim() || !email.trim()) {
      toast.error("Το όνομα και το email είναι υποχρεωτικά");
      return;
    }

    if (!user?.id) {
      toast.error("Δεν βρέθηκε το ID του χρήστη");
      return;
    }

    setLoading(true);
    try {
      console.log('🔧 Updating user with ID:', user.id);
      console.log('🔧 Update data:', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        role,
        category,
        user_status: userStatus,
        subscription_status: subscriptionStatus,
        birth_date: birthDate || null,
        photo_url: photoUrl || null,
      });

      const updates: any = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        role,
        category,
        user_status: userStatus,
        subscription_status: subscriptionStatus,
        birth_date: birthDate || null,
        photo_url: photoUrl || null,
        updated_at: new Date().toISOString(),
      };

      // Remove empty values to avoid unnecessary updates
      Object.keys(updates).forEach(key => {
        if (updates[key] === '' || updates[key] === undefined) {
          delete updates[key];
        }
      });

      const { data, error } = await supabase
        .from("app_users")
        .update(updates)
        .eq("id", user.id)
        .select();

      if (error) {
        console.error('❌ Update error:', error);
        throw error;
      }

      console.log('✅ User updated successfully:', data);
      toast.success("Ο χρήστης ενημερώθηκε επιτυχώς!");
      onUserUpdated();
      onClose();
    } catch (error) {
      console.error("❌ Error updating user:", error);
      toast.error(`Σφάλμα κατά την ενημέρωση του χρήστη: ${error.message || 'Άγνωστο σφάλμα'}`);
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
    subscriptionStatus, setSubscriptionStatus,
    birthDate, setBirthDate,
    photoUrl, setPhotoUrl,
    loading,
    handleSubmit
  };
};
