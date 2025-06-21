
import React from "react";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { useTestsState } from "@/components/tests/useTestsState";
import { TestsHeader } from "@/components/tests/TestsHeader";
import { TestsAthleteDateSelector } from "@/components/tests/TestsAthleteDateSelector";
import { TestsTabs } from "@/components/tests/TestsTabs";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Tests = () => {
  const state = useTestsState();
  const isMobile = useIsMobile();

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

  const handleSignOut = async () => {
    // Handle sign out logic here
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <AppSidebar />
        
        <SidebarInset className="flex-1 flex flex-col">
          {/* Header */}
          <nav className={`bg-white border-b border-gray-200 ${isMobile ? 'px-3 py-3' : 'px-6 py-4'}`}>
            <div className="flex justify-between items-center">
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
                {isMobile && <SidebarTrigger />}
                <div className={`${isMobile ? 'min-w-0 flex-1' : ''}`}>
                  <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 ${isMobile ? 'truncate' : ''}`}>
                    Τεστ
                  </h1>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 ${isMobile ? 'truncate' : ''}`}>
                    {selectedAthleteName ? `Αθλητής: ${selectedAthleteName}` : 'Επιλέξτε αθλητή για τεστ'}
                  </p>
                </div>
              </div>
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
                <Button 
                  variant="outline" 
                  className={`rounded-none ${isMobile ? 'text-xs px-2' : ''}`}
                  onClick={handleSignOut}
                >
                  <LogOut className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                  {isMobile ? 'Exit' : 'Αποσύνδεση'}
                </Button>
              </div>
            </div>
          </nav>

          <div className={`flex-1 ${isMobile ? 'p-3' : 'p-6'}`}>
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
              <div className={`text-center ${isMobile ? 'py-8' : 'py-12'} text-gray-500`}>
                <p className={isMobile ? 'text-sm' : ''}>Παρακαλώ επιλέξτε αθλητή για να ξεκινήσετε τα τεστ</p>
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Tests;
