
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestCard } from "./TestCard";

interface UserProfileTestsProps {
  tests: any[];
  onTestDeleted: () => void;
}

export const UserProfileTests = ({ tests, onTestDeleted }: UserProfileTestsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Τεστ Αξιολόγησης ({tests.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {tests.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Δεν βρέθηκαν τεστ
          </p>
        ) : (
          <div className="grid gap-4">
            {tests.map((test) => (
              <TestCard 
                key={test.id} 
                test={test} 
                onTestDeleted={onTestDeleted}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
