
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Users, User } from 'lucide-react';
import { ProgramAssignment } from "@/types/assignments";

interface AssignmentsListProps {
  assignments: ProgramAssignment[];
  selectedAssignment: ProgramAssignment | null;
  onSelectAssignment: (assignment: ProgramAssignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onEditAssignment: (assignment: ProgramAssignment) => void;
}

export const AssignmentsList: React.FC<AssignmentsListProps> = ({
  assignments,
  selectedAssignment,
  onSelectAssignment,
  onDeleteAssignment,
  onEditAssignment
}) => {
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

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Λίστα Αναθέσεων</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Δεν υπάρχουν αναθέσεις</p>
          ) : (
            assignments.map((assignment) => (
              <div
                key={assignment.id}
                className={`p-4 border cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedAssignment?.id === assignment.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => onSelectAssignment(assignment)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{assignment.programs?.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {assignment.assignment_type === 'individual' ? (
                        <User className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Users className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-sm text-gray-600">
                        {assignment.assignment_type === 'individual' 
                          ? assignment.app_users?.name 
                          : assignment.athlete_groups?.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(assignment.status)}>
                      {getStatusText(assignment.status)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditAssignment(assignment);
                      }}
                      className="rounded-none"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAssignment(assignment.id);
                      }}
                      className="rounded-none text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>Έναρξη: {new Date(assignment.start_date).toLocaleDateString('el-GR')}</p>
                  {assignment.end_date && (
                    <p>Λήξη: {new Date(assignment.end_date).toLocaleDateString('el-GR')}</p>
                  )}
                  {assignment.notes && (
                    <p className="mt-1 italic">{assignment.notes}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
