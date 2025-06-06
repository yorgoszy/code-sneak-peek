
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { TabNavigation } from "@/components/navigation/TabNavigation";
import { UserFilters } from "@/components/users/UserFilters";
import { UserTable } from "@/components/users/UserTable";
import { UserDialogs } from "@/components/users/UserDialogs";
import { useUsersData } from "@/hooks/useUsersData";
import { useUserFilters } from "@/hooks/useUserFilters";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  user_status: string;
  birth_date?: string;
  photo_url?: string;
  created_at: string;
}

const Users = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoleCheck();
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Use custom hooks for data and filters
  const { users, loading: loadingUsers, refetchUsers } = useUsersData();
  const {
    searchTerm,
    roleFilter,
    statusFilter,
    filteredUsers,
    setSearchTerm,
    setRoleFilter,
    setStatusFilter
  } = useUserFilters(users);
  
  // Dialog states
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userProfileDialogOpen, setUserProfileDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

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

  const handleEditUser = (user: AppUser) => {
    setSelectedUser(user);
    setEditUserDialogOpen(true);
  };

  const handleDeleteUser = (user: AppUser) => {
    setSelectedUser(user);
    setDeleteUserDialogOpen(true);
  };

  const handleViewUser = (user: AppUser) => {
    setSelectedUser(user);
    setUserProfileDialogOpen(true);
  };

  const handleUserCreated = () => {
    refetchUsers();
  };

  const handleUserUpdated = () => {
    refetchUsers();
  };

  const handleUserDeleted = () => {
    refetchUsers();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TabNavigation 
        onSignOut={handleSignOut}
        userProfile={userProfile}
        user={user}
        isAdmin={isAdmin()}
      />

      <div className="p-6">
        <Card className="rounded-none">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">
                Όλοι οι Χρήστες ({filteredUsers.length})
              </CardTitle>
              <Button 
                className="rounded-none"
                onClick={() => setNewUserDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Νέος Χρήστης
              </Button>
            </div>
            
            <UserFilters
              searchTerm={searchTerm}
              roleFilter={roleFilter}
              statusFilter={statusFilter}
              onSearchChange={setSearchTerm}
              onRoleFilterChange={setRoleFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 && (searchTerm || roleFilter !== "all" || statusFilter !== "all") ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  Δεν βρέθηκαν χρήστες με τα επιλεγμένα κριτήρια
                </p>
              </div>
            ) : (
              <UserTable
                users={filteredUsers}
                loading={loadingUsers}
                onViewUser={handleViewUser}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
              />
            )}
          </CardContent>
        </Card>

        <UserDialogs
          newUserDialogOpen={newUserDialogOpen}
          editUserDialogOpen={editUserDialogOpen}
          deleteUserDialogOpen={deleteUserDialogOpen}
          userProfileDialogOpen={userProfileDialogOpen}
          selectedUser={selectedUser}
          onNewUserDialogClose={() => setNewUserDialogOpen(false)}
          onEditUserDialogClose={() => setEditUserDialogOpen(false)}
          onDeleteUserDialogClose={() => setDeleteUserDialogOpen(false)}
          onUserProfileDialogClose={() => setUserProfileDialogOpen(false)}
          onUserCreated={handleUserCreated}
          onUserUpdated={handleUserUpdated}
          onUserDeleted={handleUserDeleted}
        />
      </div>
    </div>
  );
};

export default Users;
