
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestCardProps {
  test: any;
  onTestDeleted: () => void;
}

export const TestCard = ({ test, onTestDeleted }: TestCardProps) => {
  const [deleting, setDeleting] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  const handleDelete = async () => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το τεστ;')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('tests')
        .delete()
        .eq('id', test.id);

      if (error) {
        console.error('Error deleting test:', error);
        toast.error('Σφάλμα κατά τη διαγραφή του τεστ');
      } else {
        toast.success('Το τεστ διαγράφηκε επιτυχώς');
        onTestDeleted();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Σφάλμα κατά τη διαγραφή του τεστ');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{test.test_type || 'Τεστ'}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{test.notes}</p>
          <p className="text-xs text-gray-500">
            Ημερομηνία: {formatDate(test.date)}
          </p>
          {test.created_at && (
            <p className="text-xs text-gray-500">
              Δημιουργήθηκε: {formatDate(test.created_at)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
