
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import AthleteDashboard from '@/components/dashboard/AthleteDashboard';
import CoachDashboard from '@/components/dashboard/CoachDashboard';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import GeneralDashboard from '@/components/dashboard/GeneralDashboard';

export default function Dashboard() {
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
        <div className="text-lg">Φόρτωση...</div>
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
            <div className="text-lg">Δεν έχει καθοριστεί ρόλος χρήστη</div>
          </div>
        );
    }
  };

  return <div style={{ fontFamily: 'Robert Pro, sans-serif' }}>{renderDashboard()}</div>;
}
