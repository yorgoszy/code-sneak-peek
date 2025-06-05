
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface UserProfileProgramsProps {
  user: any;
  programs: any[];
}

export const UserProfilePrograms: React.FC<UserProfileProgramsProps> = ({ user, programs }) => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Προγράμματα
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Δεν έχετε ενεργά προγράμματα</p>
          <p className="text-sm">Επικοινωνήστε με τον προπονητή σας για ανάθεση προγράμματος</p>
        </div>
      </CardContent>
    </Card>
  );
};
