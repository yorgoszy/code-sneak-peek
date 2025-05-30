
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnthropometricTests } from "@/components/tests/AnthropometricTests";
import { FunctionalTests } from "@/components/tests/FunctionalTests";
import { StrengthTests } from "@/components/tests/StrengthTests";
import { EnduranceTests } from "@/components/tests/EnduranceTests";
import { JumpTests } from "@/components/tests/JumpTests";

const Tests = () => {
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
              <h1 className="text-2xl font-bold text-gray-900">Τεστ</h1>
              <p className="text-sm text-gray-600">
                Διαχείριση τεστ αθλητών
              </p>
            </div>
          </div>
        </nav>

        <div className="flex-1 p-6">
          <Tabs defaultValue="anthropometric" className="w-full">
            <TabsList className="grid w-full grid-cols-5 rounded-none">
              <TabsTrigger value="anthropometric" className="rounded-none">Σωματομετρικά</TabsTrigger>
              <TabsTrigger value="functional" className="rounded-none">Λειτουργικότητα</TabsTrigger>
              <TabsTrigger value="strength" className="rounded-none">Δύναμη</TabsTrigger>
              <TabsTrigger value="endurance" className="rounded-none">Αντοχή</TabsTrigger>
              <TabsTrigger value="jumps" className="rounded-none">Άλματα</TabsTrigger>
            </TabsList>

            <TabsContent value="anthropometric" className="mt-6">
              <AnthropometricTests />
            </TabsContent>

            <TabsContent value="functional" className="mt-6">
              <FunctionalTests />
            </TabsContent>

            <TabsContent value="strength" className="mt-6">
              <StrengthTests />
            </TabsContent>

            <TabsContent value="endurance" className="mt-6">
              <EnduranceTests />
            </TabsContent>

            <TabsContent value="jumps" className="mt-6">
              <JumpTests />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Tests;
