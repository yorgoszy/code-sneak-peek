
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Calendar, Target, Trophy } from 'lucide-react';

export default function AthleteDashboard() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Αθλητή</h1>
            <p className="text-gray-600">Καλώς ήρθες, {user?.user_metadata?.full_name || user?.email}</p>
          </div>
          <Button onClick={signOut} variant="outline" style={{ borderRadius: '0px' }}>
            Αποσύνδεση
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Προπονήσεις</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Αυτή την εβδομάδα</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Στόχοι</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8/10</div>
              <p className="text-xs text-muted-foreground">Ολοκληρωμένοι</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Αγώνες</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Αυτόν τον μήνα</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Επόμενη Προπόνηση</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Αύριο</div>
              <p className="text-xs text-muted-foreground">17:00</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Πρόγραμμα Προπόνησης</CardTitle>
              <CardDescription>Το τρέχον πρόγραμμά σου</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Εδώ θα εμφανίζεται το πρόγραμμα προπόνησης του αθλητή...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Στατιστικά Απόδοσης</CardTitle>
              <CardDescription>Η πρόοδός σου</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Εδώ θα εμφανίζονται γραφήματα και στατιστικά...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
