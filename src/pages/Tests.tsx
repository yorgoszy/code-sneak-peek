
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { TabNavigation } from "@/components/navigation/TabNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Tests = () => {
  const { user, loading, isAuthenticated, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TabNavigation 
        onSignOut={handleSignOut}
        userProfile={userProfile}
        user={user}
        isAdmin={true}
      />

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Τεστ</h1>
          <p className="text-sm text-gray-600">
            Διαχείριση και δημιουργία τεστ
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Διαθέσιμα Τεστ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>Η σελίδα τεστ είναι υπό ανάπτυξη</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Tests;
