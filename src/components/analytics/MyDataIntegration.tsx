import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  TrendingUp, 
  Euro, 
  Calendar,
  Building2,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BankAccount {
  id: string;
  iban: string;
  bankName: string;
  accountType: string;
  balance?: number;
  currency: string;
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'debit' | 'credit';
  category?: string;
}

interface PaymentData {
  subscriptionPayments: Transaction[];
  totalRevenue: number;
  monthlyRevenue: number;
  averagePayment: number;
  paymentTrends: Array<{ month: string; amount: number }>;
}

export const MyDataIntegration: React.FC = () => {
  const [clientId, setClientId] = useState(localStorage.getItem('mydata_client_id') || '');
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (clientId) {
      setConnected(true);
      fetchBankData();
    }
  }, []);

  const handleConnect = async () => {
    if (!clientId) {
      toast.error('Παρακαλώ εισάγετε το MyData Client ID');
      return;
    }

    localStorage.setItem('mydata_client_id', clientId);
    
    // Προσομοίωση MyData OAuth flow
    const authUrl = `https://www.mydata.gr/oauth/authorize?client_id=${clientId}&response_type=code&scope=account-info payments&redirect_uri=${encodeURIComponent(window.location.origin + '/dashboard/subscriptions')}`;
    
    toast.success('Ανακατεύθυνση στο MyData για έγκριση...');
    // window.open(authUrl, '_blank');
    
    // Για demo σκοπούς, θα προσομοιώσουμε επιτυχή σύνδεση
    setTimeout(() => {
      setConnected(true);
      fetchBankData();
      toast.success('Επιτυχής σύνδεση με MyData!');
    }, 2000);
  };

  const fetchBankData = async () => {
    setLoading(true);
    try {
      // Προσομοίωση κλήσης MyData API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data για demo
      const mockAccounts: BankAccount[] = [
        {
          id: '1',
          iban: 'GR16 0110 1250 0000 0001 2345 67',
          bankName: 'Εθνική Τράπεζα',
          accountType: 'Επιχειρηματικός',
          balance: 15420.50,
          currency: 'EUR'
        },
        {
          id: '2',
          iban: 'GR96 0140 1250 1250 0200 2001 177',
          bankName: 'Alpha Bank',
          accountType: 'Ταμιευτήριο',
          balance: 3250.75,
          currency: 'EUR'
        }
      ];

      const mockPaymentData: PaymentData = {
        subscriptionPayments: [
          { id: '1', date: '2024-01-15', amount: 49.99, description: 'Premium Subscription', type: 'credit', category: 'subscription' },
          { id: '2', date: '2024-01-20', amount: 29.99, description: 'Basic Subscription', type: 'credit', category: 'subscription' },
          { id: '3', date: '2024-02-10', amount: 99.99, description: 'Pro Subscription', type: 'credit', category: 'subscription' },
        ],
        totalRevenue: 2340.50,
        monthlyRevenue: 890.25,
        averagePayment: 54.75,
        paymentTrends: [
          { month: 'Ιαν', amount: 650.30 },
          { month: 'Φεβ', amount: 890.25 },
          { month: 'Μαρ', amount: 1200.80 },
          { month: 'Απρ', amount: 945.60 }
        ]
      };

      setAccounts(mockAccounts);
      setPaymentData(mockPaymentData);
      
      // Αποθήκευση δεδομένων στη βάση
      await supabase.from('payments').upsert({
        user_id: '1', // Θα πρέπει να έρθει από το auth context
        amount: mockPaymentData.monthlyRevenue,
        payment_method: 'MyData Bank Transfer',
        transaction_id: `mydata_${Date.now()}`,
        status: 'completed'
      });

      toast.success('Δεδομένα MyData ενημερώθηκαν!');
    } catch (error) {
      console.error('MyData fetch error:', error);
      toast.error('Σφάλμα στη λήψη δεδομένων από MyData');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('mydata_client_id');
    setClientId('');
    setConnected(false);
    setAccounts([]);
    setPaymentData(null);
    toast.success('Αποσύνδεση από MyData');
  };

  if (!connected) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#00ffba]" />
            MyData Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">MyData Client ID</label>
            <Input
              placeholder="Εισάγετε το Client ID από το MyData Portal"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="rounded-none"
            />
          </div>
          <Button 
            onClick={handleConnect}
            className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            Σύνδεση με MyData
          </Button>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-none">
            <p className="text-sm text-blue-800">
              ℹ️ Το MyData είναι το επίσημο σύστημα Open Banking της Ελλάδας. Συνδέστε τους τραπεζικούς σας λογαριασμούς για αυτόματη παρακολούθηση πληρωμών συνδρομών.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#00ffba]" />
              MyData Banking Integration
              <Badge className="bg-green-100 text-green-800">Συνδεδεμένο</Badge>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDisconnect}
              className="rounded-none"
            >
              Αποσύνδεση
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="accounts" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-none">
              <TabsTrigger value="accounts" className="rounded-none">Λογαριασμοί</TabsTrigger>
              <TabsTrigger value="payments" className="rounded-none">Πληρωμές</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-none">Αναλυτικά</TabsTrigger>
            </TabsList>
            
            <TabsContent value="accounts" className="mt-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Συνδεδεμένοι Λογαριασμοί</h4>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin h-6 w-6 border-2 border-[#00ffba] border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : (
                  accounts.map((account) => (
                    <div key={account.id} className="border border-gray-200 p-4 rounded-none">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">{account.bankName}</h5>
                          <p className="text-sm text-gray-600">{account.iban}</p>
                          <p className="text-xs text-gray-500">{account.accountType}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">€{account.balance?.toLocaleString()}</p>
                          <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="payments" className="mt-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Πρόσφατες Πληρωμές Συνδρομών</h4>
                {paymentData?.subscriptionPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-none">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-[#00ffba]" />
                      <div>
                        <p className="font-medium">{payment.description}</p>
                        <p className="text-xs text-gray-500">{payment.date}</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600">+€{payment.amount}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-6">
              {paymentData && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-none">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Συνολικά Έσοδα</p>
                        <p className="text-2xl font-bold text-blue-600">€{paymentData.totalRevenue.toLocaleString()}</p>
                      </div>
                      <Euro className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-none">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Μηνιαία Έσοδα</p>
                        <p className="text-2xl font-bold text-blue-600">€{paymentData.monthlyRevenue.toLocaleString()}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-none">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Μέση Πληρωμή</p>
                        <p className="text-2xl font-bold">€{paymentData.averagePayment}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-[#00ffba]" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-none">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Τάση</p>
                        <p className="text-2xl font-bold text-green-600">+15%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={fetchBankData}
                disabled={loading}
                className="w-full mt-6 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                Ανανέωση Δεδομένων MyData
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => window.open('https://www.mydata.gr', '_blank')}
          className="rounded-none"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          MyData Portal
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.open('https://developer.mydata.gr', '_blank')}
          className="rounded-none"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Developer Documentation
        </Button>
      </div>
    </div>
  );
};