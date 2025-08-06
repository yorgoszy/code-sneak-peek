import React from 'react';
import { MyDataSettings } from '@/components/admin/MyDataSettings';

interface AdminMyDataProps {
  userProfile?: any;
  userEmail?: string;
  signOut?: () => void;
}

export const AdminMyData: React.FC<AdminMyDataProps> = ({ userProfile, userEmail, signOut }) => {
  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <MyDataSettings />
      </div>
    </div>
  );
};