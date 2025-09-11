import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Check, TestTube, Settings, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MyDataSettings {
  aadeUserId: string;
  subscriptionKey: string;
  vatNumber: string;
  environment: 'development' | 'production';
  enabled: boolean;
  autoSend: boolean;
}

export const MyDataSettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<MyDataSettings>({
    aadeUserId: '',
    subscriptionKey: '',
    vatNumber: '',
    environment: 'development',
    enabled: false,
    autoSend: false
  });
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    setSettings({
      aadeUserId: localStorage.getItem('mydata_aade_user_id') || '',
      subscriptionKey: localStorage.getItem('mydata_subscription_key') || '',
      vatNumber: localStorage.getItem('mydata_vat_number') || '',
      environment: (localStorage.getItem('mydata_environment') as 'development' | 'production') || 'development',
      enabled: localStorage.getItem('mydata_enabled') === 'true',
      autoSend: localStorage.getItem('mydata_auto_send') === 'true'
    });
  };

  const saveSettings = async () => {
    console.log('🔄 saveSettings called with:', settings);
    
    if (!settings.aadeUserId || !settings.subscriptionKey || !settings.vatNumber) {
      console.log('❌ Missing required fields:', {
        aadeUserId: !!settings.aadeUserId,
        subscriptionKey: !!settings.subscriptionKey,
        vatNumber: !!settings.vatNumber
      });
      
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα απαραίτητα πεδία",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ All fields valid, proceeding with save...');
    setLoading(true);
    
    try {
      localStorage.setItem('mydata_aade_user_id', settings.aadeUserId);
      localStorage.setItem('mydata_subscription_key', settings.subscriptionKey);
      localStorage.setItem('mydata_vat_number', settings.vatNumber);
      localStorage.setItem('mydata_environment', settings.environment);
      localStorage.setItem('mydata_enabled', settings.enabled.toString());
      localStorage.setItem('mydata_auto_send', settings.autoSend.toString());

      console.log('✅ Settings saved to localStorage');

      toast({
        title: "Επιτυχία",
        description: "Οι ρυθμίσεις MyData αποθηκεύτηκαν επιτυχώς! 🎉",
      });

      setConnectionStatus('unknown');
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά την αποθήκευση των ρυθμίσεων",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!settings.aadeUserId || !settings.subscriptionKey || !settings.vatNumber) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα απαραίτητα πεδία πρώτα",
        variant: "destructive"
      });
      return;
    }

    setTestLoading(true);
    
    try {
      // Δημιουργία test receipt
      const testReceipt = {
        issuer: {
          vatNumber: settings.vatNumber,
          country: "GR",
          branch: 0
        },
        invoiceHeader: {
          series: "TEST",
          aa: Math.floor(Math.random() * 1000) + 1,
          issueDate: new Date().toISOString().split('T')[0],
          invoiceType: "11.1",
          currency: "EUR"
        },
        invoiceDetails: [{
          lineNumber: 1,
          netValue: 1.00,
          vatCategory: 1,
          vatAmount: 0.24
        }],
        invoiceSummary: {
          totalNetValue: 1.00,
          totalVatAmount: 0.24,
          totalWithheldAmount: 0,
          totalFeesAmount: 0,
          totalStampDutyAmount: 0,
          totalOtherTaxesAmount: 0,
          totalDeductionsAmount: 0,
          totalGrossValue: 1.24
        }
      };

      const { data, error } = await supabase.functions.invoke('mydata-send-receipt', {
        body: {
          aadeUserId: settings.aadeUserId,
          subscriptionKey: settings.subscriptionKey,
          environment: settings.environment,
          receipt: testReceipt
        }
      });

      if (error) throw error;

      if (data.success) {
        setConnectionStatus('success');
        toast({
          title: "Επιτυχής σύνδεση",
          description: "Η σύνδεση με το MyData API λειτουργεί σωστά",
        });
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      setConnectionStatus('error');
      toast({
        title: "Σφάλμα σύνδεσης",
        description: error.message || "Δεν ήταν δυνατή η σύνδεση με το MyData API",
        variant: "destructive"
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">MyData AADE Integration</h2>
          <p className="text-gray-600">Διαχείριση σύνδεσης με την πλατφόρμα MyData της ΑΑΔΕ</p>
        </div>
        <Badge variant={settings.enabled ? "default" : "secondary"}>
          {settings.enabled ? "Ενεργό" : "Ανενεργό"}
        </Badge>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-none">
          <TabsTrigger value="settings" className="rounded-none">
            <Settings className="w-4 h-4 mr-2" />
            Ρυθμίσεις
          </TabsTrigger>
          <TabsTrigger value="guide" className="rounded-none">
            <ExternalLink className="w-4 h-4 mr-2" />
            Οδηγός Εγκατάστασης
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle>Στοιχεία Σύνδεσης MyData</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aadeUserId">AADE User ID</Label>
                  <Input
                    id="aadeUserId"
                    value={settings.aadeUserId}
                    onChange={(e) => setSettings(prev => ({ ...prev, aadeUserId: e.target.value }))}
                    placeholder="π.χ. gym_app_user"
                    className="rounded-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subscriptionKey">Subscription Key</Label>
                  <Input
                    id="subscriptionKey"
                    type="password"
                    value={settings.subscriptionKey}
                    onChange={(e) => setSettings(prev => ({ ...prev, subscriptionKey: e.target.value }))}
                    placeholder="Κλειδί συνδρομής από ΑΑΔΕ"
                    className="rounded-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vatNumber">ΑΦΜ Γυμναστηρίου</Label>
                  <Input
                    id="vatNumber"
                    value={settings.vatNumber}
                    onChange={(e) => setSettings(prev => ({ ...prev, vatNumber: e.target.value }))}
                    placeholder="π.χ. 123456789"
                    className="rounded-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environment">Περιβάλλον</Label>
                  <select
                    id="environment"
                    value={settings.environment}
                    onChange={(e) => setSettings(prev => ({ ...prev, environment: e.target.value as 'development' | 'production' }))}
                    className="w-full p-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-[#00ffba] focus:border-transparent"
                  >
                    <option value="development">Development (δοκιμαστικό)</option>
                    <option value="production">Production (παραγωγικό)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-none">
                <div>
                  <Label htmlFor="enabled">Ενεργοποίηση MyData</Label>
                  <p className="text-sm text-gray-600">Ενεργοποιεί τη σύνδεση με το MyData API</p>
                </div>
                <Switch
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-none">
                <div>
                  <Label htmlFor="autoSend">Αυτόματη Αποστολή</Label>
                  <p className="text-sm text-gray-600">Αυτόματη αποστολή αποδείξεων στο MyData κατά τη δημιουργία</p>
                </div>
                <Switch
                  id="autoSend"
                  checked={settings.autoSend}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoSend: checked }))}
                  disabled={!settings.enabled}
                />
              </div>

              {connectionStatus === 'success' && (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    Η σύνδεση με το MyData API λειτουργεί σωστά
                  </AlertDescription>
                </Alert>
              )}

              {connectionStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Σφάλμα σύνδεσης με το MyData API. Ελέγξτε τα στοιχεία σύνδεσης.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    console.log('🖱️ Button clicked!');
                    saveSettings();
                  }}
                  disabled={loading}
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  {loading ? "Αποθήκευση..." : "Αποθήκευση Ρυθμίσεων"}
                </Button>

                <Button
                  onClick={testConnection}
                  disabled={testLoading || !settings.aadeUserId || !settings.subscriptionKey}
                  variant="outline"
                  className="rounded-none"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testLoading ? "Έλεγχος..." : "Test Σύνδεσης"}
                </Button>

                <Button
                  onClick={() => window.open('https://mydata.aade.gr/timologio/Account/Login?culture=el-GR', '_blank')}
                  variant="outline"
                  className="rounded-none"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  E-timologio
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide">
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle>Οδηγός Εγκατάστασης MyData</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-[#00ffba] bg-gray-50">
                  <h3 className="font-semibold mb-2">Βήμα 1: Εγγραφή στο MyData Portal</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Συνδεθείτε στην πλατφόρμα MyData της ΑΑΔΕ και δημιουργήστε λογαριασμό API:
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      • <strong>Παραγωγικό:</strong> https://www1.aade.gr/saadeapps2/bookkeeper-web
                    </p>
                    <p className="text-sm">
                      • <strong>Δοκιμαστικό:</strong> https://mydata-dev-register.azurewebsites.net
                    </p>
                  </div>
                </div>

                <div className="p-4 border-l-4 border-[#00ffba] bg-gray-50">
                  <h3 className="font-semibold mb-2">Βήμα 2: Δημιουργία API User</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Στην πλατφόρμα MyData:
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Επιλέξτε "Εγγραφή στο myDATA REST API"</li>
                    <li>• Δημιουργήστε νέο χρήστη API (π.χ. "gym_app_user")</li>
                    <li>• Κρατήστε το User ID και το Subscription Key</li>
                  </ul>
                </div>

                <div className="p-4 border-l-4 border-[#00ffba] bg-gray-50">
                  <h3 className="font-semibold mb-2">Βήμα 3: Εισαγωγή Στοιχείων</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Εισάγετε τα στοιχεία που λάβατε από την ΑΑΔΕ στην καρτέλα "Ρυθμίσεις":
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• AADE User ID</li>
                    <li>• Subscription Key</li>
                    <li>• ΑΦΜ Γυμναστηρίου</li>
                    <li>• Επιλογή περιβάλλοντος (development/production)</li>
                  </ul>
                </div>

                <div className="p-4 border-l-4 border-[#00ffba] bg-gray-50">
                  <h3 className="font-semibold mb-2">Βήμα 4: Έλεγχος Σύνδεσης</h3>
                  <p className="text-sm text-gray-600">
                    Χρησιμοποιήστε το κουμπί "Test Σύνδεσης" για να επιβεβαιώσετε ότι η σύνδεση λειτουργεί σωστά.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => window.open('https://www1.aade.gr/saadeapps2/bookkeeper-web', '_blank')}
                  variant="outline"
                  className="rounded-none"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  MyData Portal (Production)
                </Button>

                <Button
                  onClick={() => window.open('https://mydata-dev-register.azurewebsites.net', '_blank')}
                  variant="outline"
                  className="rounded-none"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  MyData Portal (Development)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};