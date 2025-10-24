import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { CustomLoadingScreen } from '@/components/ui/custom-loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { isAdmin, loading: roleLoading, userProfile } = useRoleCheck();
  const location = useLocation();

  useEffect(() => {
    console.log('🔒 ProtectedRoute:', {
      path: location.pathname,
      requireAdmin,
      isAuthenticated,
      userProfileId: userProfile?.id,
      userRole: userProfile?.role,
      isAdminResult: isAdmin(),
      authLoading,
      roleLoading
    });
  }, [location.pathname, requireAdmin, isAuthenticated, userProfile, isAdmin, authLoading, roleLoading]);

  // Show loading screen while checking authentication
  if (authLoading || roleLoading) {
    console.log('🔒 ProtectedRoute: Loading...');
    return <CustomLoadingScreen />;
  }

  // If not authenticated, redirect to auth page
  if (!isAuthenticated || !user) {
    console.log('🔒 ProtectedRoute: Not authenticated, redirecting to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If admin access is required but user is not admin, redirect to user profile
  if (requireAdmin && !isAdmin()) {
    console.log('🔒 ProtectedRoute: Not admin, redirecting to user profile');
    
    // Redirect to user's own profile if they have one
    if (userProfile?.id) {
      return <Navigate to={`/dashboard/user-profile/${userProfile.id}`} replace />;
    }
    
    // Otherwise redirect to main page
    return <Navigate to="/" replace />;
  }

  console.log('🔒 ProtectedRoute: Access granted');
  return <>{children}</>;
};
