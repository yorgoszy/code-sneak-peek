
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Users, UserPlus, Settings, LogOut } from 'lucide-react';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  category: string;
  user_status: string;
  auth_user_id: string | null;
  created_at: string;
}

export const AdminDashboard = () => {
  const { signOut, user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New user form
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('general');
  const [newUserCategory, setNewUserCategory] = useState('general');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Σφάλμα",
          description: "Δεν μπόρεσα να φορτώσω τους χρήστες.",
          variant: "destructive",
        });
      } else {
        setUsers(data || []);
      }
    } catch (err) {
      console.error('Error in fetchUsers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('app_users')
        .insert({
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          category: newUserCategory,
          user_status: 'active'
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Σφάλμα",
          description: "Δεν μπόρεσα να δημιουργήσω τον χρήστη.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Επιτυχία",
          description: "Ο χρήστης δημιουργήθηκε επιτυχώς!",
        });
        
        // Reset form
        setNewUserName('');
        setNewUserEmail('');
        setNewUserRole('general');
        setNewUserCategory('general');
        
        // Refresh users list
        fetchUsers();
      }
    } catch (err) {
      console.error('Error creating user:', err);
      toast({
        title: "Σφάλμα",
        description: "Κάτι πήγε στραβά.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'coach':
        return 'default';
      case 'athlete':
        return 'secondary';
      case 'parent':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Καλώς ήρθες, {user?.email}
              </p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Αποσύνδεση
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Σύνολο Χρηστών</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Αθλητές</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.role === 'athlete').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Προπονητές</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.role === 'coach').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ενεργοί Χρήστες</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.user_status === 'active').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Χρήστες
            </TabsTrigger>
            <TabsTrigger value="create-user">
              <UserPlus className="mr-2 h-4 w-4" />
              Νέος Χρήστης
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Ρυθμίσεις
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Διαχείριση Χρηστών</CardTitle>
                <CardDescription>
                  Προβολή και διαχείριση όλων των χρηστών της πλατφόρμας
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Φόρτωση...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Όνομα</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Ρόλος</TableHead>
                        <TableHead>Κατηγορία</TableHead>
                        <TableHead>Κατάσταση</TableHead>
                        <TableHead>Εγγραφή Auth</TableHead>
                        <TableHead>Ημερομηνία</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeColor(user.role)}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.category}</TableCell>
                          <TableCell>
                            <Badge variant={user.user_status === 'active' ? 'default' : 'secondary'}>
                              {user.user_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.auth_user_id ? 'default' : 'outline'}>
                              {user.auth_user_id ? 'Ναι' : 'Όχι'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString('el-GR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-user">
            <Card>
              <CardHeader>
                <CardTitle>Δημιουργία Νέου Χρήστη</CardTitle>
                <CardDescription>
                  Προσθέστε έναν νέο χρήστη στην πλατφόρμα
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Πλήρες Όνομα</Label>
                      <Input
                        id="name"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        required
                        placeholder="Εισάγετε το πλήρες όνομα"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        required
                        placeholder="user@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Ρόλος</Label>
                      <Select value={newUserRole} onValueChange={setNewUserRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Επιλέξτε ρόλο" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="coach">Coach</SelectItem>
                          <SelectItem value="athlete">Athlete</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Κατηγορία</Label>
                      <Select value={newUserCategory} onValueChange={setNewUserCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Επιλέξτε κατηγορία" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="youth">Youth</SelectItem>
                          <SelectItem value="adult">Adult</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Δημιουργία Χρήστη
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Ρυθμίσεις Συστήματος</CardTitle>
                <CardDescription>
                  Γενικές ρυθμίσεις της πλατφόρμας
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Οι ρυθμίσεις του συστήματος θα είναι διαθέσιμες σύντομα.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
