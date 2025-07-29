import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Send, Gift, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MagicBoxDistributionProps {
  campaignId: string;
  campaignName: string;
  onBack: () => void;
}

export const MagicBoxDistribution: React.FC<MagicBoxDistributionProps> = ({
  campaignId,
  campaignName,
  onBack
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterStatus]);

  const fetchUsers = async () => {
    try {
      // First get users who have magic boxes for this campaign
      const { data: usersWithBoxes, error: boxError } = await supabase
        .from('user_magic_boxes')
        .select(`
          user_id,
          is_opened,
          app_users!inner(id, name, email, subscription_status)
        `)
        .eq('campaign_id', campaignId);

      if (boxError) throw boxError;

      // Then get all users
      const { data: allUsers, error: allUsersError } = await supabase
        .from('app_users')
        .select('id, name, email, subscription_status')
        .order('name');

      if (allUsersError) throw allUsersError;

      // Combine and mark users who already have magic boxes
      const usersWithMagicBoxIds = usersWithBoxes?.map(u => u.user_id) || [];
      const enrichedUsers = allUsers?.map(user => {
        const magicBoxData = usersWithBoxes?.find(u => u.user_id === user.id);
        return {
          ...user,
          hasMagicBox: usersWithMagicBoxIds.includes(user.id),
          magicBoxOpened: magicBoxData?.is_opened || false
        };
      }) || [];

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία φόρτωσης χρηστών',
        variant: 'destructive'
      });
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    switch (filterStatus) {
      case 'active':
        filtered = filtered.filter(user => user.subscription_status === 'active');
        break;
      case 'inactive':
        filtered = filtered.filter(user => user.subscription_status !== 'active');
        break;
      case 'with_box':
        filtered = filtered.filter(user => user.hasMagicBox);
        break;
      case 'without_box':
        filtered = filtered.filter(user => !user.hasMagicBox);
        break;
    }

    setFilteredUsers(filtered);
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const usersWithoutBoxes = filteredUsers.filter(user => !user.hasMagicBox);
    setSelectedUsers(usersWithoutBoxes.map(user => user.id));
  };

  const handleDeselectAll = () => {
    setSelectedUsers([]);
  };

  const distributeMagicBoxes = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'Προειδοποίηση',
        description: 'Επιλέξτε τουλάχιστον έναν χρήστη',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const magicBoxes = selectedUsers.map(userId => ({
        user_id: userId,
        campaign_id: campaignId,
        is_opened: false,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('user_magic_boxes')
        .insert(magicBoxes);

      if (error) throw error;

      toast({
        title: 'Επιτυχία',
        description: `Διανεμήθηκαν ${selectedUsers.length} magic boxes επιτυχώς`
      });

      setSelectedUsers([]);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error distributing magic boxes:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία διανομής magic boxes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const usersWithoutBoxes = filteredUsers.filter(user => !user.hasMagicBox);
  const usersWithBoxes = filteredUsers.filter(user => user.hasMagicBox);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          className="rounded-none"
        >
          ← Πίσω στις Καμπάνιες
        </Button>
        <div className="text-right">
          <h2 className="text-lg font-semibold">{campaignName}</h2>
          <p className="text-sm text-gray-600">Διανομή Magic Boxes</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="rounded-none">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[#00ffba]">{users.length}</div>
            <div className="text-sm text-gray-600">Σύνολο Χρηστών</div>
          </CardContent>
        </Card>
        <Card className="rounded-none">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{usersWithBoxes.length}</div>
            <div className="text-sm text-gray-600">Με Magic Box</div>
          </CardContent>
        </Card>
        <Card className="rounded-none">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{usersWithoutBoxes.length}</div>
            <div className="text-sm text-gray-600">Χωρίς Magic Box</div>
          </CardContent>
        </Card>
        <Card className="rounded-none">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{selectedUsers.length}</div>
            <div className="text-sm text-gray-600">Επιλεγμένοι</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Φίλτρα & Αναζήτηση
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Αναζήτηση χρηστών</Label>
              <Input
                id="search"
                placeholder="Όνομα ή email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div>
              <Label htmlFor="filter">Φίλτρο κατάστασης</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Όλοι οι χρήστες</SelectItem>
                  <SelectItem value="active">Ενεργή συνδρομή</SelectItem>
                  <SelectItem value="inactive">Ανενεργή συνδρομή</SelectItem>
                  <SelectItem value="with_box">Με Magic Box</SelectItem>
                  <SelectItem value="without_box">Χωρίς Magic Box</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
              className="rounded-none"
              disabled={usersWithoutBoxes.length === 0}
            >
              Επιλογή όλων (χωρίς box)
            </Button>
            <Button
              onClick={handleDeselectAll}
              variant="outline"
              size="sm"
              className="rounded-none"
            >
              Αποεπιλογή όλων
            </Button>
            <Button
              onClick={distributeMagicBoxes}
              disabled={loading || selectedUsers.length === 0}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Διανομή...' : `Διανομή (${selectedUsers.length})`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Χρήστες ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center space-x-3 py-3 border-b last:border-b-0">
                <input
                  type="checkbox"
                  id={`user-${user.id}`}
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => handleUserToggle(user.id)}
                  disabled={user.hasMagicBox}
                  className="rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.name || 'Χωρίς όνομα'}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge 
                        variant={user.subscription_status === 'active' ? 'default' : 'secondary'} 
                        className="rounded-none text-xs"
                      >
                        {user.subscription_status === 'active' ? 'Ενεργός' : 'Ανενεργός'}
                      </Badge>
                      {user.hasMagicBox && (
                        <Badge 
                          variant={user.magicBoxOpened ? 'destructive' : 'default'} 
                          className="rounded-none text-xs"
                        >
                          <Gift className="w-3 h-3 mr-1" />
                          {user.magicBoxOpened ? 'Ανοίχθηκε' : 'Διαθέσιμο'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Δεν βρέθηκαν χρήστες με τα επιλεγμένα κριτήρια
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};