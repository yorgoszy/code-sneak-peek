import { useEffect } from "react";
import { SubscriptionManagement } from "@/components/subscriptions/SubscriptionManagement";

export default function SubscriptionsWidget() {
  useEffect(() => {
    // Set custom manifest for subscriptions widget
    const manifestData = {
      name: 'Συνδρομές - HYPERKIDS',
      short_name: 'Συνδρομές',
      description: 'Διαχείριση Συνδρομών HYPERKIDS',
      theme_color: '#cb8954',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/subscriptions-widget',
      scope: '/subscriptions-widget',
      icons: [
        {
          src: '/pwa-icons/crown-icon.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    };

    const manifestBlob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(manifestBlob);
    
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestURL;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
      URL.revokeObjectURL(manifestURL);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 w-full p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Διαχείριση Συνδρομών</h1>
        <p className="text-gray-600">Συνδρομές</p>
      </div>
    
      <SubscriptionManagement />
    </div>
  );
}
