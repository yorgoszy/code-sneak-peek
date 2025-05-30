
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, UserCheck, UserPlus, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    athletes: 0,
    coaches: 0,
    parents: 0,
    general: 0,
  });
  const [appUsers, setAppUsers] = useState([]);
  const [newCode, setNewCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [invitationCodes, setInvitationCodes] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchAppUsers();
    fetchInvitationCodes();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role');

      if (userRoles) {
        const roleCount = userRoles.reduce((acc: any, curr: any) => {
          acc[curr.role] = (acc[curr.role] || 0) + 1;
          return acc;
        }, {});

        setStats({
          totalUsers: userRoles.length,
          athletes: roleCount.athlete || 0,
          coaches: roleCount.coach || 0,
          parents: roleCount.parent || 0,
          general: roleCount.general || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAppUsers = async () => {
    try {
      const { data } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      setAppUsers(data || []);
    } catch (error) {
      console.error('Error fetching app users:', error);
    }
  };

  const fetchInvitationCodes = async () => {
    try {
      const { data } = await supabase
        .from('invitation_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      setInvitationCodes(data || []);
    } catch (error) {
      console.error('Error fetching invitation codes:', error);
    }
  };

  const generateInvitationCode = async () => {
    if (!selectedRole) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε ρόλο",
        variant: "destructive",
      });
      return;
    }

    const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    try {
      const { error } = await supabase
        .from('invitation_codes')
        .insert({
          code: code,
          role: selectedRole as any,
          created_by: user?.id,
        });

      if (error) throw error;

      setNewCode(code);
      fetchInvitationCodes();
      
      toast({
        title: "Επιτυχία",
        description: `Νέος κωδικός πρόσκλησης: ${code}`,
      });
    } catch (error: any) {
      toast({
        title: "Σφάλμα",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Button onClick={signOut} variant="outline" style={{ borderRadius: '0px' }}>
            Αποσύνδεση
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Σύνολο Χρηστών</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Αθλητές</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.athletes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Προπονητές</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.coaches}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Γονείς</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.parents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">General</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.general}</div>
            </CardContent>
          </Card>
        </div>

        {/* Invitation Code Generator */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Δημιουργία Κωδικού Πρόσκλησης</CardTitle>
            <CardDescription>
              Δημιουργήστε νέο κωδικό πρόσκλησης για νέους χρήστες
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="role">Ρόλος</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Επιλέξτε ρόλο" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="athlete">Αθλητής</SelectItem>
                    <SelectItem value="coach">Προπονητής</SelectItem>
                    <SelectItem value="parent">Γονέας</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={generateInvitationCode} style={{ borderRadius: '0px' }}>
                Δημιουργία Κωδικού
              </Button>
            </div>
            {newCode && (
              <div className="p-4 bg-green-50 border border-green-200">
                <p className="font-medium">Νέος κωδικός: <span className="font-mono">{newCode}</span></p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* App Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Χρήστες Εφαρμογής (app_users)</CardTitle>
            <CardDescription>
              Λίστα όλων των χρηστών από τον πίνακα app_users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Όνομα</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Ρόλος</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Κατηγορία</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Κατάσταση</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Ημερομηνία</th>
                  </tr>
                </thead>
                <tbody>
                  {appUsers.map((user: any) => (
                    <tr key={user.id}>
                      <td className="border border-gray-300 px-4 py-2">{user.name}</td>
                      <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                      <td className="border border-gray-300 px-4 py-2">{user.role}</td>
                      <td className="border border-gray-300 px-4 py-2">{user.category || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2">{user.user_status}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {new Date(user.created_at).toLocaleDateString('el-GR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
