import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Video, Plus, Trash2, Search, Calendar, Minus } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

interface User {
  id: string;
  name: string;
  email: string;
}

interface VideocallSession {
  id: string;
  user_id: string;
  videocall_date: string;
  videocall_time: string;
  videocall_type: string;
  notes?: string;
  created_at: string;
  app_users: {
    name: string;
    email: string;
  };
}

interface VideocallPackage {
  id: string;
  user_id: string;
  total_videocalls: number;
  remaining_videocalls: number;
  status: string;
  purchase_date: string;
  expiry_date?: string;
  app_users: {
    name: string;
    email: string;
  };
}

export const VideocallManagement: React.FC = () => {
  const [videocalls, setVideocalls] = useState<VideocallSession[]>([]);
  const [videocallPackages, setVideocallPackages] = useState<VideocallPackage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [videocallCount, setVideocallCount] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'packages' | 'manual' | 'history'>('packages');
  const [showAddPackageForm, setShowAddPackageForm] = useState(false);
  const [packageVideocalls, setPackageVideocalls] = useState<string>('');
  const [packageExpiryDate, setPackageExpiryDate] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Φόρτωση βιντεοκλήσεων
      const { data: videocallsData, error: videocallsError } = await supabase
        .from('user_videocalls')
        .select(`
          id,
          user_id,
          videocall_date,
          videocall_time,
          videocall_type,
          notes,
          created_at,
          app_users (name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (videocallsError) throw videocallsError;
      setVideocalls(videocallsData || []);

      // Φόρτωση videocall packages
      const { data: packagesData, error: packagesError } = await supabase
        .from('videocall_packages')
        .select(`
          id,
          user_id,
          total_videocalls,
          remaining_videocalls,
          status,
          purchase_date,
          expiry_date,
          app_users (name, email)
        `)
        .order('created_at', { ascending: false });

      if (packagesError) throw packagesError;
      setVideocallPackages(packagesData || []);

      // Φόρτωση χρηστών
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('id, name, email')
        .neq('role', 'admin')
        .order('name');

      if (usersError) throw usersError;
      setUsers(usersData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Σφάλμα φόρτωσης δεδομένων');
    } finally {
      setLoading(false);
    }
  };

  const recordManualVideocall = async () => {
    if (!selectedUserId) {
      toast.error('Παρακαλώ επιλέξτε χρήστη');
      return;
    }

    setSaving(true);
    try {
      // Καταγραφή πολλαπλών βιντεοκλήσεων
      for (let i = 0; i < videocallCount; i++) {
        const { error } = await supabase.rpc('record_videocall', {
          p_user_id: selectedUserId,
          p_videocall_type: 'manual',
          p_notes: notes || null
        });

        if (error) throw error;
      }

      toast.success(`${videocallCount === 1 ? 'Η βιντεοκλήση προστέθηκε' : `${videocallCount} βιντεοκλήσεις προστέθηκαν`} επιτυχώς!`);
      resetForm();
      fetchData();
      
    } catch (error) {
      console.error('Error recording videocall:', error);
      toast.error('Σφάλμα κατά την αποθήκευση');
    } finally {
      setSaving(false);
    }
  };

  const addVideocallPackage = async () => {
    if (!selectedUserId || !packageVideocalls) {
      toast.error('Παρακαλώ επιλέξτε χρήστη και αριθμό βιντεοκλήσεων');
      return;
    }

    try {
      const { error } = await supabase
        .from('videocall_packages')
        .insert({
          user_id: selectedUserId,
          total_videocalls: parseInt(packageVideocalls),
          remaining_videocalls: parseInt(packageVideocalls),
          expiry_date: packageExpiryDate || null
        });

      if (error) throw error;

      toast.success('Το πακέτο βιντεοκλήσεων προστέθηκε επιτυχώς!');
      
      // Reset form
      setShowAddPackageForm(false);
      setSelectedUserId('');
      setPackageVideocalls('');
      setPackageExpiryDate('');
      setUserSearchTerm('');
      fetchData();
      
    } catch (error) {
      console.error('Error adding videocall package:', error);
      toast.error('Σφάλμα προσθήκης πακέτου βιντεοκλήσεων');
    }
  };

  const addVideocallToPackage = async (packageId: string, userId: string) => {
    try {
      const { error } = await supabase.rpc('record_videocall', {
        p_user_id: userId,
        p_videocall_type: 'package',
        p_notes: 'Προσθήκη από πακέτο βιντεοκλήσεων'
      });

      if (error) throw error;

      toast.success('Η βιντεοκλήση προστέθηκε επιτυχώς!');
      fetchData();
      
    } catch (error) {
      console.error('Error adding videocall to package:', error);
      toast.error('Σφάλμα προσθήκης βιντεοκλήσης');
    }
  };

  const removeVideocallFromPackage = async (userId: string) => {
    try {
      // Βρίσκουμε την τελευταία βιντεοκλήση για αυτόν τον χρήστη
      const { data: latestVideocall, error: fetchError } = await supabase
        .from('user_videocalls')
        .select('id, user_id, videocall_type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!latestVideocall) {
        toast.error('Δεν βρέθηκε βιντεοκλήση για διαγραφή');
        return;
      }

      // Διαγράφουμε την τελευταία βιντεοκλήση
      const { error } = await supabase
        .from('user_videocalls')
        .delete()
        .eq('id', latestVideocall.id);

      if (error) throw error;

      // Ενημερώνουμε το πακέτο - αυξάνουμε τις διαθέσιμες βιντεοκλήσεις
      const { data: currentPackage, error: fetchPackageError } = await supabase
        .from('videocall_packages')
        .select('remaining_videocalls')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (fetchPackageError) throw fetchPackageError;

      if (!currentPackage) {
        toast.error('Δεν βρέθηκε ενεργό πακέτο για τον χρήστη');
        return;
      }

      const { error: updateError } = await supabase
        .from('videocall_packages')
        .update({ remaining_videocalls: currentPackage.remaining_videocalls + 1 })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (updateError) throw updateError;

      toast.success('Η βιντεοκλήση αφαιρέθηκε επιτυχώς από το ιστορικό!');
      fetchData();
      
    } catch (error) {
      console.error('Error removing videocall from package:', error);
      toast.error('Σφάλμα αφαίρεσης βιντεοκλήσης');
    }
  };

  const deleteVideocall = async (videocallId: string) => {
    try {
      // Πρώτα παίρνουμε τη βιντεοκλήση για να ελέγξουμε αν πρέπει να ενημερώσουμε πακέτο
      const { data: videocallData, error: fetchError } = await supabase
        .from('user_videocalls')
        .select('user_id, videocall_type')
        .eq('id', videocallId)
        .single();

      if (fetchError) throw fetchError;

      // Διαγραφή της βιντεοκλήσης
      const { error } = await supabase
        .from('user_videocalls')
        .delete()
        .eq('id', videocallId);

      if (error) throw error;

      // Αν ήταν package videocall, ενημερώνουμε το πακέτο
      if (videocallData.videocall_type === 'package' || videocallData.videocall_type === 'manual') {
        const { data: currentPackage, error: packageError } = await supabase
          .from('videocall_packages')
          .select('remaining_videocalls')
          .eq('user_id', videocallData.user_id)
          .eq('status', 'active')
          .maybeSingle();

        if (!packageError && currentPackage) {
          const { error: updateError } = await supabase
            .from('videocall_packages')
            .update({ remaining_videocalls: currentPackage.remaining_videocalls + 1 })
            .eq('user_id', videocallData.user_id)
            .eq('status', 'active');

          if (updateError) {
            console.error('Error updating package:', updateError);
          }
        }
      }

      toast.success('Η βιντεοκλήση διαγράφηκε επιτυχώς!');
      fetchData();
      
    } catch (error) {
      console.error('Error deleting videocall:', error);
      toast.error('Σφάλμα διαγραφής βιντεοκλήσης');
    }
  };

  const resetForm = () => {
    setSelectedUserId('');
    setNotes('');
    setUserSearchTerm('');
    setVideocallCount(1);
    setPackageVideocalls('');
    setPackageExpiryDate('');
  };

  const filteredVideocalls = videocalls.filter(videocall => {
    const userName = videocall.app_users?.name || '';
    const userEmail = videocall.app_users?.email || '';
    return userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           userEmail.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
            <p className="mt-2 text-gray-600">Φορτώνω τις βιντεοκλήσεις...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-600" />
            <span>Διαχείριση Βιντεοκλήσεων</span>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setActiveTab('packages')}
              variant={activeTab === 'packages' ? 'default' : 'outline'}
              className="rounded-none"
            >
              Πακέτα
            </Button>
            <Button 
              onClick={() => setActiveTab('manual')}
              variant={activeTab === 'manual' ? 'default' : 'outline'}
              className="rounded-none"
            >
              Χειροκίνητη
            </Button>
            <Button 
              onClick={() => setActiveTab('history')}
              variant={activeTab === 'history' ? 'default' : 'outline'}
              className="rounded-none"
            >
              Ιστορικό
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeTab === 'packages' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Πακέτα Βιντεοκλήσεων</h3>
              <Button 
                onClick={() => setShowAddPackageForm(!showAddPackageForm)}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                <Plus className="w-4 h-4 mr-2" />
                Νέο Πακέτο
              </Button>
            </div>

            {showAddPackageForm && (
              <Card className="rounded-none border-2 border-dashed">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-4">Προσθήκη Νέου Πακέτου</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Input
                        placeholder="Αναζήτηση χρήστη..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="rounded-none"
                      />
                    </div>
                    <div>
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full p-2 border rounded-none"
                      >
                        <option value="">Επιλέξτε χρήστη</option>
                        {users
                          .filter(user => 
                            user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
                          )
                          .map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Αριθμός βιντεοκλήσεων"
                        value={packageVideocalls}
                        onChange={(e) => setPackageVideocalls(e.target.value)}
                        className="rounded-none"
                      />
                    </div>
                    <div>
                      <Input
                        type="date"
                        placeholder="Ημερομηνία λήξης (προαιρετικό)"
                        value={packageExpiryDate}
                        onChange={(e) => setPackageExpiryDate(e.target.value)}
                        className="rounded-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={addVideocallPackage}
                      className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                    >
                      Προσθήκη
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddPackageForm(false);
                        resetForm();
                      }}
                      className="rounded-none"
                    >
                      Ακύρωση
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {videocallPackages.map((pkg) => (
                <Card key={pkg.id} className="rounded-none">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{pkg.app_users.name}</h4>
                        <p className="text-sm text-gray-500">{pkg.app_users.email}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm">
                            Βιντεοκλήσεις: {pkg.total_videocalls - pkg.remaining_videocalls}/{pkg.total_videocalls}
                          </span>
                          <Badge 
                            variant={pkg.status === 'active' ? 'default' : 'secondary'}
                            className="rounded-none"
                          >
                            {pkg.status === 'active' ? 'Ενεργό' : 'Χρησιμοποιημένο'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addVideocallToPackage(pkg.id, pkg.user_id)}
                          disabled={pkg.remaining_videocalls === 0}
                          className="rounded-none"
                          title="Προσθήκη χρησιμοποιημένης βιντεοκλήσης"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeVideocallFromPackage(pkg.user_id)}
                          disabled={pkg.total_videocalls - pkg.remaining_videocalls === 0}
                          className="rounded-none"
                          title="Αφαίρεση χρησιμοποιημένης βιντεοκλήσης"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Χειροκίνητη Προσθήκη Βιντεοκλήσης</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Αναζήτηση Χρήστη</label>
                <Input
                  placeholder="Αναζήτηση χρήστη..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="rounded-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Χρήστης</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full p-2 border rounded-none"
                >
                  <option value="">Επιλέξτε χρήστη</option>
                  {users
                    .filter(user => 
                      user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                      user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
                    )
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Αριθμός Βιντεοκλήσεων</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={videocallCount}
                  onChange={(e) => setVideocallCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="rounded-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Σημειώσεις</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-none"
                  placeholder="Προαιρετικές σημειώσεις..."
                />
              </div>
            </div>

            <Button
              onClick={recordManualVideocall}
              disabled={saving}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              {saving ? 'Αποθήκευση...' : 'Προσθήκη Βιντεοκλήσης'}
            </Button>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Ιστορικό Βιντεοκλήσεων</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Αναζήτηση χρήστη..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredVideocalls.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Video className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Δεν υπάρχουν βιντεοκλήσεις</h3>
                  <p>Δεν υπάρχουν καταχωρημένες βιντεοκλήσεις.</p>
                </div>
              ) : (
                filteredVideocalls.map((videocall) => (
                  <Card key={videocall.id} className="rounded-none">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-purple-100 p-2 rounded-full">
                            <Video className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {videocall.app_users?.name}
                            </h3>
                            <p className="text-sm text-gray-500">{videocall.app_users?.email}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="w-4 h-4 mr-1" />
                                {format(new Date(videocall.videocall_date), 'dd/MM/yyyy', { locale: el })}
                              </div>
                              <Badge className="rounded-none">
                                {videocall.videocall_type === 'manual' ? 'Χειροκίνητη' : 'Πακέτο'}
                              </Badge>
                            </div>
                            {videocall.notes && (
                              <p className="text-sm text-gray-600 mt-1">Σημειώσεις: {videocall.notes}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteVideocall(videocall.id)}
                          className="rounded-none text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};