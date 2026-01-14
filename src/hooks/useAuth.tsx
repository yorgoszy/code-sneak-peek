
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * @deprecated Use useAuthContext directly for full functionality.
 * This hook is kept for backward compatibility.
 */
export const useAuth = () => {
  const context = useAuthContext();
  
  return {
    user: context.user,
    session: context.session,
    loading: context.loading,
    signOut: context.signOut,
    isAuthenticated: context.isAuthenticated,
  };
};
