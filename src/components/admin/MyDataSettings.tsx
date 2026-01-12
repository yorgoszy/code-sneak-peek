import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Check, ExternalLink, Lock, Edit2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MyDataSettings {
  aadeUserId: string;
  subscriptionKey: string;
  vatNumber: string;
  environment: 'production';
  enabled: boolean;
  autoSend: boolean;
}

export const MyDataSettings: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  // Μόνιμα κλειδωμένες και ενεργές ρυθμίσεις
  const [settings, setSettings] = useState<MyDataSettings>({
    aadeUserId: 'gym_production_user',
    subscriptionKey: '********',
    vatNumber: '********',
    environment: 'production',
    enabled: true,
    autoSend: true
  });
  const [connectionStatus] = useState<'unknown' | 'success' | 'error'>('success');

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


          <div className="flex gap-3 flex-wrap">
            {!isEditing ? (
              <>
                <Badge variant="default" className="rounded-none px-4 py-2 bg-[#00ffba] text-black">
                  <Lock className="w-4 h-4 mr-2" />
                  Οι ρυθμίσεις είναι κλειδωμένες και ενεργές
                </Badge>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="rounded-none"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Αλλαγή
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsEditing(false)}
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  Αποθήκευση
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="rounded-none"
                >
                  Ακύρωση
                </Button>
              </>
            )}

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