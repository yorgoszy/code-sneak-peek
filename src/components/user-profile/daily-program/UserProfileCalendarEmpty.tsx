
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export const UserProfileCalendarEmpty: React.FC = () => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Ημερολόγιο Προπονήσεων
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Δεν υπάρχουν προγράμματα για αυτόν τον χρήστη</p>
          <p className="text-sm">Αναθέστε ένα πρόγραμμα για να εμφανιστεί στο ημερολόγιο</p>
        </div>
      </CardContent>
    </Card>
  );
};
