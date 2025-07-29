import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, User, CheckCircle, Clock } from "lucide-react";

export const ShopManagement: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgedSet, setAcknowledgedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkUserRole();
  }, []);

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      loadPayments();
    } else if (!roleLoading) {
      setLoading(false);
    }
  }, [roleLoading, isAdmin]);

  const checkUserRole = async () => {
    try {
      console.log('🔍 Checking user role...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('❌ No authenticated user found');
        setIsAdmin(false);
        setRoleLoading(false);
        return;
      }

      console.log('👤 Authenticated user:', user.id);

      // Check if user is admin in app_users table
      const { data: appUser, error } = await supabase
        .from('app_users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        console.error('❌ Error checking user role:', error);
        setIsAdmin(false);
      } else {
        console.log('✅ User role:', appUser?.role);
        setIsAdmin(appUser?.role === 'admin');
      }
    } catch (error) {
      console.error('💥 Error in checkUserRole:', error);
      setIsAdmin(false);
    } finally {
      setRoleLoading(false);
    }
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading payments...');
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          app_users!inner(name, email),
          subscription_types(name, description)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading payments:', error);
        throw error;
      }
      
      console.log('✅ Loaded payments:', data);
      setPayments(data || []);
    } catch (error) {
      console.error('💥 Error loading payments:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των αγορών');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgePayment = (paymentId: string) => {
    setAcknowledgedSet(prev => new Set([...prev, paymentId]));
    toast.success('Ενημερώθηκα για την αγορά');
  };

  const getNewPayments = () => {
    return payments.filter(payment => !acknowledgedSet.has(payment.id));
  };

  const getAcknowledgedPayments = () => {
    return payments.filter(payment => acknowledgedSet.has(payment.id));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Ολοκληρώθηκε';
      case 'pending':
        return 'Εκκρεμεί';
      case 'failed':
        return 'Αποτυχία';
      default:
        return status;
    }
  };

  if (roleLoading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
            <p className="mt-2 text-gray-600">Ελέγχουμε τα δικαιώματα...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <div className="text-center py-8 text-red-600">
            <p>Δεν έχετε δικαιώματα διαχειριστή για να δείτε αυτή τη σελίδα.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
            <p className="mt-2 text-gray-600">Φορτώνω τις αγορές...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const newPayments = getNewPayments();
  const acknowledgedPaymentsList = getAcknowledgedPayments();

  return (
    <div className="space-y-6">
      {/* Νέες Αγορές */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Νέες Αγορές</span>
              {newPayments.length > 0 && (
                <Badge className="bg-red-100 text-red-800 rounded-none">
                  {newPayments.length}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {newPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Δεν υπάρχουν νέες αγορές</p>
            </div>
          ) : (
            <div className="space-y-4">
              {newPayments.map((payment) => (
                <div key={payment.id} className="border rounded-none p-4 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4" />
                        <h4 className="font-semibold text-lg">{payment.app_users?.name}</h4>
                        <Badge className={`rounded-none ${getStatusColor(payment.status)}`}>
                          {getStatusText(payment.status)}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <div><strong>Email:</strong> {payment.app_users?.email}</div>
                        <div><strong>Συνδρομή:</strong> {payment.subscription_types?.name}</div>
                        <div><strong>Ποσό:</strong> €{payment.amount}</div>
                        <div><strong>Μέθοδος Πληρωμής:</strong> {payment.payment_method}</div>
                        <div><strong>Ημερομηνία:</strong> {formatDate(payment.payment_date)}</div>
                        {payment.offer_id && (
                          <div className="text-[#00ffba]"><strong>Προσφορά</strong></div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcknowledgePayment(payment.id)}
                        className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Ενημερώθηκα
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ενημερωμένες Αγορές */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>Ενημερωμένες Αγορές</span>
            {acknowledgedPaymentsList.length > 0 && (
              <Badge className="bg-green-100 text-green-800 rounded-none">
                {acknowledgedPaymentsList.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {acknowledgedPaymentsList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Δεν υπάρχουν ενημερωμένες αγορές</p>
            </div>
          ) : (
            <div className="space-y-4">
              {acknowledgedPaymentsList.map((payment) => (
                <div key={payment.id} className="border rounded-none p-4 bg-gradient-to-r from-green-50 to-blue-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4" />
                        <h4 className="font-semibold text-lg">{payment.app_users?.name}</h4>
                        <Badge className={`rounded-none ${getStatusColor(payment.status)}`}>
                          {getStatusText(payment.status)}
                        </Badge>
                        <Badge className="bg-green-100 text-green-800 rounded-none">
                          Ενημερώθηκα
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <div><strong>Email:</strong> {payment.app_users?.email}</div>
                        <div><strong>Συνδρομή:</strong> {payment.subscription_types?.name}</div>
                        <div><strong>Ποσό:</strong> €{payment.amount}</div>
                        <div><strong>Μέθοδος Πληρωμής:</strong> {payment.payment_method}</div>
                        <div><strong>Ημερομηνία:</strong> {formatDate(payment.payment_date)}</div>
                        {payment.offer_id && (
                          <div className="text-[#00ffba]"><strong>Προσφορά</strong></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};