
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestResultsList } from "@/components/results/TestResultsList";
import { LoadVelocityChart } from "@/components/charts/LoadVelocityChart";
import { FunctionalTestResults } from "@/components/charts/FunctionalTestResults";

const Results = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="flex-1 flex flex-col">
        <nav className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Αποτελέσματα</h1>
              <p className="text-sm text-gray-600">
                Ανάλυση αποτελεσμάτων τεστ και προόδου
              </p>
            </div>
          </div>
        </nav>

        <div className="flex-1 p-6">
          <Tabs defaultValue="tests" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-none">
              <TabsTrigger value="tests" className="rounded-none">Τεστ</TabsTrigger>
              <TabsTrigger value="strength" className="rounded-none">Δύναμη</TabsTrigger>
              <TabsTrigger value="functional" className="rounded-none">Λειτουργικότητα</TabsTrigger>
            </TabsList>

            <TabsContent value="tests" className="mt-6">
              <TestResultsList />
            </TabsContent>

            <TabsContent value="strength" className="mt-6">
              <LoadVelocityChart />
            </TabsContent>

            <TabsContent value="functional" className="mt-6">
              <FunctionalTestResults />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Results;
