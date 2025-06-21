
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
          <TestsAthleteDateSelector 
            selectedAthleteId={state.selectedAthleteId}
            setSelectedAthleteId={state.setSelectedAthleteId}
            selectedDate={state.selectedDate}
            setSelectedDate={state.setSelectedDate}
            users={state.users}
            handleSaveAllTests={state.handleSaveAllTests}
            saving={state.saving}
          />
          <TestsTabs 
            selectedAthleteId={state.selectedAthleteId}
            selectedDate={state.selectedDate}
            activeTab={state.activeTab}
            setActiveTab={state.setActiveTab}
            anthropometricData={state.anthropometricData}
            setAnthropometricData={state.setAnthropometricData}
            functionalData={state.functionalData}
            setFunctionalData={state.setFunctionalData}
            enduranceData={state.enduranceData}
            setEnduranceData={state.setEnduranceData}
            jumpData={state.jumpData}
            setJumpData={state.setJumpData}
            strengthSessionRef={state.strengthSessionRef}
            saving={state.saving}
          />
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
