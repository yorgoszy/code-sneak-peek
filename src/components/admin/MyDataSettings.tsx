import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, TestTube, ExternalLink, Edit2, Lock } from "lucide-react";
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
  const [isEditing, setIsEditing] = useState(true); // Αρχικά σε edit mode αν δεν υπάρχουν αποθηκευμένα

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = {
      aadeUserId: localStorage.getItem('mydata_aade_user_id') || '',
      subscriptionKey: localStorage.getItem('mydata_subscription_key') || '',
      vatNumber: localStorage.getItem('mydata_vat_number') || '',
      environment: (localStorage.getItem('mydata_environment') as 'development' | 'production') || 'development',
      enabled: localStorage.getItem('mydata_enabled') === 'true',
      autoSend: localStorage.getItem('mydata_auto_send') === 'true'
    };
    
    setSettings(savedSettings);
    
    // Αν υπάρχουν ήδη αποθηκευμένα στοιχεία, κλείδωσε τα πεδία
    const hasSettings = savedSettings.aadeUserId && savedSettings.subscriptionKey && savedSettings.vatNumber;
    setIsEditing(!hasSettings);
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
      setIsEditing(false); // Κλείδωμα πεδίων μετά την αποθήκευση
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

  const handleEditClick = () => {
    if (isEditing) {
      // Αποθήκευση
      saveSettings();
    } else {
      // Ξεκλείδωμα για επεξεργασία
      setIsEditing(true);
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

  // Mask sensitive data when locked
  const getMaskedValue = (value: string) => {
    if (!value) return '';
    if (value.length <= 4) return '****';
    return value.substring(0, 2) + '****' + value.substring(value.length - 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">MyData AADE Integration</h2>
          <p className="text-gray-600">Διαχείριση σύνδεσης με την πλατφόρμα MyData της ΑΑΔΕ</p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <Badge variant="outline" className="rounded-none">
              <Lock className="w-3 h-3 mr-1" />
              Κλειδωμένο
            </Badge>
          )}
          <Badge variant={settings.enabled ? "default" : "secondary"}>
            {settings.enabled ? "Ενεργό" : "Ανενεργό"}
          </Badge>
        </div>
      </div>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Στοιχεία Σύνδεσης MyData
            {!isEditing && (
              <Badge variant="secondary" className="text-xs rounded-none">
                Αποθηκευμένα
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aadeUserId">AADE User ID</Label>
              <Input
                id="aadeUserId"
                value={isEditing ? settings.aadeUserId : getMaskedValue(settings.aadeUserId)}
                onChange={(e) => setSettings(prev => ({ ...prev, aadeUserId: e.target.value }))}
                placeholder="π.χ. gym_app_user"
                className="rounded-none"
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriptionKey">Subscription Key</Label>
              <Input
                id="subscriptionKey"
                type={isEditing ? "password" : "text"}
                value={isEditing ? settings.subscriptionKey : getMaskedValue(settings.subscriptionKey)}
                onChange={(e) => setSettings(prev => ({ ...prev, subscriptionKey: e.target.value }))}
                placeholder="Κλειδί συνδρομής από ΑΑΔΕ"
                className="rounded-none"
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vatNumber">ΑΦΜ Γυμναστηρίου</Label>
              <Input
                id="vatNumber"
                value={isEditing ? settings.vatNumber : getMaskedValue(settings.vatNumber)}
                onChange={(e) => setSettings(prev => ({ ...prev, vatNumber: e.target.value }))}
                placeholder="π.χ. 123456789"
                className="rounded-none"
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment">Περιβάλλον</Label>
              <select
                id="environment"
                value={settings.environment}
                onChange={(e) => setSettings(prev => ({ ...prev, environment: e.target.value as 'development' | 'production' }))}
                className="w-full p-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-[#00ffba] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!isEditing}
              >
                <option value="development">Development (δοκιμαστικό)</option>
                <option value="production">Production (παραγωγικό)</option>
              </select>
            </div>
          </div>

          <div className={`flex items-center justify-between p-4 border border-gray-200 rounded-none ${!isEditing ? 'bg-gray-50' : ''}`}>
            <div>
              <Label htmlFor="enabled">Ενεργοποίηση MyData</Label>
              <p className="text-sm text-gray-600">Ενεργοποιεί τη σύνδεση με το MyData API</p>
            </div>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
              disabled={!isEditing}
            />
          </div>

          <div className={`flex items-center justify-between p-4 border border-gray-200 rounded-none ${!isEditing ? 'bg-gray-50' : ''}`}>
            <div>
              <Label htmlFor="autoSend">Αυτόματη Αποστολή</Label>
              <p className="text-sm text-gray-600">Αυτόματη αποστολή αποδείξεων στο MyData κατά τη δημιουργία</p>
            </div>
            <Switch
              id="autoSend"
              checked={settings.autoSend}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoSend: checked }))}
              disabled={!isEditing || !settings.enabled}
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
              onClick={handleEditClick}
              disabled={loading}
              className={isEditing 
                ? "bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none" 
                : "bg-gray-600 hover:bg-gray-700 text-white rounded-none"
              }
            >
              {isEditing ? (
                <>
                  {loading ? "Αποθήκευση..." : "Αποθήκευση Ρυθμίσεων"}
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Αλλαγή
                </>
              )}
            </Button>

            <Button
              onClick={testConnection}
              disabled={testLoading || !settings.aadeUserId || !settings.subscriptionKey || isEditing}
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
    </div>
  );
};