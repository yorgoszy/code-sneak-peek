import { Edit, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import type { OneRMRecord } from "./OneRMManagement";

interface OneRMListProps {
  records: OneRMRecord[];
  isLoading: boolean;
  onEdit: (record: OneRMRecord) => void;
  onDelete: (id: string) => void;
}

export const OneRMList = ({ records, isLoading, onEdit, onDelete }: OneRMListProps) => {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Φόρτωση...
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>Δεν υπάρχουν καταγραφές 1RM</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <div
          key={record.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-none border border-gray-200 hover:shadow-sm transition-shadow"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium text-gray-900">
                  {record.app_users?.name || 'Άγνωστος Χρήστης'}
                </p>
                <p className="text-sm text-gray-600">
                  {record.exercises?.name || 'Άγνωστη Άσκηση'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(record.recorded_date), 'd MMMM yyyy', { locale: el })}
                </p>
                {record.notes && (
                  <p className="text-xs text-gray-500 mt-1 italic">{record.notes}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right mr-4">
              <p className="text-2xl font-bold text-[#00ffba]">{record.weight}</p>
              <p className="text-xs text-gray-500">kg</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(record)}
              className="rounded-none"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την καταγραφή;')) {
                  onDelete(record.id);
                }
              }}
              className="rounded-none text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
