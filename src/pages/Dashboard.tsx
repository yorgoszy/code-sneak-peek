
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { AthleteDashboard } from '@/components/dashboard/AthleteDashboard';
import { CoachDashboard } from '@/components/dashboard/CoachDashboard';
import { ParentDashboard } from '@/components/dashboard/ParentDashboard';
import { GeneralDashboard } from '@/components/dashboard/GeneralDashboard';
import { Loader2 } from 'lucide-react';

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
        <Loader2 className="h-8 w-8 animate-spin" />
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Μη αναγνωρισμένος ρόλος χρήστη
              </h2>
              <p className="text-gray-600">
                Επικοινωνήστε με τον διαχειριστή για να ρυθμιστεί ο ρόλος σας.
              </p>
            </div>
          </div>
        );
    }
  };

  return renderDashboard();
};

export default Dashboard;
