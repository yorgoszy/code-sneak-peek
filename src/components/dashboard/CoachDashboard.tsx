
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, ClipboardList, TrendingUp } from 'lucide-react';

export default function CoachDashboard() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Προπονητή</h1>
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
              <CardTitle className="text-sm font-medium">Αθλητές</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">25</div>
              <p className="text-xs text-muted-foreground">Υπό την επίβλεψή σου</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Προπονήσεις</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">Αυτή την εβδομάδα</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Προγράμματα</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Ενεργά</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Απόδοση</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92%</div>
              <p className="text-xs text-muted-foreground">Μέσος όρος αθλητών</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Οι Αθλητές μου</CardTitle>
              <CardDescription>Διαχείριση αθλητών</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Εδώ θα εμφανίζεται η λίστα με τους αθλητές του προπονητή...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Προγράμματα Προπόνησης</CardTitle>
              <CardDescription>Δημιουργία και διαχείριση προγραμμάτων</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Εδώ θα εμφανίζονται τα προγράμματα προπόνησης...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
