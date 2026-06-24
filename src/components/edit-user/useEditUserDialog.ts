import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Child {
  id?: string;
  name: string;
  birth_date: string;
}

// Map UI/localized values to DB-allowed values
const normalizeSubscriptionStatus = (value: string | null | undefined): "active" | "inactive" => {
  const v = (value || "").toLowerCase().trim();
  // Accept already-normalized values
  if (v === "active" || v === "inactive") return v as any;
  // Greek UI labels mapping
  if (v === "ενεργή") return "active";
  if (v === "ανενεργή") return "inactive";
  if (v === "παύση" || v === "paused") return "inactive"; // app_users only stores active/inactive
  // Fallback safe default
  return "inactive";
};
export const useEditUserDialog = (user: any, isOpen: boolean) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user && isOpen) {
        setName(user.name || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setRole(user.role || "");
        setCategory(user.category || "");
        setGender(user.gender || "");
        setBirthDate(user.birth_date || "");
        setPhotoUrl(user.photo_url || "");
        setCardNumber(user.card_number || "");

        // Fetch children if role is parent
        if (user.role === 'parent') {
          const { data: childrenData } = await supabase
            .from('children')
            .select('*')
            .eq('parent_id', user.id)
            .order('created_at', { ascending: true });
          
          setChildren(childrenData || []);
        } else {
          setChildren([]);
        }
      } else if (!isOpen) {
        // Reset state when dialog closes
        setName("");
        setEmail("");
        setPhone("");
        setRole("");
        setCategory("");
        setGender("");
        setBirthDate("");
        setPhotoUrl("");
        setCardNumber("");
        setChildren([]);
      }
    };

    fetchUserData();
  }, [user, isOpen]);

  const handleSubmit = async (onUserUpdated: () => void, onClose: () => void) => {
    if (!name.trim() || !email.trim()) {
      toast.error("Το όνομα και το email είναι υποχρεωτικά");
      return;
    }

    // Validate children if role is parent
    if (role === 'parent' && children.length > 0) {
      for (const child of children) {
        if (!child.name.trim() || !child.birth_date) {
          toast.error("Όλα τα παιδιά πρέπει να έχουν όνομα και ημερομηνία γέννησης");
          return;
        }
      }
    }

    setLoading(true);
    try {
      const updates: any = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        role,
        category,
        gender: gender || null,
        birth_date: birthDate || null,
        photo_url: photoUrl || null,
        card_number: cardNumber.trim() || null,
        updated_at: new Date().toISOString(),
      };

      console.log('📝 Updates to send:', updates);
      console.log('📝 Updating user with ID:', user.id);

      const { data, error } = await supabase
        .from("app_users")
        .update(updates)
        .eq("id", user.id)
        .select();

      console.log('📝 Update result:', { data, error });

      if (error) {
        console.error('❌ Update error details:', error);
        throw error;
      }

      // Handle children updates if role is parent
      if (role === 'parent') {
        // Get existing children
        const { data: existingChildren } = await supabase
          .from('children')
          .select('id')
          .eq('parent_id', user.id);

        const existingIds = new Set(existingChildren?.map(c => c.id) || []);
        const currentIds = new Set(children.filter(c => c.id).map(c => c.id));

        // Delete removed children
        const toDelete = Array.from(existingIds).filter(id => !currentIds.has(id));
        if (toDelete.length > 0) {
          await supabase
            .from('children')
            .delete()
            .in('id', toDelete);
        }

        // Update or insert children
        for (const child of children) {
          if (child.id) {
            // Update existing
            await supabase
              .from('children')
              .update({
                name: child.name,
                birth_date: child.birth_date,
                updated_at: new Date().toISOString()
              })
              .eq('id', child.id);
          } else {
            // Insert new
            await supabase
              .from('children')
              .insert({
                parent_id: user.id,
                name: child.name,
                birth_date: child.birth_date
              });
          }
        }
      }

      toast.success("Ο χρήστης ενημερώθηκε επιτυχώς!");
      onUserUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Σφάλμα κατά την ενημέρωση του χρήστη");
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

  return {
    name, setName,
    email, setEmail,
    phone, setPhone,
    role, setRole,
    category, setCategory,
    gender, setGender,
    birthDate, setBirthDate,
    photoUrl, setPhotoUrl,
    cardNumber, setCardNumber,
    loading,
    handleSubmit,
    children,
    addChild,
    removeChild,
    updateChild
  };
};
