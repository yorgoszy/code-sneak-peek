
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface LoadingStateProps {
  userName: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ userName }) => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Ημερολόγιο Προπονήσεων - {userName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          Φόρτωση ημερολογίου...
        </div>
      </CardContent>
    </Card>
  );
};

interface ErrorStateProps {
  userName: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ userName }) => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Ημερολόγιο Προπονήσεων - {userName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-red-500">
          Σφάλμα κατά τη φόρτωση του ημερολογίου
        </div>
      </CardContent>
    </Card>
  );
};
