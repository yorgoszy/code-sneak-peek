
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Trophy, TrendingUp } from 'lucide-react';

export default function ParentDashboard() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Γονέα</h1>
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
              <CardTitle className="text-sm font-medium">Παιδιά</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Εγγεγραμμένα</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Προπονήσεις</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Αυτή την εβδομάδα</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Επιτεύγματα</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Αυτόν τον μήνα</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Πρόοδος</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">Συνολική απόδοση</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Τα Παιδιά μου</CardTitle>
              <CardDescription>Παρακολούθηση προόδου</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Εδώ θα εμφανίζονται οι πληροφορίες για τα παιδιά...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Πρόγραμμα & Αγώνες</CardTitle>
              <CardDescription>Επερχόμενες δραστηριότητες</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Εδώ θα εμφανίζεται το πρόγραμμα προπονήσεων και αγώνων...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
