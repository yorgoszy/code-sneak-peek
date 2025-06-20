
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Crown, Calendar, DollarSign, User, Plus, Edit2, Check, X } from "lucide-react";

interface SubscriptionType {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: any;
  is_active: boolean;
}

interface UserSubscription {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: string;
  notes: string;
  subscription_types: SubscriptionType;
  app_users: {
    name: string;
    email: string;
    subscription_status: string;
  };
}

export const SubscriptionManagement: React.FC = () => {
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedSubscriptionType, setSelectedSubscriptionType] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Φόρτωση τύπων συνδρομών
      const { data: types, error: typesError } = await supabase
        .from('subscription_types')
        .select('*')
        .order('price');

      if (typesError) throw typesError;
      setSubscriptionTypes(types || []);

      // Φόρτωση συνδρομών χρηστών
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_types (*),
          app_users (name, email, subscription_status)
        `)
        .order('created_at', { ascending: false });

      if (subscriptionsError) throw subscriptionsError;
      setUserSubscriptions(subscriptions || []);

      // Φόρτωση όλων των χρηστών
      const { data: allUsers, error: usersError } = await supabase
        .from('app_users')
        .select('id, name, email, subscription_status, role')
        .order('name');

      if (usersError) throw usersError;
      setUsers(allUsers || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των δεδομένων');
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async () => {
    if (!selectedUser || !selectedSubscriptionType) {
      toast.error('Επιλέξτε χρήστη και τύπο συνδρομής');
      return;
    }

    try {
      const subscriptionType = subscriptionTypes.find(t => t.id === selectedSubscriptionType);
      if (!subscriptionType) return;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + subscriptionType.duration_days);

      // Δημιουργία νέας συνδρομής
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: selectedUser,
          subscription_type_id: selectedSubscriptionType,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'active',
          notes: notes
        });

      if (subscriptionError) throw subscriptionError;

      // Ενημέρωση status χρήστη
      const { error: userError } = await supabase
        .from('app_users')
        .update({ subscription_status: 'active' })
        .eq('id', selectedUser);

      if (userError) throw userError;

      toast.success('Η συνδρομή δημιουργήθηκε επιτυχώς!');
      setIsDialogOpen(false);
      setSelectedUser('');
      setSelectedSubscriptionType('');
      setNotes('');
      loadData();

    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Σφάλμα κατά τη δημιουργία της συνδρομής');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ subscription_status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Ο χρήστης ${newStatus === 'active' ? 'ενεργοποιήθηκε' : 'απενεργοποιήθηκε'} επιτυχώς!`);
      loadData();

    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Σφάλμα κατά την ενημέρωση του χρήστη');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-600">Φορτώνω τα δεδομένα συνδρομών...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Διαχείριση Συνδρομών RID AI</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none">
              <Plus className="w-4 h-4 mr-2" />
              Νέα Συνδρομή
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none">
            <DialogHeader>
              <DialogTitle>Δημιουργία Νέας Συνδρομής</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user">Επιλογή Χρήστη</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Επιλέξτε χρήστη" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="subscriptionType">Τύπος Συνδρομής</Label>
                <Select value={selectedSubscriptionType} onValueChange={setSelectedSubscriptionType}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Επιλέξτε τύπο συνδρομής" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} - €{type.price} ({type.duration_days} ημέρες)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Σημειώσεις</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Προσθέστε σημειώσεις..."
                  className="rounded-none"
                />
              </div>

              <Button onClick={createSubscription} className="w-full rounded-none">
                Δημιουργία Συνδρομής
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Στατιστικά */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-none">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-[#00ffba]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ενεργές Συνδρομές</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userSubscriptions.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Συνολικοί Χρήστες</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Μηνιαίος Τζίρος</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{userSubscriptions
                    .filter(s => s.status === 'active')
                    .reduce((sum, s) => sum + (s.subscription_types?.price || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Λήγουν Σύντομα</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userSubscriptions.filter(s => {
                    const endDate = new Date(s.end_date);
                    const today = new Date();
                    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Λίστα χρηστών με συνδρομές */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Χρήστες & Συνδρομές</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Χρήστης</th>
                  <th className="text-left p-2">Συνδρομή</th>
                  <th className="text-left p-2">Κατάσταση</th>
                  <th className="text-left p-2">Λήξη</th>
                  <th className="text-left p-2">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const activeSubscription = userSubscriptions.find(
                    s => s.user_id === user.id && s.status === 'active'
                  );
                  
                  return (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        {activeSubscription ? (
                          <div>
                            <div className="font-medium">{activeSubscription.subscription_types?.name}</div>
                            <div className="text-sm text-gray-500">
                              €{activeSubscription.subscription_types?.price}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Χωρίς συνδρομή</span>
                        )}
                      </td>
                      <td className="p-2">
                        <Badge className={`rounded-none ${getStatusColor(user.subscription_status)}`}>
                          {user.subscription_status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        {activeSubscription ? (
                          <span className="text-sm">
                            {new Date(activeSubscription.end_date).toLocaleDateString('el-GR')}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleUserStatus(user.id, user.subscription_status)}
                          className="rounded-none"
                        >
                          {user.subscription_status === 'active' ? (
                            <>
                              <X className="w-3 h-3 mr-1" />
                              Απενεργοποίηση
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Ενεργοποίηση
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
