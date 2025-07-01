
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    visitors: 0,
    pageViews: 0,
    avgSessionDuration: '0:00',
    bounceRate: '0%',
    topPages: [],
    deviceTypes: [],
    trafficSources: []
  });

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

  const quickStats = [
    { 
      title: 'Επισκέπτες Σήμερα', 
      value: analyticsData.visitors, 
      icon: Users, 
      color: 'text-blue-600' 
    },
    { 
      title: 'Προβολές Σελίδων', 
      value: analyticsData.pageViews, 
      icon: Eye, 
      color: 'text-green-600' 
    },
    { 
      title: 'Μέση Διάρκεια', 
      value: analyticsData.avgSessionDuration, 
      icon: Clock, 
      color: 'text-orange-600' 
    },
    { 
      title: 'Bounce Rate', 
      value: analyticsData.bounceRate, 
      icon: TrendingUp, 
      color: 'text-purple-600' 
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="rounded-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <IconComponent className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Tools */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Εργαλεία Analytics</CardTitle>
          <p className="text-sm text-gray-600">
            Παρακολούθηση επισκεπτών και συμπεριφοράς για στοχευμένες καμπάνιες
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyticsTools.map((tool, index) => {
              const IconComponent = tool.icon;
              return (
                <div key={index} className="p-4 border border-gray-200 rounded-none hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-none ${tool.color} text-white`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 rounded-none"
                        onClick={() => window.open(tool.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Άνοιγμα
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Οδηγίες Εγκατάστασης</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-none">
              <h4 className="font-semibold text-blue-900">1. Google Analytics 4</h4>
              <p className="text-sm text-blue-800 mt-1">
                Δημιούργησε λογαριασμό στο Google Analytics και αντικατάστησε το 'G-XXXXXXXXXX' 
                στο αρχείο AnalyticsProvider.tsx με το δικό σου Measurement ID.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-none">
              <h4 className="font-semibold text-purple-900">2. Facebook Pixel</h4>
              <p className="text-sm text-purple-800 mt-1">
                Δημιούργησε Facebook Pixel από το Business Manager και αντικατάστησε το ID 
                στο αρχείο AnalyticsProvider.tsx.
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-none">
              <h4 className="font-semibold text-orange-900">3. Hotjar & Microsoft Clarity</h4>
              <p className="text-sm text-orange-800 mt-1">
                Εγγραφή στις υπηρεσίες και αντικατάσταση των αντίστοιχων ID στον κώδικα.
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-none">
            <h4 className="font-semibold text-green-900">💡 Τι θα μπορείς να παρακολουθείς:</h4>
            <ul className="text-sm text-green-800 mt-2 space-y-1">
              <li>• Αριθμός επισκεπτών και προβολές σελίδων</li>
              <li>• Συμπεριφορά χρηστών (ποιες σελίδες επισκέπτονται, πόσο χρόνο περνούν)</li>
              <li>• Πηγές κίνησης (Google, Facebook, άμεση κίνηση)</li>
              <li>• Συσκευές που χρησιμοποιούν (κινητό, desktop)</li>
              <li>• Heatmaps για να δεις που κάνουν κλικ οι χρήστες</li>
              <li>• Αναζητήσεις στο site σου</li>
              <li>• Conversions (εγγραφές, επικοινωνία)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
