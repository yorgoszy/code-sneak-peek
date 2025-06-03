
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTestResults } from "./hooks/useTestResults";
import { TestResultItem } from "./TestResultItem";

export const TestResultsList = () => {
  const { testResults, loading, deleteTest } = useTestResults();

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Φόρτωση τεστ...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Αποτελέσματα Τεστ</CardTitle>
      </CardHeader>
      <CardContent>
        {testResults.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Δεν βρέθηκαν τεστ
          </p>
        ) : (
          <div className="space-y-3">
            {testResults.map((test) => (
              <TestResultItem
                key={`${test.table_name}-${test.id}`}
                test={test}
                onDelete={deleteTest}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
