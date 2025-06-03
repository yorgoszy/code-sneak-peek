
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { TestResult } from "./types";

interface TestResultItemProps {
  test: TestResult;
  onDelete: (testId: string, tableName: string) => void;
}

export const TestResultItem = ({ test, onDelete }: TestResultItemProps) => {
  return (
    <div key={`${test.table_name}-${test.id}`} className="border rounded-none p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="rounded-none">
              {test.test_type}
            </Badge>
            <span className="text-sm text-gray-500">
              {new Date(test.test_date).toLocaleDateString('el-GR')}
            </span>
          </div>
          <h4 className="font-medium text-gray-900">
            {test.user_name}
          </h4>
          {test.notes && (
            <p className="text-sm text-gray-600 mt-1">{test.notes}</p>
          )}
          {test.exercise_count !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              Ασκήσεις: {test.exercise_count}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(test.id, test.table_name)}
            className="rounded-none text-xs"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
