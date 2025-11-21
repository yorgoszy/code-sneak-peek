import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CustomLoadingScreen } from '@/components/ui/custom-loading';

export const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <CustomLoadingScreen />;
  }

  return <Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />;
};
