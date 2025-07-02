import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Eye, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsData {
  sessions: number;
  users: number;
  pageviews: number;
  avgSessionDuration: string;
  bounceRate: string;
  topPages: Array<{ page: string; views: number }>;
}

export const GoogleAnalyticsIntegration: React.FC = () => {
  const [propertyId, setPropertyId] = useState(localStorage.getItem('ga_property_id') || '495397770');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (propertyId) {
      setConnected(true);
      fetchAnalyticsData();
    }
  }, []);

  const handleConnect = () => {
    if (!propertyId) {
      toast.error('Παρακαλώ εισάγετε το Property ID');
      return;
    }

    localStorage.setItem('ga_property_id', propertyId);
    setConnected(true);
    fetchAnalyticsData();
    toast.success('Σύνδεση με Google Analytics επιτυχής!');
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const { data: analyticsData, error } = await supabase.functions.invoke('google-analytics-api', {
        body: {
          propertyId: propertyId
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch analytics data');
      }

      setData(analyticsData);
      toast.success('Δεδομένα Google Analytics ενημερώθηκαν!');
    } catch (error) {
      console.error('Analytics fetch error:', error);
      toast.error(`Σφάλμα στη λήψη δεδομένων από Google Analytics: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('ga_property_id');
    setPropertyId('');
    setConnected(false);
    setData(null);
    toast.success('Αποσύνδεση από Google Analytics');
  };

  if (!connected) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#00ffba]" />
            Google Analytics Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Property ID</label>
            <Input
              placeholder="GA4 Property ID (π.χ. 123456789)"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="rounded-none"
            />
          </div>
          <Button 
            onClick={handleConnect}
            className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            Σύνδεση με Google Analytics
          </Button>
          <div className="p-3 bg-green-50 border border-green-200 rounded-none">
            <p className="text-sm text-green-800">
              ✅ Χρησιμοποιούμε Service Account authentication. Χρειάζεστε μόνο το GA4 Property ID από το Analytics dashboard σας.
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
              <TrendingUp className="h-5 w-5 text-[#00ffba]" />
              Google Analytics
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
                <div className="animate-spin h-8 w-8 border-4 border-[#00ffba] border-t-transparent rounded-full mx-auto mb-2"></div>
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
                      <p className="text-sm text-gray-600">Χρήστες</p>
                      <p className="text-2xl font-bold">{data.users.toLocaleString()}</p>
                    </div>
                    <Users className="h-8 w-8 text-[#00ffba]" />
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-none">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Προβολές</p>
                      <p className="text-2xl font-bold">{data.pageviews.toLocaleString()}</p>
                    </div>
                    <Eye className="h-8 w-8 text-[#00ffba]" />
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-none">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Μέση Διάρκεια</p>
                      <p className="text-2xl font-bold">{data.avgSessionDuration}</p>
                    </div>
                    <Clock className="h-8 w-8 text-[#00ffba]" />
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-none">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Bounce Rate</p>
                      <p className="text-2xl font-bold">{data.bounceRate}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-[#00ffba]" />
                  </div>
                </div>
              </div>

              {/* Top Pages */}
              <div>
                <h4 className="font-semibold mb-3">Κορυφαίες Σελίδες</h4>
                <div className="space-y-2">
                  {data.topPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-none">
                      <span className="font-medium">{page.page}</span>
                      <span className="text-[#00ffba] font-semibold">{page.views.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={fetchAnalyticsData}
                disabled={loading}
                className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                Ανανέωση Δεδομένων
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};