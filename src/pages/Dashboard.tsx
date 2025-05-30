
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, LogOut, Users, Settings, BookOpen, BarChart3 } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      // Fetch user profile from app_users table
      const fetchUserProfile = async () => {
        const { data } = await supabase
          .from('app_users')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
        
        setUserProfile(data);
      };
      
      fetchUserProfile();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-12 w-12 text-pink-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const isAdmin = userProfile?.role === 'admin' || user?.email === 'yorgoszy@gmail.com' || user?.email === 'info@hyperkids.gr';

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-pink-500" />
              <span className="text-xl font-bold text-gray-900">HyperKids</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Καλώς ήρθες, {userProfile?.name || user?.email}
                {isAdmin && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
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
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Καλώς ήρθες στην πλατφόρμα HyperKids!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                Μαθήματα
              </CardTitle>
              <CardDescription>
                Πρόσβαση στα διαδραστικά μαθήματα
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full rounded-none">
                Ξεκίνησε Μάθημα
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                Πρόοδος
              </CardTitle>
              <CardDescription>
                Δες την πρόοδό σου
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full rounded-none">
                Προβολή Προόδου
              </Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-red-600" />
                  Admin Panel
                </CardTitle>
                <CardDescription>
                  Διαχείριση συστήματος
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="w-full rounded-none">
                  Admin Panel
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Κοινότητα
              </CardTitle>
              <CardDescription>
                Συνδέσου με άλλα παιδιά
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full rounded-none">
                Δες Κοινότητα
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Profile Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Στοιχεία Προφίλ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Όνομα</p>
                <p className="text-gray-900">{userProfile?.name || 'Δεν έχει οριστεί'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Ρόλος</p>
                <p className="text-gray-900">{userProfile?.role || 'User'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Κατηγορία</p>
                <p className="text-gray-900">{userProfile?.category || 'General'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
