
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { ProgramPreviewDialog } from "@/components/programs/ProgramPreviewDialog";

interface UserProfileProgramsProps {
  user: any;
  programs: any[];
}

export const UserProfilePrograms = ({ user, programs }: UserProfileProgramsProps) => {
  const [previewProgram, setPreviewProgram] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  const handlePreviewProgram = (program: any) => {
    setPreviewProgram(program);
    setPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewProgram(null);
  };

  return (
    <>
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
                    <div className="flex-1">
                      <h4 className="font-medium">{program.name}</h4>
                      <p className="text-sm text-gray-600">{program.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Δημιουργήθηκε: {formatDate(program.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{program.status}</Badge>
                      <Button
                        onClick={() => handlePreviewProgram(program)}
                        variant="outline"
                        size="sm"
                        className="rounded-none"
                        title="Προβολή Προγράμματος"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ProgramPreviewDialog
        program={previewProgram}
        isOpen={previewOpen}
        onOpenChange={handlePreviewClose}
      />
    </>
  );
};
