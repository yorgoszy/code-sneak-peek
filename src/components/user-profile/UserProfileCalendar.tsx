
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface UserProfileCalendarProps {
  user: any;
}

export const UserProfileCalendar: React.FC<UserProfileCalendarProps> = ({ user }) => {
  return (
    <Card className="w-full rounded-none">
      <CardHeader>
        <CardTitle>Ημερολόγιο Προγραμμάτων</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Δεν υπάρχουν προγράμματα για αυτόν τον χρήστη</p>
        </div>
      </CardContent>
    </Card>
  );
};
