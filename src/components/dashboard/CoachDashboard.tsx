
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CoachDashboard = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
              <p className="text-gray-600">Καλώς ήρθες, {user?.email}</p>
            </div>
            <Button onClick={signOut} variant="outline">
              Αποσύνδεση
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Coach Dashboard</CardTitle>
            <CardDescription>Εδώ θα διαχειρίζεστε τους αθλητές και τα προγράμματα</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Το dashboard των προπονητών θα αναπτυχθεί στη συνέχεια...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoachDashboard;
