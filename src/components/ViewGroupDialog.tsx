
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  created_by: string;
}

interface GroupMember {
  id: string;
  name: string;
  email: string;
}

interface ViewGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
}

export const ViewGroupDialog = ({ isOpen, onClose, group }: ViewGroupDialogProps) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && group) {
      fetchGroupMembers();
    }
  }, [isOpen, group]);

  const fetchGroupMembers = async () => {
    if (!group) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          user_id,
          app_users!inner(
            id,
            name,
            email
          )
        `)
        .eq('group_id', group.id);

      if (error) {
        console.error('Error fetching group members:', error);
      } else {
        const membersList = data?.map(item => ({
          id: item.app_users.id,
          name: item.app_users.name,
          email: item.app_users.email
        })) || [];
        setMembers(membersList);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-none">
        <DialogHeader>
          <DialogTitle>Προβολή Ομάδας</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Όνομα Ομάδας</label>
            <p className="text-lg font-semibold mt-1">{group.name}</p>
          </div>
          
          {group.description && (
            <div>
              <label className="text-sm font-medium text-gray-700">Περιγραφή</label>
              <p className="text-sm text-gray-900 mt-1">{group.description}</p>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-gray-700">Ημερομηνία Δημιουργίας</label>
            <p className="text-sm text-gray-900 mt-1">
              {new Date(group.created_at).toLocaleDateString('el-GR')}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Μέλη Ομάδας ({members.length})</label>
            {loading ? (
              <p className="text-sm text-gray-500 mt-1">Φόρτωση μελών...</p>
            ) : members.length > 0 ? (
              <div className="mt-2 space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                    <Badge variant="outline" className="rounded-none">
                      Μέλος
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-1">Δεν υπάρχουν μέλη σε αυτή την ομάδα</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
