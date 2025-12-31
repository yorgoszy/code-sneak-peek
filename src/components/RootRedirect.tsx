import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CustomLoadingScreen } from '@/components/ui/custom-loading';
import Index from '@/pages/Index';

export const RootRedirect = () => {
  const { loading } = useAuth();
  const navigate = useNavigate();

  // Check for password recovery tokens and redirect to reset password page
  useEffect(() => {
    const hash = window.location.hash;
    
    // Check for recovery tokens in URL
    const isRecoveryFromHash = hash.includes('type=recovery') || hash.includes('type=magiclink');
    const hasAccessToken = hash.includes('access_token');
    const hasErrorDescription = hash.includes('error_description');
    
    console.log('🔐 RootRedirect - Checking for recovery:', { 
      hash: hash.substring(0, 100), 
      isRecoveryFromHash, 
      hasAccessToken 
    });
    
    // If there's a recovery token, redirect to the reset password page
    if ((isRecoveryFromHash || hasAccessToken) && !hasErrorDescription) {
      console.log('🔐 Recovery token detected at root, redirecting to /auth/reset-password');
      // Keep the hash when redirecting so the reset page can process the token
      navigate('/auth/reset-password' + hash, { replace: true });
    }
  }, [navigate]);

  if (loading) {
    return <CustomLoadingScreen />;
  }

  return <Index />;
};
