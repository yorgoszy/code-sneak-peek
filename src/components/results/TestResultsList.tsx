
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
  const [dateFilter, setDateFilter] = useState("");

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
    const matchesDate = !dateFilter || test.test_date === dateFilter;
    
    return matchesSearch && matchesType && matchesDate;
  });

  // Group tests by date
  const groupedByDate = filteredTests.reduce((groups, test) => {
    const date = test.test_date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(test);
    return groups;
  }, {} as Record<string, TestResult[]>);

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
            <div>
              <Label>Ημερομηνία</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-none"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredTests.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {testResults.length === 0 ? "Δεν βρέθηκαν τεστ" : "Δεν βρέθηκαν τεστ με τα κριτήρια αναζήτησης"}
            </p>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((date) => (
                <div key={date}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">
                    {new Date(date).toLocaleDateString('el-GR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <div className="space-y-3">
                    {groupedByDate[date].map((test) => (
                      <TestResultItem
                        key={`${test.table_name}-${test.id}`}
                        test={test}
                        onDelete={deleteTest}
                        onView={handleView}
                        onEdit={handleEdit}
                      />
                    ))}
                  </div>
                </div>
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
