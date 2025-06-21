
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewUserDialog } from "@/components/NewUserDialog";
import { EditUserDialog } from "@/components/EditUserDialog";
import { DeleteUserDialog } from "@/components/DeleteUserDialog";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { UsersHeader } from "./UsersHeader";
import { UsersFilters } from "./UsersFilters";
import { UsersTable } from "./UsersTable";
import { UserCard } from "./UserCard";
import { useUsersData } from "./hooks/useUsersData";
import { filterUsers } from "./utils";
import type { AppUser } from "./types";

const UsersPage = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, userProfile, loading: rolesLoading } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { users, loadingUsers, fetchUsers } = useUsersData();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Dialog states
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userProfileDialogOpen, setUserProfileDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

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

  const handleEditUser = (user: AppUser) => {
    console.log('✏️ Edit user:', user.id, user);
    setSelectedUser(user);
    setEditUserDialogOpen(true);
  };

  const handleDeleteUser = (user: AppUser) => {
    console.log('🗑️ Delete user:', user.id);
    setSelectedUser(user);
    setDeleteUserDialogOpen(true);
  };

  const handleViewUser = (user: AppUser) => {
    console.log('👁️ View user:', user.id);
    setSelectedUser(user);
    setUserProfileDialogOpen(true);
  };

  const handleUserCreated = () => {
    console.log('✅ User created, refreshing list');
    fetchUsers();
  };

  const handleUserUpdated = () => {
    console.log('✅ User updated, refreshing list');
    fetchUsers();
    setEditUserDialogOpen(false);
    setSelectedUser(null);
  };

  const handleUserDeleted = () => {
    console.log('✅ User deleted, refreshing list');
    fetchUsers();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const filteredUsers = filterUsers(users, searchTerm, roleFilter, statusFilter);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="flex-1 flex flex-col">
        <UsersHeader
          userProfile={userProfile}
          user={user}
          onSignOut={handleSignOut}
        />

        <div className="flex-1 p-3 md:p-6">
          <Card className="rounded-none">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0">
                <CardTitle className="text-base md:text-lg font-semibold">
                  Όλοι οι Χρήστες ({filteredUsers.length})
                </CardTitle>
                <Button 
                  className="rounded-none text-xs md:text-sm w-full md:w-auto"
                  onClick={() => setNewUserDialogOpen(true)}
                >
                  <Plus className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
                  Νέος Χρήστης
                </Button>
              </div>
              
              <UsersFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                roleFilter={roleFilter}
                setRoleFilter={setRoleFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="text-center py-6 md:py-8">
                  <p className="text-gray-600 text-sm md:text-base">Φόρτωση χρηστών...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <p className="text-gray-600 text-sm md:text-base">
                    {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                      ? "Δεν βρέθηκαν χρήστες με τα επιλεγμένα κριτήρια" 
                      : "Δεν βρέθηκαν χρήστες"}
                  </p>
                </div>
              ) : (
                <div>
                  {/* Mobile View - Cards */}
                  <div className="block md:hidden space-y-3">
                    {filteredUsers.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        onEdit={handleEditUser}
                        onDelete={handleDeleteUser}
                        onView={handleViewUser}
                      />
                    ))}
                  </div>

                  {/* Desktop/Tablet View - Table */}
                  <div className="hidden md:block">
                    <UsersTable
                      users={filteredUsers}
                      onEdit={handleEditUser}
                      onDelete={handleDeleteUser}
                      onView={handleViewUser}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <NewUserDialog
        isOpen={newUserDialogOpen}
        onClose={() => setNewUserDialogOpen(false)}
        onUserCreated={handleUserCreated}
      />
      
      <EditUserDialog
        isOpen={editUserDialogOpen}
        onClose={() => {
          setEditUserDialogOpen(false);
          setSelectedUser(null);
        }}
        onUserUpdated={handleUserUpdated}
        user={selectedUser}
      />
      
      <DeleteUserDialog
        isOpen={deleteUserDialogOpen}
        onClose={() => setDeleteUserDialogOpen(false)}
        onUserDeleted={handleUserDeleted}
        user={selectedUser}
      />

      <UserProfileDialog
        isOpen={userProfileDialogOpen}
        onClose={() => setUserProfileDialogOpen(false)}
        user={selectedUser}
      />
    </div>
  );
};

export default UsersPage;
