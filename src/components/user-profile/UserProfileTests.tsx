
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserProfileTestsProps {
  tests: any[];
}

export const UserProfileTests = ({ tests }: UserProfileTestsProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Τεστ Αξιολόγησης</CardTitle>
      </CardHeader>
      <CardContent>
        {tests.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Δεν βρέθηκαν τεστ
          </p>
        ) : (
          <div className="space-y-3">
            {tests.map((test) => (
              <div key={test.id} className="border p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{test.test_type || 'Τεστ'}</h4>
                    <p className="text-sm text-gray-600">{test.notes}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Ημερομηνία: {formatDate(test.date)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
