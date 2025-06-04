
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTestResults } from "./hooks/useTestResults";
import { TestResultItem } from "./TestResultItem";
import { TestViewDialog } from "./TestViewDialog";
import { TestEditDialog } from "./TestEditDialog";
import { TestResult } from "./types";

export const TestResultsList = () => {
  const { testResults, loading, deleteTest, refetch } = useTestResults();
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [testTypeFilter, setTestTypeFilter] = useState("all");

  const handleView = (test: TestResult) => {
    setSelectedTest(test);
    setViewDialogOpen(true);
  };

  const handleEdit = (test: TestResult) => {
    setSelectedTest(test);
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    refetch();
  };

  // Filter tests based on search criteria
  const filteredTests = testResults.filter(test => {
    const matchesSearch = test.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.test_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = testTypeFilter === "all" || test.test_type === testTypeFilter;
    
    return matchesSearch && matchesType;
  });

  // Get unique test types for filter
  const testTypes = Array.from(new Set(testResults.map(test => test.test_type)));

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
    <>
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Αποτελέσματα Τεστ</CardTitle>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label>Αναζήτηση</Label>
              <Input
                placeholder="Αναζήτηση αθλητή ή τύπου τεστ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div>
              <Label>Τύπος Τεστ</Label>
              <Select value={testTypeFilter} onValueChange={setTestTypeFilter}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Όλα τα τεστ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Όλα τα τεστ</SelectItem>
                  {testTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredTests.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {testResults.length === 0 ? "Δεν βρέθηκαν τεστ" : "Δεν βρέθηκαν τεστ με τα κριτήρια αναζήτησης"}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredTests.map((test) => (
                <TestResultItem
                  key={`${test.table_name}-${test.id}`}
                  test={test}
                  onDelete={deleteTest}
                  onView={handleView}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TestViewDialog
        isOpen={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        test={selectedTest}
      />

      <TestEditDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        test={selectedTest}
        onSave={handleSave}
      />
    </>
  );
};
