
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  created_by: string;
}

interface DeleteGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupDeleted: () => void;
  group: Group | null;
}

export const DeleteGroupDialog = ({ isOpen, onClose, onGroupDeleted, group }: DeleteGroupDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!group) return;
    
    setLoading(true);

    try {
      // First delete group members
      const { error: membersError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id);

      if (membersError) {
        console.error('Error deleting group members:', membersError);
        throw membersError;
      }

      // Then delete the group
      const { error: groupError } = await supabase
        .from('groups')
        .delete()
        .eq('id', group.id);

      if (groupError) {
        console.error('Error deleting group:', groupError);
        throw groupError;
      }

      toast({
        title: "Επιτυχία",
        description: "Η ομάδα διαγράφηκε επιτυχώς",
      });
      
      onGroupDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Προέκυψε σφάλμα κατά τη διαγραφή της ομάδας",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader>
          <AlertDialogTitle>Διαγραφή Ομάδας</AlertDialogTitle>
          <AlertDialogDescription>
            Είστε σίγουροι ότι θέλετε να διαγράψετε την ομάδα "{group?.name}"? 
            Αυτή η ενέργεια δεν μπορεί να αναιρεθεί και θα διαγραφούν όλα τα μέλη της ομάδας.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={loading}
            className="rounded-none bg-red-600 hover:bg-red-700"
          >
            {loading ? "Διαγραφή..." : "Διαγραφή"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
