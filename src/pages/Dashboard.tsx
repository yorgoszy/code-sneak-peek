
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import AthleteDashboard from '@/components/dashboard/AthleteDashboard';
import CoachDashboard from '@/components/dashboard/CoachDashboard';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import GeneralDashboard from '@/components/dashboard/GeneralDashboard';

const Dashboard = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderDashboard = () => {
    switch (userRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'athlete':
        return <AthleteDashboard />;
      case 'coach':
        return <CoachDashboard />;
      case 'parent':
        return <ParentDashboard />;
      case 'general':
        return <GeneralDashboard />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Μη εγκεκριμένος χρήστης</h2>
              <p className="text-gray-600">Παρακαλώ επικοινωνήστε με τον διαχειριστή για να σας εκχωρηθεί ρόλος.</p>
            </div>
          </div>
        );
    }
  };

  return renderDashboard();
};

export default Dashboard;
