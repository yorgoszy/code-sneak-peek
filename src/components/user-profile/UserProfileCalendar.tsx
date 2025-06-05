
import React from 'react';
import { UserProfileDailyProgram } from './UserProfileDailyProgram';

interface UserProfileCalendarProps {
  user: any;
}

export const UserProfileCalendar: React.FC<UserProfileCalendarProps> = ({ user }) => {
  return <UserProfileDailyProgram userProfile={user} />;
};
