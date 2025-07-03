
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  Users, 
  MousePointer, 
  Clock, 
  TrendingUp, 
  Globe,
  Smartphone,
  Monitor,
  ExternalLink
} from "lucide-react";
import { GoogleAnalyticsIntegration } from "@/components/analytics/GoogleAnalyticsIntegration";
import { FacebookPixelIntegration } from "@/components/analytics/FacebookPixelIntegration";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsData {
  visitors: number;
  pageViews: number;
  avgSessionDuration: string;
  bounceRate: string;
  topPages: Array<{ page: string; views: number }>;
  deviceTypes: Array<{ type: string; percentage: number }>;
  trafficSources: Array<{ source: string; percentage: number }>;
}

export const AnalyticsDashboard: React.FC = () => {
  // Δεν εμφανίζουμε mock data - μόνο πραγματικά δεδομένα

  const analyticsTools = [
    {
      name: 'Google Analytics',
      description: 'Παρακολούθηση επισκεπτών, συμπεριφοράς και μετρήσεις',
      url: 'https://analytics.google.com',
      icon: TrendingUp,
      color: 'bg-blue-500'
    },
    {
      name: 'Google Search Console',
      description: 'Παρακολούθηση αναζητήσεων και SEO απόδοσης',
      url: 'https://search.google.com/search-console',
      icon: Globe,
      color: 'bg-green-500'
    },
    {
      name: 'Facebook Pixel',
      description: 'Παρακολούθηση για Facebook/Instagram διαφημίσεις',
      url: 'https://business.facebook.com/events_manager',
      icon: Eye,
      color: 'bg-blue-600'
    },
    {
      name: 'Hotjar',
      description: 'Heatmaps και session recordings',
      url: 'https://www.hotjar.com',
      icon: MousePointer,
      color: 'bg-orange-500'
    },
    {
      name: 'Microsoft Clarity',
      description: 'Δωρεάν session recordings και heatmaps',
      url: 'https://clarity.microsoft.com',
      icon: Monitor,
      color: 'bg-purple-500'
    }
  ];


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics & Tracking</h2>
        <Badge variant="outline" className="rounded-none">
          Real-time Data
        </Badge>
      </div>

      {/* Message για πραγματικά δεδομένα */}
      <Card className="rounded-none">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Πραγματικά Analytics Δεδομένα</h3>
            <p className="text-gray-600 mb-4">
              Για να δεις πραγματικά analytics δεδομένα, χρησιμοποίησε τα παρακάτω εργαλεία:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => window.open('https://analytics.google.com', '_blank')}
                className="rounded-none"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Google Analytics
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://clarity.microsoft.com', '_blank')}
                className="rounded-none"
              >
                <Monitor className="h-4 w-4 mr-2" />
                Microsoft Clarity Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Integrations */}
      <Tabs defaultValue="google-analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-5 rounded-none">
          <TabsTrigger value="google-analytics" className="rounded-none">Google Analytics</TabsTrigger>
          <TabsTrigger value="facebook-pixel" className="rounded-none">Facebook Pixel</TabsTrigger>
          <TabsTrigger value="hotjar" className="rounded-none">Hotjar</TabsTrigger>
          <TabsTrigger value="clarity" className="rounded-none">Microsoft Clarity</TabsTrigger>
          <TabsTrigger value="search-console" className="rounded-none">Search Console</TabsTrigger>
        </TabsList>
        
        <TabsContent value="google-analytics" className="mt-6">
          <GoogleAnalyticsIntegration />
        </TabsContent>
        
        <TabsContent value="facebook-pixel" className="mt-6">
          <FacebookPixelIntegration />
        </TabsContent>
        
        <TabsContent value="hotjar" className="mt-6">
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-orange-500" />
                Hotjar Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Hotjar integration θα προστεθεί σύντομα</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('https://www.hotjar.com', '_blank')}
                  className="rounded-none"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Επίσκεψη Hotjar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clarity" className="mt-6">
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-purple-500" />
                Microsoft Clarity Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Microsoft Clarity integration θα προστεθεί σύντομα</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('https://clarity.microsoft.com', '_blank')}
                  className="rounded-none"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Επίσκεψη Microsoft Clarity
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="search-console" className="mt-6">
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-500" />
                Google Search Console Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Google Search Console integration θα προστεθεί σύντομα</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('https://search.google.com/search-console', '_blank')}
                  className="rounded-none"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Επίσκεψη Search Console
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Default export
export default AnalyticsDashboard;
