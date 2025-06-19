
import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { useTestsState } from "@/components/tests/useTestsState";
import { TestsHeader } from "@/components/tests/TestsHeader";
import { TestsAthleteDateSelector } from "@/components/tests/TestsAthleteDateSelector";
import { TestsTabs } from "@/components/tests/TestsTabs";

const Tests = () => {
  const state = useTestsState();

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <state.Navigate to="/auth" replace />;
  }

  const selectedAthleteName = state.users.find(u => u.id === state.selectedAthleteId)?.name;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isCollapsed={state.isCollapsed} setIsCollapsed={state.setIsCollapsed} />
      <div className="flex-1 flex flex-col">
        <TestsHeader 
          selectedAthleteId={state.selectedAthleteId}
          selectedAthleteName={selectedAthleteName}
        />
        <div className="flex-1 p-6">
          <TestsAthleteDateSelector {...state} />
          <TestsTabs {...state} />
          {!state.selectedAthleteId && (
            <div className="text-center py-12 text-gray-500">
              <p>Παρακαλώ επιλέξτε αθλητή για να ξεκινήσετε τα τεστ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tests;
