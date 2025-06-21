
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { TestResultsList } from "@/components/results/TestResultsList";

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
                Προβολή, επεξεργασία και διαχείριση όλων των τεστ
              </p>
            </div>
          </div>
        </nav>

        <div className="flex-1 p-6">
          <TestResultsList />
        </div>
      </div>
    </div>
  );
};

export default Results;
