
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Calendar, Users, MessageCircle } from 'lucide-react';

export default function GeneralDashboard() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Καλώς ήρθες, {user?.user_metadata?.full_name || user?.email}</p>
          </div>
          <Button onClick={signOut} variant="outline" style={{ borderRadius: '0px' }}>
            Αποσύνδεση
          </Button>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ανακοινώσεις</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Νέες</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Εκδηλώσεις</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Αυτή την εβδομάδα</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Κοινότητα</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">Μέλη</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Μηνύματα</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Αδιάβαστα</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ανακοινώσεις</CardTitle>
              <CardDescription>Τελευταία νέα και ενημερώσεις</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Εδώ θα εμφανίζονται οι ανακοινώσεις...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Επερχόμενες Εκδηλώσεις</CardTitle>
              <CardDescription>Δραστηριότητες και εκδηλώσεις</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Εδώ θα εμφανίζονται οι επερχόμενες εκδηλώσεις...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
