import { useEffect } from "react";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";

export default function DashboardWidget() {
  useEffect(() => {
    // Set custom manifest for dashboard widget
    const manifestData = {
      name: 'Dashboard - HYPERKIDS',
      short_name: 'Dashboard',
      description: 'Dashboard HYPERKIDS',
      theme_color: '#cb8954',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/dashboard-widget',
      scope: '/dashboard-widget',
      icons: [
        {
          src: '/pwa-icons/dashboard-icon.png',
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
    <div className="min-h-screen bg-gray-50 w-full">
      <DashboardContainer />
    </div>
  );
}
