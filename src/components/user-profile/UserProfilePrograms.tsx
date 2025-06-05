
import React from 'react';
import { UserProfileProgramCards } from './UserProfileProgramCards';

interface UserProfileProgramsProps {
  user: any;
  programs: any[];
}

export const UserProfilePrograms: React.FC<UserProfileProgramsProps> = ({ user, programs }) => {
  return <UserProfileProgramCards userProfile={user} />;
};
