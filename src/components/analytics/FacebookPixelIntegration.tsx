import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Target, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface FacebookPixelData {
  reach: number;
  impressions: number;
  clicks: number;
  ctr: string;
  cpm: string;
  conversions: number;
  costPerConversion: string;
}

export const FacebookPixelIntegration: React.FC = () => {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('fb_access_token') || '');
  const [pixelId, setPixelId] = useState(localStorage.getItem('fb_pixel_id') || '');
  const [data, setData] = useState<FacebookPixelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (accessToken && pixelId) {
      setConnected(true);
      fetchPixelData();
    }
  }, []);

  const handleConnect = () => {
    if (!accessToken || !pixelId) {
      toast.error('Παρακαλώ εισάγετε και τα δύο στοιχεία');
      return;
    }

    localStorage.setItem('fb_access_token', accessToken);
    localStorage.setItem('fb_pixel_id', pixelId);
    setConnected(true);
    fetchPixelData();
    toast.success('Σύνδεση με Facebook Pixel επιτυχής!');
  };

  const fetchPixelData = async () => {
    setLoading(true);
    try {
      // Προσομοίωση API call - εδώ θα κάνουμε το πραγματικό API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Μοκ δεδομένα για demo
      setData({
        reach: 12450,
        impressions: 23890,
        clicks: 1234,
        ctr: '5.17%',
        cpm: '€2.45',
        conversions: 89,
        costPerConversion: '€15.30'
      });
    } catch (error) {
      toast.error('Σφάλμα στη λήψη δεδομένων από Facebook Pixel');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('fb_access_token');
    localStorage.removeItem('fb_pixel_id');
    setAccessToken('');
    setPixelId('');
    setConnected(false);
    setData(null);
    toast.success('Αποσύνδεση από Facebook Pixel');
  };

  if (!connected) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Facebook Pixel Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Access Token</label>
            <Input
              type="password"
              placeholder="Εισάγετε το Facebook Access Token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="rounded-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Pixel ID</label>
            <Input
              placeholder="Facebook Pixel ID (π.χ. 123456789012345)"
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              className="rounded-none"
            />
          </div>
          <Button 
            onClick={handleConnect}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-none"
          >
            Σύνδεση με Facebook Pixel
          </Button>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-none">
            <p className="text-sm text-blue-800">
              Χρειάζεστε ένα Facebook Access Token και το Pixel ID από το Facebook Business Manager.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Facebook Pixel
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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-600">Φόρτωση δεδομένων...</p>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Στατιστικά */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-none">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Εμβέλεια</p>
                    <p className="text-2xl font-bold">{data.reach.toLocaleString()}</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-none">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Εμφανίσεις</p>
                    <p className="text-2xl font-bold">{data.impressions.toLocaleString()}</p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-none">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Κλικ</p>
                    <p className="text-2xl font-bold">{data.clicks.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-none">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Μετατροπές</p>
                    <p className="text-2xl font-bold">{data.conversions}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Αναλυτικά Στοιχεία */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-none text-center">
                <p className="text-sm text-blue-600 font-medium">CTR (Click Through Rate)</p>
                <p className="text-3xl font-bold text-blue-800">{data.ctr}</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-none text-center">
                <p className="text-sm text-blue-600 font-medium">CPM (Cost Per Mille)</p>
                <p className="text-3xl font-bold text-blue-800">{data.cpm}</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-none text-center">
                <p className="text-sm text-blue-600 font-medium">Κόστος ανά Μετατροπή</p>
                <p className="text-3xl font-bold text-blue-800">{data.costPerConversion}</p>
              </div>
            </div>

            <Button 
              onClick={fetchPixelData}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-none"
            >
              Ανανέωση Δεδομένων
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};