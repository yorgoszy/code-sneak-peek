
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Users } from "lucide-react";
import { matchesSearchTerm } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  category?: string;
  user_status: string;
  birth_date?: string;
  created_at: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  created_by: string;
}

interface EditGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupUpdated: () => void;
  group: Group | null;
}

export const EditGroupDialog = ({ isOpen, onClose, onGroupUpdated, group }: EditGroupDialogProps) => {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentMembers, setCurrentMembers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (group && isOpen) {
      setGroupName(group.name);
      setGroupDescription(group.description || "");
      fetchUsers();
      fetchCurrentMembers();
    }
  }, [group, isOpen]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchCurrentMembers = async () => {
    if (!group) return;

    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', group.id);

      if (error) {
        console.error('Error fetching current members:', error);
      } else {
        const memberIds = data?.map(member => member.user_id) || [];
        setCurrentMembers(memberIds);
        setSelectedUsers(memberIds);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleUpdate = async () => {
    if (!groupName.trim() || !group) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ εισάγετε όνομα ομάδας",
      });
      return;
    }

    setLoading(true);
    try {
      // Update group info
      const { error: groupError } = await supabase
        .from('groups')
        .update({
          name: groupName,
          description: groupDescription,
        })
        .eq('id', group.id);

      if (groupError) {
        console.error('Error updating group:', groupError);
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Δεν ήταν δυνατή η ενημέρωση της ομάδας",
        });
        return;
      }

      // Remove old members
      const { error: deleteError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id);

      if (deleteError) {
        console.error('Error removing old members:', deleteError);
      }

      // Add new members
      if (selectedUsers.length > 0) {
        const memberInserts = selectedUsers.map(userId => ({
          group_id: group.id,
          user_id: userId
        }));

        const { error: membersError } = await supabase
          .from('group_members')
          .insert(memberInserts);

        if (membersError) {
          console.error('Error adding members:', membersError);
          toast({
            variant: "destructive",
            title: "Σφάλμα",
            description: "Η ομάδα ενημερώθηκε αλλά υπήρξε πρόβλημα με τα μέλη",
          });
        }
      }

      toast({
        title: "Επιτυχία",
        description: "Η ομάδα ενημερώθηκε επιτυχώς",
      });

      onGroupUpdated();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Προέκυψε σφάλμα κατά την ενημέρωση της ομάδας",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    matchesSearchTerm(user.name, searchTerm) ||
    matchesSearchTerm(user.email, searchTerm)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Επεξεργασία Ομάδας</DialogTitle>
          <DialogDescription>
            Επεξεργαστείτε τις πληροφορίες της ομάδας και τα μέλη της
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Όνομα Ομάδας</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Εισάγετε το όνομα της ομάδας"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="groupDescription">Περιγραφή (προαιρετικό)</Label>
            <Input
              id="groupDescription"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Εισάγετε περιγραφή της ομάδας"
            />
          </div>

          <div className="space-y-4">
            <Label>Μέλη Ομάδας</Label>
            
            {/* Search Users */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Αναζήτηση χρηστών..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Users List */}
            {loadingUsers ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Φόρτωση χρηστών...</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers(filteredUsers.map(u => u.id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Όνομα</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ρόλος</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {selectedUsers.length > 0 && (
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-blue-800">
                  <Users className="inline h-4 w-4 mr-1" />
                  Επιλεγμένοι χρήστες: {selectedUsers.length}
                </p>
              </div>
            )}
          </div>
          
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
              onClick={handleUpdate}
              disabled={loading}
              className="rounded-none"
            >
              {loading ? "Ενημέρωση..." : "Ενημέρωση"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
