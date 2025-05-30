
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Edit, Trash2, Search, Filter } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewUserDialog } from "@/components/NewUserDialog";
import { EditUserDialog } from "@/components/EditUserDialog";
import { DeleteUserDialog } from "@/components/DeleteUserDialog";

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

const Users = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Dialog states
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

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
  }, []);

  const handleEditUser = (user: AppUser) => {
    setSelectedUser(user);
    setEditUserDialogOpen(true);
  };

  const handleDeleteUser = (user: AppUser) => {
    setSelectedUser(user);
    setDeleteUserDialogOpen(true);
  };

  const handleUserCreated = () => {
    fetchUsers();
  };

  const handleUserUpdated = () => {
    fetchUsers();
  };

  const handleUserDeleted = () => {
    fetchUsers();
  };

  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.user_status === statusFilter;
    const matchesCategory = categoryFilter === "all" || user.category === categoryFilter;
    
    return matchesSearch && matchesRole && matchesStatus && matchesCategory;
  });

  if (loading) {
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

  const isAdmin = userProfile?.role === 'admin' || user?.email === 'yorgoszy@gmail.com' || user?.email === 'info@hyperkids.gr';

  const handleSignOut = async () => {
    await signOut();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'trainer':
        return 'bg-blue-100 text-blue-800';
      case 'athlete':
        return 'bg-green-100 text-green-800';
      case 'general':
        return 'bg-purple-100 text-purple-800';
      case 'parent':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Users</h1>
              <p className="text-sm text-gray-600">
                Διαχείριση χρηστών συστήματος
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {userProfile?.name || user?.email}
                {isAdmin && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
              </span>
              <Button 
                variant="outline" 
                className="rounded-none"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Αποσύνδεση
              </Button>
            </div>
          </div>
        </nav>

        {/* Users Content */}
        <div className="flex-1 p-6">
          <Card>
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
              
              {/* Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Αναζήτηση χρηστών..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Φίλτρο ρόλου" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Όλοι οι ρόλοι</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="trainer">Trainer</SelectItem>
                    <SelectItem value="athlete">Athlete</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Φίλτρο κατάστασης" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Όλες οι καταστάσεις</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Φίλτρο κατηγορίας" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Όλες οι κατηγορίες</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="youth">Youth</SelectItem>
                    <SelectItem value="adult">Adult</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Φόρτωση χρηστών...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    {searchTerm || roleFilter !== "all" || statusFilter !== "all" || categoryFilter !== "all" 
                      ? "Δεν βρέθηκαν χρήστες με τα επιλεγμένα κριτήρια" 
                      : "Δεν βρέθηκαν χρήστες"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Όνομα</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ρόλος</TableHead>
                      <TableHead>Κατηγορία</TableHead>
                      <TableHead>Τηλέφωνο</TableHead>
                      <TableHead>Κατάσταση</TableHead>
                      <TableHead>Εγγραφή</TableHead>
                      <TableHead>Ενέργειες</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>{user.category || '-'}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded ${getStatusColor(user.user_status)}`}>
                            {user.user_status}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-none"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-none text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
        onClose={() => setEditUserDialogOpen(false)}
        onUserUpdated={handleUserUpdated}
        user={selectedUser}
      />
      
      <DeleteUserDialog
        isOpen={deleteUserDialogOpen}
        onClose={() => setDeleteUserDialogOpen(false)}
        onUserDeleted={handleUserDeleted}
        user={selectedUser}
      />
    </div>
  );
};

export default Users;
