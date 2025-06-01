
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserProfileProgramsProps {
  user: any;
  programs: any[];
}

export const UserProfilePrograms = ({ user, programs }: UserProfileProgramsProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {(user.role === 'trainer' || user.role === 'admin') ? 'Προγράμματα Προπόνησης' : 'Ανατεθέντα Προγράμματα'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {programs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Δεν βρέθηκαν προγράμματα
          </p>
        ) : (
          <div className="space-y-3">
            {programs.map((program) => (
              <div key={program.id} className="border p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{program.name}</h4>
                    <p className="text-sm text-gray-600">{program.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Δημιουργήθηκε: {formatDate(program.created_at)}
                    </p>
                  </div>
                  <Badge variant="outline">{program.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
