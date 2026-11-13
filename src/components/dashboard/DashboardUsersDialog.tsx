import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { formatDateToLocalString } from "@/utils/dateUtils";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import {
  earliestEndDateByUser,
  sortUsersByExpiry,
  daysUntilExpiry,
} from "./activeUserExpiry";

export type DashboardUsersDialogType = "new" | "active";

interface DashboardUsersDialogProps {
  type: DashboardUsersDialogType | null;
  onClose: () => void;
}

interface ListedUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  end_date?: string | null;
}

export const DashboardUsersDialog = ({ type, onClose }: DashboardUsersDialogProps) => {
  const [users, setUsers] = useState<ListedUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!type) return;
    fetchUsers(type);
  }, [type]);

  const fetchUsers = async (dialogType: DashboardUsersDialogType) => {
    setLoading(true);
    setUsers([]);
    try {
      if (dialogType === "new") {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
          .from("app_users")
          .select("id, name, email, avatar_url, created_at")
          .gte("created_at", startOfMonth.toISOString())
          .order("created_at", { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } else {
        const todayString = formatDateToLocalString(new Date());

        const { data: subscriptions, error } = await supabase
          .from("user_subscriptions")
          .select("user_id")
          .eq("status", "active")
          .eq("is_paused", false)
          .gte("end_date", todayString);

        if (error) throw error;

        const uniqueUserIds = [...new Set((subscriptions || []).map(s => s.user_id))];
        if (uniqueUserIds.length === 0) {
          setUsers([]);
          return;
        }

        const { data: appUsers, error: usersError } = await supabase
          .from("app_users")
          .select("id, name, email, avatar_url, created_at")
          .in("id", uniqueUserIds)
          .order("name", { ascending: true });

        if (usersError) throw usersError;
        setUsers(appUsers || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard users:", error);
    } finally {
      setLoading(false);
    }
  };

  const title = type === "new" ? "Νέοι Χρήστες" : "Ενεργοί Χρήστες";

  return (
    <Dialog open={type !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle>
            {title} <span className="text-sm font-normal text-gray-500">({users.length})</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Φόρτωση...</div>
        ) : users.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">Δεν βρέθηκαν χρήστες</div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 border border-gray-200 rounded-none p-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={u.avatar_url || undefined} alt={u.name} />
                  <AvatarFallback className="text-xs">
                    {u.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{u.name}</div>
                  <div className="text-xs text-gray-500 truncate">{u.email}</div>
                </div>
                {type === "new" && (
                  <div className="text-xs text-gray-400 flex-shrink-0">
                    {format(new Date(u.created_at), "dd/MM/yyyy", { locale: el })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
