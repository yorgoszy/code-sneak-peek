
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { useRoleCheck } from "@/hooks/useRoleCheck";

const Analytics = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, userProfile, loading: rolesLoading } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to={`/dashboard/user-profile/${userProfile?.id}`} replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics & Tracking</h1>
              <p className="text-sm text-gray-600">
                Παρακολούθηση επισκεπτών και συμπεριφοράς για στοχευμένες καμπάνιες
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {userProfile?.name || user?.email}
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>
              </span>
              <Button 
                variant="outline" 
                className="rounded-none"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Αποσύνδεση
              </Button>
            </div>
          </div>
        </nav>

        {/* Analytics Content */}
        <div className="flex-1 p-6">
          <AnalyticsDashboard />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
