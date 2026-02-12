import React, { useEffect, useRef } from 'react';
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
  
  // Track if we've ever successfully rendered children
  // Once granted, don't show loading again (prevents tab-switch unmounting)
  const hasGrantedAccess = useRef(false);

  const isLoading = authLoading || roleLoading;
  const accessGranted = isAuthenticated && user && (!requireAdmin || isAdmin());

  useEffect(() => {
    if (accessGranted) {
      hasGrantedAccess.current = true;
    }
  }, [accessGranted]);

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

  // If we've already granted access, keep showing children even during re-auth
  // This prevents tab-switch from unmounting the page and losing state
  if (hasGrantedAccess.current && isLoading) {
    console.log('🔒 ProtectedRoute: Re-authenticating, keeping current view');
    return <>{children}</>;
  }

  // Show loading screen only on initial load
  if (isLoading) {
    console.log('🔒 ProtectedRoute: Loading...');
    return <CustomLoadingScreen />;
  }

  // If not authenticated, redirect to auth page
  if (!isAuthenticated || !user) {
    hasGrantedAccess.current = false;
    console.log('🔒 ProtectedRoute: Not authenticated, redirecting to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If admin access is required but user is not admin, redirect appropriately
  if (requireAdmin && !isAdmin()) {
    console.log('🔒 ProtectedRoute: Not admin, redirecting based on role');

    // Coaches should land on coach overview
    if (userProfile?.role === 'coach') {
      return <Navigate to="/dashboard/coach-overview" replace />;
    }

    // Redirect other roles to user's own profile if they have one
    if (userProfile?.id) {
      return <Navigate to={`/dashboard/user-profile/${userProfile.id}`} replace />;
    }

    // Otherwise redirect to main page
    return <Navigate to="/" replace />;
  }

  console.log('🔒 ProtectedRoute: Access granted');
  return <>{children}</>;
};
