import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useParams } from "react-router-dom";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";
import UserProfile from "@/pages/UserProfile";

const DashboardWidget = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { userId } = useParams();

  useEffect(() => {
    if (!user?.id) return;
    
    // Set custom manifest for dashboard widget
    const manifestData = {
      name: 'Dashboard - HYPERKIDS',
      short_name: 'Dashboard',
      description: 'Το Dashboard μου HYPERKIDS',
      theme_color: '#00ffba',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      start_url: `/dashboard-widget/${user.id}`,
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
  }, [user?.id]);

  if (authLoading) {
    return <CustomLoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  // If no userId in URL, redirect to dashboard-widget with user's ID
  if (!userId) {
    return <Navigate to={`/dashboard-widget/${user.id}`} replace />;
  }

  // Render the user's profile page directly
  return <UserProfile hideBackButton={true} />;
};

export default DashboardWidget;
