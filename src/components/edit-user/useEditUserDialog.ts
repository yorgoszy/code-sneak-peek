import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Child {
  id?: string;
  name: string;
  birth_date: string;
  is_athlete?: boolean;
  card_number?: string;
  athlete_app_user_id?: string | null;
}

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
        // Always re-fetch fresh data from DB to ensure photo/avatar/card_number are correct
        const { data: fresh } = await supabase
          .from("app_users")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        const u: any = fresh || user;
        setName(u.name || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setRole(u.role || "");
        setCategory(u.category || "");
        setGender(u.gender || "");
        setBirthDate(u.birth_date || "");
        setPhotoUrl(u.avatar_url || u.photo_url || "");
        setCardNumber(u.card_number || "");

        // Fetch children if role is parent (join athlete app_user for card_number)
        if (u.role === "parent") {
          const { data: childrenData } = await supabase
            .from("children")
            .select("id, name, birth_date, athlete_app_user_id, athlete:app_users!children_athlete_app_user_id_fkey(card_number, is_athlete)")
            .eq("parent_id", u.id)
            .order("created_at", { ascending: true });

          setChildren(
            (childrenData || []).map((c: any) => ({
              id: c.id,
              name: c.name,
              birth_date: c.birth_date,
              athlete_app_user_id: c.athlete_app_user_id,
              is_athlete: !!c.athlete_app_user_id && (c.athlete?.is_athlete !== false),
              card_number: c.athlete?.card_number || "",
            }))
          );
        } else {
          setChildren([]);
        }
      } else if (!isOpen) {
        setName(""); setEmail(""); setPhone(""); setRole(""); setCategory("");
        setGender(""); setBirthDate(""); setPhotoUrl(""); setCardNumber("");
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

    if (role === "parent" && children.length > 0) {
      for (const child of children) {
        if (!child.name.trim() || !child.birth_date) {
          toast.error("Όλα τα παιδιά πρέπει να έχουν όνομα και ημερομηνία γέννησης");
          return;
        }
      }
    }

    setLoading(true);
    try {
      const isAthleteRole = role === "athlete";
      const updates: any = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        role,
        category,
        gender: gender || null,
        birth_date: birthDate || null,
        photo_url: photoUrl || null,
        avatar_url: photoUrl || null,
        card_number: isAthleteRole ? (cardNumber.trim() || null) : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("app_users")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      if (role === "parent") {
        // Get current parent's coach_id
        const { data: parentRow } = await supabase
          .from("app_users")
          .select("coach_id")
          .eq("id", user.id)
          .maybeSingle();
        const childCoachId = parentRow?.coach_id || user.id;

        // Existing children
        const { data: existing } = await supabase
          .from("children")
          .select("id, athlete_app_user_id")
          .eq("parent_id", user.id);
        const existingMap = new Map((existing || []).map((c: any) => [c.id, c]));
        const currentIds = new Set(children.filter((c) => c.id).map((c) => c.id!));

        // Delete removed
        const toDelete = Array.from(existingMap.keys()).filter((id) => !currentIds.has(id as string));
        if (toDelete.length > 0) {
          // Also clear card_number on linked athlete app_users (keep the user)
          for (const cid of toDelete) {
            const link = existingMap.get(cid as string) as any;
            if (link?.athlete_app_user_id) {
              await supabase
                .from("app_users")
                .update({ card_number: null, is_athlete: false })
                .eq("id", link.athlete_app_user_id);
            }
          }
          await supabase.from("children").delete().in("id", toDelete as string[]);
        }

        for (const child of children) {
          let athleteUserId = child.athlete_app_user_id || null;

          if (child.is_athlete) {
            if (!athleteUserId) {
              // create new app_user as athlete
              const placeholderEmail = `child-${crypto.randomUUID()}@hyperkids.local`;
              const { data: newAthlete, error: insErr } = await supabase
                .from("app_users")
                .insert({
                  name: child.name.trim(),
                  email: placeholderEmail,
                  role: "athlete",
                  user_status: "active",
                  birth_date: child.birth_date,
                  coach_id: childCoachId,
                  is_athlete: true,
                  card_number: child.card_number?.trim() || null,
                })
                .select("id")
                .single();
              if (insErr) throw insErr;
              athleteUserId = newAthlete.id;
            } else {
              await supabase
                .from("app_users")
                .update({
                  name: child.name.trim(),
                  birth_date: child.birth_date,
                  is_athlete: true,
                  card_number: child.card_number?.trim() || null,
                })
                .eq("id", athleteUserId);
            }
          } else if (athleteUserId) {
            // unmark athlete & clear card number, keep user
            await supabase
              .from("app_users")
              .update({ is_athlete: false, card_number: null })
              .eq("id", athleteUserId);
          }

          if (child.id) {
            await supabase
              .from("children")
              .update({
                name: child.name,
                birth_date: child.birth_date,
                athlete_app_user_id: athleteUserId,
                updated_at: new Date().toISOString(),
              })
              .eq("id", child.id);
          } else {
            await supabase.from("children").insert({
              parent_id: user.id,
              name: child.name,
              birth_date: child.birth_date,
              athlete_app_user_id: athleteUserId,
            });
          }
        }
      }

      toast.success("Ο χρήστης ενημερώθηκε επιτυχώς!");
      onUserUpdated();
      onClose();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error?.message || "Σφάλμα κατά την ενημέρωση του χρήστη");
    } finally {
      setLoading(false);
    }
  };

  const addChild = () => {
    setChildren([...children, { name: "", birth_date: "", is_athlete: false, card_number: "" }]);
  };

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const updateChild = (index: number, field: keyof Child, value: any) => {
    const newChildren = [...children];
    (newChildren[index] as any) = { ...newChildren[index], [field]: value };
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
    updateChild,
  };
};
