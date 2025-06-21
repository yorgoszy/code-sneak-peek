import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Edit, Trash2, Users, Search, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { EditGroupDialog } from "@/components/EditGroupDialog";
import { DeleteGroupDialog } from "@/components/DeleteGroupDialog";
import { ViewGroupDialog } from "@/components/ViewGroupDialog";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoleCheck } from "@/hooks/useRoleCheck";

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

const Groups = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, userProfile, loading: rolesLoading } = useRoleCheck();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [userProfileState, setUserProfile] = useState<any>(null);
  const isMobile = useIsMobile();
  
  // Dialog states
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false);
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [viewGroupDialogOpen, setViewGroupDialogOpen] = useState(false);
  
  const { toast } = useToast();

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

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching groups:', error);
      } else {
        setGroups(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Fetch user profile from app_users table
      const fetchUserProfile = async () => {
        const { data } = await supabase
          .from('app_users')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
        
        setUserProfile(data);
      };
      
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ εισάγετε όνομα ομάδας και επιλέξτε τουλάχιστον έναν χρήστη",
      });
      return;
    }

    if (!userProfileState?.id) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν μπορέσαμε να αναγνωρίσουμε το προφίλ σας",
      });
      return;
    }

    setCreating(true);
    try {
      // Create the group using the app_users id instead of auth user id
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([{
          name: groupName,
          description: groupDescription,
          created_by: userProfileState.id
        }])
        .select()
        .single();

      if (groupError) {
        console.error('Error creating group:', groupError);
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Δεν ήταν δυνατή η δημιουργία της ομάδας",
        });
        return;
      }

      // Add members to the group
      const memberInserts = selectedUsers.map(userId => ({
        group_id: groupData.id,
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
          description: "Η ομάδα δημιουργήθηκε αλλά υπήρξε πρόβλημα με την προσθήκη μελών",
        });
      } else {
        toast({
          title: "Επιτυχία",
          description: "Η ομάδα δημιουργήθηκε επιτυχώς",
        });
      }

      // Reset form and close dialog
      setGroupName("");
      setGroupDescription("");
      setSelectedUsers([]);
      setNewGroupDialogOpen(false);
      fetchGroups();
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Προέκυψε σφάλμα κατά τη δημιουργία της ομάδας",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setEditGroupDialogOpen(true);
  };

  const handleDeleteGroup = (group: Group) => {
    setSelectedGroup(group);
    setDeleteGroupDialogOpen(true);
  };

  const handleViewGroup = (group: Group) => {
    setSelectedGroup(group);
    setViewGroupDialogOpen(true);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to={`/dashboard/user-profile/${userProfile?.id}`} replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <AppSidebar />

        <SidebarInset className="flex-1 flex flex-col">
          {/* Top Navigation */}
          <nav className={`bg-white border-b border-gray-200 ${isMobile ? 'px-3 py-3' : 'px-6 py-4'}`}>
            <div className="flex justify-between items-center">
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
                {isMobile && <SidebarTrigger />}
                <div className={`${isMobile ? 'min-w-0 flex-1' : ''}`}>
                  <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 ${isMobile ? 'truncate' : ''}`}>
                    Ομάδες
                  </h1>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 ${isMobile ? 'truncate' : ''}`}>
                    Διαχείριση ομάδων χρηστών
                  </p>
                </div>
              </div>
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
                {!isMobile && (
                  <span className="text-sm text-gray-600">
                    {userProfile?.name || user?.email}
                    {isAdmin() && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
                  </span>
                )}
                <Button 
                  variant="outline" 
                  className={`rounded-none ${isMobile ? 'text-xs px-2' : ''}`}
                  onClick={handleSignOut}
                >
                  <LogOut className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                  {isMobile ? 'Exit' : 'Αποσύνδεση'}
                </Button>
              </div>
            </div>
          </nav>

          {/* Groups Content */}
          <div className={`flex-1 ${isMobile ? 'p-3 space-y-4' : 'p-6 space-y-6'}`}>
            {/* Existing Groups */}
            <Card className="rounded-none">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
                    Υπάρχουσες Ομάδες ({groups.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loadingGroups ? (
                  <div className={`text-center ${isMobile ? 'py-6' : 'py-8'}`}>
                    <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>Φόρτωση ομάδων...</p>
                  </div>
                ) : groups.length === 0 ? (
                  <div className={`text-center ${isMobile ? 'py-6' : 'py-8'}`}>
                    <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>Δεν βρέθηκαν ομάδες</p>
                  </div>
                ) : (
                  <div className={isMobile ? 'overflow-x-auto' : ''}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className={isMobile ? 'text-xs' : ''}>Όνομα</TableHead>
                          <TableHead className={isMobile ? 'text-xs' : ''}>Περιγραφή</TableHead>
                          <TableHead className={isMobile ? 'text-xs' : ''}>Δημιουργία</TableHead>
                          <TableHead className={isMobile ? 'text-xs' : ''}>Ενέργειες</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groups.map((group) => (
                          <TableRow key={group.id}>
                            <TableCell className={`font-medium ${isMobile ? 'text-xs' : ''}`}>
                              {group.name}
                            </TableCell>
                            <TableCell className={isMobile ? 'text-xs' : ''}>{group.description || '-'}</TableCell>
                            <TableCell className={isMobile ? 'text-xs' : ''}>{formatDate(group.created_at)}</TableCell>
                            <TableCell>
                              <div className={`flex ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
                                <Button 
                                  variant="outline" 
                                  size={isMobile ? "sm" : "sm"}
                                  className="rounded-none"
                                  onClick={() => handleViewGroup(group)}
                                >
                                  <Eye className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size={isMobile ? "sm" : "sm"}
                                  className="rounded-none"
                                  onClick={() => handleEditGroup(group)}
                                >
                                  <Edit className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size={isMobile ? "sm" : "sm"}
                                  className="rounded-none text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteGroup(group)}
                                >
                                  <Trash2 className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Create New Group */}
            <Card className="rounded-none">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0">
                  <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
                    Δημιουργία Νέας Ομάδας
                  </CardTitle>
                  <Button 
                    className={`rounded-none ${isMobile ? 'text-xs w-full' : ''}`}
                    onClick={() => setNewGroupDialogOpen(true)}
                  >
                    <Plus className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                    Νέα Ομάδα
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`space-y-4`}>
                  {/* Search Users */}
                  <div className="relative">
                    <Search className={`absolute left-3 top-3 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400`} />
                    <Input
                      placeholder="Αναζήτηση χρηστών..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`${isMobile ? 'pl-8 text-sm' : 'pl-10'} rounded-none`}
                    />
                  </div>

                  {/* Users List */}
                  {loadingUsers ? (
                    <div className={`text-center ${isMobile ? 'py-6' : 'py-8'}`}>
                      <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>Φόρτωση χρηστών...</p>
                    </div>
                  ) : (
                    <div className={`${isMobile ? 'max-h-80' : 'max-h-96'} overflow-y-auto border rounded-none`}>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className={`${isMobile ? 'w-8' : 'w-12'}`}>
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
                            <TableHead className={isMobile ? 'text-xs' : ''}>Όνομα</TableHead>
                            <TableHead className={isMobile ? 'text-xs' : ''}>Email</TableHead>
                            <TableHead className={isMobile ? 'text-xs' : ''}>Ρόλος</TableHead>
                            <TableHead className={isMobile ? 'text-xs' : ''}>Κατάσταση</TableHead>
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
                              <TableCell className={`font-medium ${isMobile ? 'text-xs' : ''}`}>
                                {user.name}
                              </TableCell>
                              <TableCell className={isMobile ? 'text-xs' : ''}>{user.email}</TableCell>
                              <TableCell className={isMobile ? 'text-xs' : ''}>{user.role}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  user.user_status === 'active' ? 'bg-green-100 text-green-800' :
                                  user.user_status === 'inactive' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {user.user_status}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {selectedUsers.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-none">
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-800`}>
                        <Users className={`inline ${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-1'}`} />
                        Επιλεγμένοι χρήστες: {selectedUsers.length}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>

      {/* New Group Dialog */}
      <Dialog open={newGroupDialogOpen} onOpenChange={setNewGroupDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-none">
          <DialogHeader>
            <DialogTitle>Νέα Ομάδα</DialogTitle>
            <DialogDescription>
              Δημιουργήστε μια νέα ομάδα χρηστών
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
                className="rounded-none"
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
                className="rounded-none"
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-none">
              <p className="text-sm text-gray-600">
                Επιλεγμένοι χρήστες: {selectedUsers.length}
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setNewGroupDialogOpen(false)}
                className="rounded-none"
              >
                Ακύρωση
              </Button>
              <Button 
                onClick={handleCreateGroup}
                disabled={creating}
                className="rounded-none"
              >
                {creating ? "Δημιουργία..." : "Δημιουργία"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Group Dialog */}
      <ViewGroupDialog
        isOpen={viewGroupDialogOpen}
        onClose={() => setViewGroupDialogOpen(false)}
        group={selectedGroup}
      />

      {/* Edit Group Dialog */}
      <EditGroupDialog
        isOpen={editGroupDialogOpen}
        onClose={() => setEditGroupDialogOpen(false)}
        onGroupUpdated={fetchGroups}
        group={selectedGroup}
      />

      {/* Delete Group Dialog */}
      <DeleteGroupDialog
        isOpen={deleteGroupDialogOpen}
        onClose={() => setDeleteGroupDialogOpen(false)}
        onGroupDeleted={fetchGroups}
        group={selectedGroup}
      />
    </SidebarProvider>
  );
};

export default Groups;
