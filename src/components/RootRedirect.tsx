import { useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CustomLoadingScreen } from '@/components/ui/custom-loading';
import Index from '@/pages/Index';

const PublicReportAbuse = lazy(() => import('@/pages/PublicReportAbuse'));

// This project is dedicated to the public abuse-report form.
// Always show the report form as the landing page, regardless of hostname.
const SHOW_ABUSE_REPORT_AS_HOME = true;

export const RootRedirect = () => {
  const { loading } = useAuth();
  const navigate = useNavigate();
  const isAbuseReportDomain = SHOW_ABUSE_REPORT_AS_HOME;

  // Check for password recovery tokens and redirect to reset password page
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const searchParams = new URLSearchParams(search);

    // Supabase may redirect back using either:
    // - implicit flow: #access_token=...&type=recovery
    // - PKCE flow: ?code=...
    const isRecoveryFromHash = hash.includes('type=recovery') || hash.includes('type=magiclink');
    const hasAccessToken = hash.includes('access_token');
    const hasCode = searchParams.has('code');
    const hasToken = searchParams.has('token') || searchParams.has('token_hash');
    const hasErrorDescription = hash.includes('error_description') || searchParams.has('error_description');

    console.log('🔐 RootRedirect - Checking for recovery:', {
      search,
      hash: hash.substring(0, 120),
      isRecoveryFromHash,
      hasAccessToken,
      hasCode,
    });

    if ((isRecoveryFromHash || hasAccessToken || hasCode || hasToken) && !hasErrorDescription) {
      console.log('🔐 Recovery detected at root, redirecting to /reset-password');
      const suffix = `${search}${hash}`;
      navigate(`/reset-password${suffix}`, { replace: true });
    }
  }, [navigate]);

  if (loading) {
    return <CustomLoadingScreen />;
  }

  if (isAbuseReportDomain) {
    return (
      <Suspense fallback={<CustomLoadingScreen />}>
        <PublicReportAbuse />
      </Suspense>
    );
  }

  return <Index />;
};
