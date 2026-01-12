import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Check, Lock, Edit2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MyDataSettingsData {
  id: string;
  aade_user_id: string;
  subscription_key: string;
  vat_number: string;
  environment: string;
  enabled: boolean;
  auto_send: boolean;
}

export const MyDataSettings: React.FC = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<MyDataSettingsData | null>(null);
  const [editForm, setEditForm] = useState({
    aade_user_id: '',
    subscription_key: '',
    vat_number: '',
    enabled: true,
    auto_send: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mydata_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      
      setSettings(data);
      setEditForm({
        aade_user_id: data.aade_user_id,
        subscription_key: data.subscription_key,
        vat_number: data.vat_number,
        enabled: data.enabled,
        auto_send: data.auto_send
      });
    } catch (error) {
      console.error('Error loading MyData settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings?.id) return;
    
    try {
      setSaving(true);
      const { error } = await supabase
        .from('mydata_settings')
        .update({
          aade_user_id: editForm.aade_user_id,
          subscription_key: editForm.subscription_key,
          vat_number: editForm.vat_number,
          enabled: editForm.enabled,
          auto_send: editForm.auto_send,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Οι ρυθμίσεις αποθηκεύτηκαν",
      });

      await loadSettings();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving MyData settings:', error);
      toast({
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η αποθήκευση",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (settings) {
      setEditForm({
        aade_user_id: settings.aade_user_id,
        subscription_key: settings.subscription_key,
        vat_number: settings.vat_number,
        enabled: settings.enabled,
        auto_send: settings.auto_send
      });
    }
    setIsEditing(false);
  };

  // Mask sensitive data when locked
  const getMaskedValue = (value: string) => {
    if (!value) return '';
    if (value.length <= 4) return '****';
    return value.substring(0, 2) + '****' + value.substring(value.length - 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8 text-gray-500">
        Δεν βρέθηκαν ρυθμίσεις MyData
      </div>
    );
  }

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
                value={isEditing ? editForm.aade_user_id : getMaskedValue(settings.aade_user_id)}
                onChange={(e) => setEditForm(prev => ({ ...prev, aade_user_id: e.target.value }))}
                placeholder="π.χ. gym_app_user"
                className="rounded-none"
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriptionKey">Subscription Key</Label>
              <Input
                id="subscriptionKey"
                type={isEditing ? "text" : "password"}
                value={isEditing ? editForm.subscription_key : '********'}
                onChange={(e) => setEditForm(prev => ({ ...prev, subscription_key: e.target.value }))}
                placeholder="Κλειδί συνδρομής από ΑΑΔΕ"
                className="rounded-none"
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vatNumber">ΑΦΜ Γυμναστηρίου</Label>
              <Input
                id="vatNumber"
                value={isEditing ? editForm.vat_number : getMaskedValue(settings.vat_number)}
                onChange={(e) => setEditForm(prev => ({ ...prev, vat_number: e.target.value }))}
                placeholder="π.χ. 123456789"
                className="rounded-none"
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className={`flex items-center justify-between p-4 border border-gray-200 rounded-none ${!isEditing ? 'bg-gray-50' : ''}`}>
            <div>
              <Label htmlFor="enabled">Ενεργοποίηση MyData</Label>
              <p className="text-sm text-gray-600">Ενεργοποιεί τη σύνδεση με το MyData API</p>
            </div>
            <Switch
              id="enabled"
              checked={isEditing ? editForm.enabled : settings.enabled}
              onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, enabled: checked }))}
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
              checked={isEditing ? editForm.auto_send : settings.auto_send}
              onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, auto_send: checked }))}
              disabled={!isEditing || !(isEditing ? editForm.enabled : settings.enabled)}
            />
          </div>

          {settings.enabled && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Η σύνδεση με το MyData API λειτουργεί σωστά
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 flex-wrap">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="secondary"
                className="rounded-none"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Αλλαγή
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Αποθήκευση
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="rounded-none"
                  disabled={saving}
                >
                  Ακύρωση
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
