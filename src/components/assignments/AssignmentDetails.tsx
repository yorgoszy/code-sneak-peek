
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Users, User, Calendar, FileText } from 'lucide-react';
import { ProgramAssignment } from "@/types/assignments";
import { User as UserType } from "@/components/programs/types";

interface AssignmentDetailsProps {
  selectedAssignment: ProgramAssignment | null;
  users: UserType[];
  onEditAssignment?: (assignment: ProgramAssignment) => void;
}

export const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({
  selectedAssignment,
  users,
  onEditAssignment
}) => {
  if (!selectedAssignment) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Λεπτομέρειες Ανάθεσης</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Επιλέξτε μια ανάθεση για να δείτε τις λεπτομέρειες
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ενεργό';
      case 'completed': return 'Ολοκληρωμένο';
      case 'paused': return 'Παυμένο';
      case 'cancelled': return 'Ακυρωμένο';
      default: return status;
    }
  };

  const handleEditAssignment = () => {
    if (onEditAssignment && selectedAssignment) {
      onEditAssignment(selectedAssignment);
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Λεπτομέρειες Ανάθεσης</CardTitle>
          <Button
            onClick={handleEditAssignment}
            variant="outline"
            size="sm"
            className="rounded-none"
            title="Επεξεργασία Ανάθεσης"
          >
            <Edit className="w-4 h-4 mr-1" />
            Επεξεργασία
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">{selectedAssignment.programs?.name}</h3>
            {selectedAssignment.programs?.description && (
              <p className="text-gray-600 text-sm">{selectedAssignment.programs.description}</p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              {selectedAssignment.assignment_type === 'individual' ? (
                <User className="w-4 h-4 text-gray-500" />
              ) : (
                <Users className="w-4 h-4 text-gray-500" />
              )}
              <span className="font-medium">
                {selectedAssignment.assignment_type === 'individual' ? 'Αθλητής' : 'Ομάδα'}:
              </span>
            </div>
            <p className="text-gray-700">
              {selectedAssignment.assignment_type === 'individual' 
                ? selectedAssignment.app_users?.name 
                : selectedAssignment.athlete_groups?.name}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Διάρκεια:</span>
            </div>
            <p className="text-gray-700">
              Από: {new Date(selectedAssignment.start_date).toLocaleDateString('el-GR')}
              {selectedAssignment.end_date && (
                <> έως: {new Date(selectedAssignment.end_date).toLocaleDateString('el-GR')}</>
              )}
            </p>
          </div>

          <div>
            <span className="font-medium">Κατάσταση: </span>
            <Badge className={getStatusColor(selectedAssignment.status)}>
              {getStatusText(selectedAssignment.status)}
            </Badge>
          </div>

          {selectedAssignment.notes && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Σημειώσεις:</span>
              </div>
              <p className="text-gray-700 bg-gray-50 p-3 italic">
                {selectedAssignment.notes}
              </p>
            </div>
          )}

          <div className="text-xs text-gray-500 pt-4 border-t">
            <p>Δημιουργήθηκε: {new Date(selectedAssignment.created_at).toLocaleString('el-GR')}</p>
            <p>Τελευταία ενημέρωση: {new Date(selectedAssignment.updated_at).toLocaleString('el-GR')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
