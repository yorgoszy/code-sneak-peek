import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Activity, TrendingUp } from "lucide-react";

export const ParentDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Πίνακας Γονέα</h1>
        <p className="text-gray-600 mt-1">Παρακολουθήστε την πρόοδο των παιδιών σας</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Παιδιά</CardTitle>
            <Users className="h-4 w-4 text-[#cb8954]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600 mt-1">Συνδεδεμένα παιδιά</p>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Προγράμματα</CardTitle>
            <Activity className="h-4 w-4 text-[#00ffba]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600 mt-1">Ενεργά προγράμματα</p>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Προπονήσεις</CardTitle>
            <Calendar className="h-4 w-4 text-[#cb8954]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600 mt-1">Αυτή την εβδομάδα</p>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Πρόοδος</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#00ffba]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-gray-600 mt-1">Μέσος όρος</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Πρόσφατη Δραστηριότητα</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Δεν υπάρχει δραστηριότητα
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentDashboard;
