import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CustomLoadingScreen } from '@/components/ui/custom-loading';
import Index from '@/pages/Index';

export const RootRedirect = () => {
  const { loading } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check for password recovery tokens and redirect to reset password page
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const searchParams = new URLSearchParams(search);

    // Supabase may redirect back using either:
    // - implicit flow: #access_token=...&type=recovery
    // - PKCE flow: ?code=... (any code could be recovery)
    const isRecoveryFromHash = hash.includes('type=recovery') || hash.includes('type=magiclink');
    const hasAccessToken = hash.includes('access_token');
    const hasCode = searchParams.has('code');
    const hasToken = searchParams.has('token');
    const hasErrorDescription = hash.includes('error_description') || searchParams.has('error_description');

    console.log('🔐 RootRedirect - Checking for recovery:', {
      search,
      hash: hash.substring(0, 120),
      isRecoveryFromHash,
      hasAccessToken,
      hasCode,
    });

    // IMPORTANT: Any code parameter at root URL should go to reset-password
    // because Supabase PKCE recovery redirects to Site URL with ?code=
    // The ResetPassword page will handle determining if it's a valid recovery
    if ((isRecoveryFromHash || hasAccessToken || hasCode || hasToken) && !hasErrorDescription) {
      console.log('🔐 Auth code/token detected at root, redirecting to /auth/reset-password');
      setIsRedirecting(true);
      const suffix = `${search}${hash}`;
      navigate(`/auth/reset-password${suffix}`, { replace: true });
      return;
    }
  }, [navigate]);

  if (loading || isRedirecting) {
    return <CustomLoadingScreen />;
  }

  return <Index />;
};
