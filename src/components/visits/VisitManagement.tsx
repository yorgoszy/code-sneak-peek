import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Clock, User, Plus, Search, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QRScanner } from "@/components/qr/QRScanner";
import { UserQRCode } from "@/components/qr/UserQRCode";

interface Visit {
  id: string;
  user_id: string;
  visit_date: string;
  visit_time: string;
  visit_type: string;
  notes?: string;
  created_at: string;
  app_users: {
    name: string;
    email: string;
  };
}

interface VisitPackage {
  id: string;
  user_id: string;
  total_visits: number;
  remaining_visits: number;
  status: string;
  purchase_date: string;
  expiry_date?: string;
  app_users: {
    name: string;
    email: string;
  };
}

export const VisitManagement: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitPackages, setVisitPackages] = useState<VisitPackage[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'scanner' | 'manual' | 'packages' | 'history'>('scanner');
  const [selectedUserForQR, setSelectedUserForQR] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch visits
      const { data: visitsData, error: visitsError } = await supabase
        .from('user_visits')
        .select(`
          id,
          user_id,
          visit_date,
          visit_time,
          visit_type,
          notes,
          created_at,
          app_users!fk_user_visits_user_id (name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (visitsError) throw visitsError;
      setVisits(visitsData || []);

      // Fetch visit packages
      const { data: packagesData, error: packagesError } = await supabase
        .from('visit_packages')
        .select(`
          id,
          user_id,
          total_visits,
          remaining_visits,
          status,
          purchase_date,
          expiry_date,
          app_users!fk_visit_packages_user_id (name, email)
        `)
        .order('created_at', { ascending: false });

      if (packagesError) throw packagesError;
      setVisitPackages(packagesData || []);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('*')
        .order('name');

      if (usersError) throw usersError;
      setUsers(usersData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα φόρτωσης δεδομένων"
      });
    } finally {
      setLoading(false);
    }
  };

  const recordManualVisit = async () => {
    if (!selectedUser) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε χρήστη"
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('record_visit', {
        p_user_id: selectedUser,
        p_visit_type: 'manual',
        p_notes: notes || null
      });

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Η παρουσία καταγράφηκε επιτυχώς!"
      });
      setSelectedUser('');
      setNotes('');
      fetchData();
      
    } catch (error) {
      console.error('Error recording visit:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα καταγραφής παρουσίας"
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVisits = visits.filter(visit =>
    visit.app_users.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6 text-center">Φόρτωση...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setActiveTab('scanner')}
          variant={activeTab === 'scanner' ? 'default' : 'outline'}
          className="rounded-none"
        >
          <QrCode className="h-4 w-4 mr-2" />
          QR Scanner
        </Button>
        <Button
          onClick={() => setActiveTab('manual')}
          variant={activeTab === 'manual' ? 'default' : 'outline'}
          className="rounded-none"
        >
          <Plus className="h-4 w-4 mr-2" />
          Χειροκίνητη Καταγραφή
        </Button>
        <Button
          onClick={() => setActiveTab('packages')}
          variant={activeTab === 'packages' ? 'default' : 'outline'}
          className="rounded-none"
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          Πακέτα Επισκέψεων
        </Button>
        <Button
          onClick={() => setActiveTab('history')}
          variant={activeTab === 'history' ? 'default' : 'outline'}
          className="rounded-none"
        >
          <Clock className="h-4 w-4 mr-2" />
          Ιστορικό
        </Button>
      </div>

      {/* QR Scanner Tab */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          <QRScanner onScanSuccess={fetchData} />
          
          {/* Users with QR Codes */}
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle>QR Codes Χρηστών</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Αναζήτηση χρήστη..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-none"
                />
                
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-none">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <Button
                        onClick={() => setSelectedUserForQR(user)}
                        size="sm"
                        className="rounded-none"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Modal */}
          {selectedUserForQR && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-none max-w-sm w-full mx-4">
                <UserQRCode user={selectedUserForQR} />
                <Button
                  onClick={() => setSelectedUserForQR(null)}
                  className="w-full mt-4 rounded-none"
                  variant="outline"
                >
                  Κλείσιμο
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Recording Tab */}
      {activeTab === 'manual' && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>Χειροκίνητη Καταγραφή Παρουσίας</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Επιλογή Χρήστη</label>
              <Input
                placeholder="Αναζήτηση χρήστη..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-none mb-2"
              />
              <div className="max-h-40 overflow-y-auto border rounded-none">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user.id)}
                    className={`p-3 cursor-pointer hover:bg-gray-50 ${
                      selectedUser === user.id ? 'bg-[#00ffba]/10 border-l-4 border-[#00ffba]' : ''
                    }`}
                  >
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Σημειώσεις (Προαιρετικό)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Προσθέστε σημειώσεις για την παρουσία..."
                className="rounded-none"
              />
            </div>
            
            <Button
              onClick={recordManualVisit}
              disabled={!selectedUser}
              className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              <Plus className="h-4 w-4 mr-2" />
              Καταγραφή Παρουσίας
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Visit Packages Tab */}
      {activeTab === 'packages' && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>Πακέτα Επισκέψεων</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {visitPackages.map((pkg) => (
                <div key={pkg.id} className="border rounded-none p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{pkg.app_users.name}</h4>
                      <p className="text-sm text-gray-600">{pkg.app_users.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span>Σύνολο: {pkg.total_visits}</span>
                        <span>Υπόλοιπο: {pkg.remaining_visits}</span>
                        <span>Αγορά: {new Date(pkg.purchase_date).toLocaleDateString('el-GR')}</span>
                      </div>
                      {pkg.expiry_date && (
                        <p className="text-sm text-orange-600">
                          Λήξη: {new Date(pkg.expiry_date).toLocaleDateString('el-GR')}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant={pkg.status === 'active' ? 'default' : 'secondary'}
                      className="rounded-none"
                    >
                      {pkg.status === 'active' ? 'Ενεργό' : 
                       pkg.status === 'used' ? 'Εξαντλημένο' : 'Λήξη'}
                    </Badge>
                  </div>
                </div>
              ))}
              {visitPackages.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  Δεν υπάρχουν πακέτα επισκέψεων
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visit History Tab */}
      {activeTab === 'history' && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>Ιστορικό Παρουσιών</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Αναζήτηση χρήστη..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-none"
              />
              
              <div className="space-y-3">
                {filteredVisits.map((visit) => (
                  <div key={visit.id} className="border rounded-none p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {visit.app_users.name}
                        </h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(visit.visit_date).toLocaleDateString('el-GR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {visit.visit_time}
                          </span>
                        </div>
                        {visit.notes && (
                          <p className="text-sm text-gray-600 mt-1">{visit.notes}</p>
                        )}
                      </div>
                      <Badge 
                        variant={visit.visit_type === 'qr_scan' ? 'default' : 'outline'}
                        className="rounded-none"
                      >
                        {visit.visit_type === 'qr_scan' ? 'QR Scan' : 'Χειροκίνητη'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {filteredVisits.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Δεν υπάρχουν παρουσίες
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};