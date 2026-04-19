import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

interface UserScopedRedirectProps {
  tab: string;
}

/**
 * Redirects /user/:userId/<section> to the user-profile route with the matching tab.
 * Keeps URLs role-scoped per user while reusing the embedded UserProfileContent renderer.
 */
const UserScopedRedirect: React.FC<UserScopedRedirectProps> = ({ tab }) => {
  const { userId } = useParams<{ userId: string }>();
  if (!userId) return <Navigate to="/dashboard/users" replace />;
  return <Navigate to={`/dashboard/user-profile/${userId}?tab=${tab}`} replace />;
};

export default UserScopedRedirect;
