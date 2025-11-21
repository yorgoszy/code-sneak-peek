import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";
import UserProfile from "@/pages/UserProfile";

const DashboardWidget = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Set custom manifest for dashboard widget
    const manifestData = {
      name: 'Dashboard - HYPERKIDS',
      short_name: 'Dashboard',
      description: 'Το Dashboard μου HYPERKIDS',
      theme_color: '#00ffba',
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

  if (authLoading) {
    return <CustomLoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  // Render the user's profile page directly
  return <UserProfile />;
};

export default DashboardWidget;
