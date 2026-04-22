import { useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CustomLoadingScreen } from '@/components/ui/custom-loading';
import Index from '@/pages/Index';

const PublicReportAbuse = lazy(() => import('@/pages/PublicReportAbuse'));

// Domains that should show the public report-abuse form as their landing page
const ABUSE_REPORT_DOMAINS = ['pestomou.com', 'www.pestomou.com'];

export const RootRedirect = () => {
  const { loading } = useAuth();
  const navigate = useNavigate();
  const isAbuseReportDomain =
    typeof window !== 'undefined' &&
    ABUSE_REPORT_DOMAINS.includes(window.location.hostname);

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

  return <Index />;
};
