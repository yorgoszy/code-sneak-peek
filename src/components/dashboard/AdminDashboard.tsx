
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Users, UserPlus, Settings, BarChart3, Calendar, FileText } from 'lucide-react';

const AdminDashboard = () => {
  const { signOut, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [appUsers, setAppUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchAppUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles(role)
        `);
      
      setUsers(profiles || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAppUsers = async () => {
    try {
      const { data } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      setAppUsers(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching app users:', error);
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role: role,
          assigned_by: user?.id 
        });

      if (error) throw error;
      
      toast.success('Ο ρόλος ανατέθηκε επιτυχώς!');
      fetchUsers();
    } catch (error) {
      toast.error('Σφάλμα κατά την ανάθεση ρόλου');
      console.error('Error assigning role:', error);
    }
  };

  const stats = [
    {
      title: 'Συνολικοί Χρήστες',
      value: users.length,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Αθλητές',
      value: appUsers.filter(user => user.role === 'athlete').length,
      icon: UserPlus,
      color: 'text-green-600'
    },
    {
      title: 'Προπονητές',
      value: users.filter(user => user.user_roles?.[0]?.role === 'coach').length,
      icon: Settings,
      color: 'text-purple-600'
    },
    {
      title: 'Γονείς',
      value: users.filter(user => user.user_roles?.[0]?.role === 'parent').length,
      icon: Calendar,
      color: 'text-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Διαχείριση συστήματος και χρηστών</p>
            </div>
            <Button onClick={signOut} variant="outline">
              Αποσύνδεση
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Users Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Registered Users */}
          <Card>
            <CardHeader>
              <CardTitle>Εγγεγραμμένοι Χρήστες</CardTitle>
              <CardDescription>Διαχείριση ρόλων εγγεγραμμένων χρηστών</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200">
                    <div>
                      <p className="font-medium">{user.full_name || 'Άγνωστο όνομα'}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        Ρόλος: {user.user_roles?.[0]?.role || 'Χωρίς ρόλο'}
                      </p>
                    </div>
                    <Select onValueChange={(role) => assignRole(user.id, role)}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Ρόλος" />
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
                ))}
              </div>
            </CardContent>
          </Card>

          {/* App Users */}
          <Card>
            <CardHeader>
              <CardTitle>Χρήστες Εφαρμογής (app_users)</CardTitle>
              <CardDescription>Όλοι οι χρήστες στη βάση δεδομένων</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Όνομα</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ρόλος</TableHead>
                      <TableHead>Κατηγορία</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.category}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Γρήγορες Ενέργειες</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="h-20 flex flex-col items-center justify-center">
                <BarChart3 className="h-6 w-6 mb-2" />
                Αναφορές
              </Button>
              <Button className="h-20 flex flex-col items-center justify-center" variant="outline">
                <Calendar className="h-6 w-6 mb-2" />
                Προγραμματισμός
              </Button>
              <Button className="h-20 flex flex-col items-center justify-center" variant="outline">
                <FileText className="h-6 w-6 mb-2" />
                Εξαγωγή Δεδομένων
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
