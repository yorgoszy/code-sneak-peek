import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useRoleCheck } from "@/hooks/useRoleCheck";

/**
 * Returns the coach context id exactly like the rest of the dashboard screens.
 * - Coach: always uses their own app_users.id (ignores coachId in URL)
 * - Admin: can impersonate a coach via ?coachId=... (must be different from own id)
 */
export const useEffectiveCoachId = () => {
  const { userProfile, isAdmin, loading } = useRoleCheck();
  const [searchParams] = useSearchParams();

  const coachIdParam = searchParams.get("coachId");

  const effectiveCoachId = useMemo(() => {
    // Επιτρέπουμε προβολή άλλου coach ΜΟΝΟ σε admin.
    if (coachIdParam && isAdmin() && coachIdParam !== userProfile?.id) return coachIdParam;

    // Coach / normal flow
    return userProfile?.id ?? null;
  }, [coachIdParam, isAdmin, userProfile?.id]);

  return { effectiveCoachId, loading };
};
