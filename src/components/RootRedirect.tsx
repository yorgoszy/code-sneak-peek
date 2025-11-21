import { useAuth } from '@/hooks/useAuth';
import { CustomLoadingScreen } from '@/components/ui/custom-loading';
import Index from '@/pages/Index';

export const RootRedirect = () => {
  const { loading } = useAuth();

  if (loading) {
    return <CustomLoadingScreen />;
  }

  return <Index />;
};
