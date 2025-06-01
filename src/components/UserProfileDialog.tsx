import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Dumbbell, CreditCard } from "lucide-react";

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export const UserProfileDialog = ({ isOpen, onClose, user }: UserProfileDialogProps) => {
  const [stats, setStats] = useState({
    athletesCount: 0,
    programsCount: 0,
    testsCount: 0,
    paymentsCount: 0
  });
  const [programs, setPrograms] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (user && isOpen) {
      fetchUserStats();
      fetchUserPrograms();
      fetchUserTests();
      fetchUserPayments();
    }
  }, [user, isOpen]);

  const fetchUserStats = async () => {
    try {
      // Count athletes if user is trainer
      let athletesCount = 0;
      if (user.role === 'trainer') {
        const { count } = await supabase
          .from('app_users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'athlete');
        athletesCount = count || 0;
      }

      // Count programs created by user or assigned to user
      let programsCount = 0;
      
      if (user.role === 'trainer' || user.role === 'admin') {
        // For trainers/admins, count programs they created
        const { count } = await supabase
          .from('programs')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id);
        programsCount = count || 0;
      } else if (user.role === 'athlete' || user.role === 'general' || user.role === 'parent') {
        // For athletes, general, and parent users, count programs assigned to them
        const { count } = await supabase
          .from('program_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('athlete_id', user.id);
        programsCount = count || 0;
      }

      // Count tests if user is athlete
      let testsCount = 0;
      if (user.role === 'athlete') {
        const { count } = await supabase
          .from('tests')
          .select('*', { count: 'exact', head: true })
          .eq('athlete_id', user.id);
        testsCount = count || 0;
      }

      // Count payments
      const { count: paymentsCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('athlete_id', user.id);

      setStats({
        athletesCount,
        programsCount: programsCount,
        testsCount,
        paymentsCount: paymentsCount || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchUserPrograms = async () => {
    try {
      let data = null;
      
      if (user.role === 'trainer' || user.role === 'admin') {
        // For trainers/admins, fetch programs they created
        const { data: programsData } = await supabase
          .from('programs')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });
        data = programsData;
      } else if (user.role === 'athlete' || user.role === 'general' || user.role === 'parent') {
        // For athletes, general, and parent users, fetch programs assigned to them
        const { data: assignmentsData } = await supabase
          .from('program_assignments')
          .select(`
            *,
            programs(*)
          `)
          .eq('athlete_id', user.id)
          .order('created_at', { ascending: false });
        
        // Extract programs from assignments
        data = assignmentsData?.map(assignment => assignment.programs).filter(Boolean) || [];
      }
      
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchUserTests = async () => {
    try {
      if (user.role === 'athlete') {
        const { data } = await supabase
          .from('tests')
          .select('*')
          .eq('athlete_id', user.id)
          .order('created_at', { ascending: false });
        
        setTests(data || []);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const fetchUserPayments = async () => {
    try {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('athlete_id', user.id)
        .order('payment_date', { ascending: false });
      
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Προφίλ Χρήστη</DialogTitle>
          <DialogDescription>
            Στοιχεία και δραστηριότητες του χρήστη
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user.photo_url} alt={user.name} />
                  <AvatarFallback>
                    {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{user.name}</h3>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                    <Badge variant="outline">
                      {user.user_status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {user.role === 'trainer' && (
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                    <p className="text-2xl font-bold">{stats.athletesCount}</p>
                    <p className="text-sm text-gray-600">Αθλητές</p>
                  </div>
                )}
                <div className="text-center">
                  <Dumbbell className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold">{stats.programsCount}</p>
                  <p className="text-sm text-gray-600">
                    {(user.role === 'athlete' || user.role === 'general' || user.role === 'parent') ? 'Ανατεθέντα Προγράμματα' : 'Προγράμματα'}
                  </p>
                </div>
                {user.role === 'athlete' && (
                  <div className="text-center">
                    <Calendar className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                    <p className="text-2xl font-bold">{stats.testsCount}</p>
                    <p className="text-sm text-gray-600">Τεστ</p>
                  </div>
                )}
                <div className="text-center">
                  <CreditCard className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                  <p className="text-2xl font-bold">{stats.paymentsCount}</p>
                  <p className="text-sm text-gray-600">Πληρωμές</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Information Tabs */}
          <Tabs defaultValue="programs" className="w-full">
            <TabsList className={`grid w-full ${user.role === 'athlete' ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="programs">Προγράμματα</TabsTrigger>
              {user.role === 'athlete' && <TabsTrigger value="tests">Τεστ</TabsTrigger>}
              <TabsTrigger value="payments">Πληρωμές</TabsTrigger>
            </TabsList>
            
            <TabsContent value="programs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {(user.role === 'athlete' || user.role === 'general' || user.role === 'parent') ? 'Ανατεθέντα Προγράμματα' : 'Προγράμματα Προπόνησης'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {programs.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Δεν βρέθηκαν προγράμματα
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {programs.map((program) => (
                        <div key={program.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{program.name}</h4>
                              <p className="text-sm text-gray-600">{program.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Δημιουργήθηκε: {formatDate(program.created_at)}
                              </p>
                            </div>
                            <Badge variant="outline">{program.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {user.role === 'athlete' && (
              <TabsContent value="tests" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Τεστ Αξιολόγησης</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tests.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        Δεν βρέθηκαν τεστ
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {tests.map((test) => (
                          <div key={test.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{test.test_type || 'Τεστ'}</h4>
                                <p className="text-sm text-gray-600">{test.notes}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Ημερομηνία: {formatDate(test.date)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="payments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ιστορικό Πληρωμών</CardTitle>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Δεν βρέθηκαν πληρωμές
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {payments.map((payment) => (
                        <div key={payment.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">€{payment.amount}</h4>
                              <p className="text-sm text-gray-600">{payment.payment_method}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(payment.payment_date)}
                              </p>
                            </div>
                            <Badge variant="outline">{payment.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
