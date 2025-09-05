
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnthropometricTests } from "./AnthropometricTests";
import { FunctionalTests } from "./FunctionalTests";
import { EnduranceTests } from "./EnduranceTests";
import { JumpTests } from "./JumpTests";
import { StrengthTests } from "./StrengthTests";

interface TestsTabsProps {
  selectedAthleteId: string;
  selectedDate: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  anthropometricData: any;
  setAnthropometricData: (data: any) => void;
  functionalData: any;
  setFunctionalData: (data: any) => void;
  enduranceData: any;
  setEnduranceData: (data: any) => void;
  jumpData: any;
  setJumpData: (data: any) => void;
  strengthSessionRef: React.MutableRefObject<any>;
  saving?: boolean;
}

export const TestsTabs: React.FC<TestsTabsProps> = ({
  selectedAthleteId,
  selectedDate,
  activeTab,
  setActiveTab,
  anthropometricData,
  setAnthropometricData,
  functionalData,
  setFunctionalData,
  enduranceData,
  setEnduranceData,
  jumpData,
  setJumpData,
  strengthSessionRef,
  saving = false,
}) => {
  if (!selectedAthleteId) return null;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5 rounded-none">
        <TabsTrigger value="anthropometric" className="rounded-none">
          Σωματομετρικά
        </TabsTrigger>
        <TabsTrigger value="functional" className="rounded-none">
          Λειτουργικότητα
        </TabsTrigger>
        <TabsTrigger value="endurance" className="rounded-none">
          Αντοχή
        </TabsTrigger>
        <TabsTrigger value="jump" className="rounded-none">
          Άλματα
        </TabsTrigger>
        <TabsTrigger value="strength" className="rounded-none">
          Δύναμη
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent value="anthropometric" className="space-y-4">
          <AnthropometricTests
            selectedAthleteId={selectedAthleteId}
            selectedDate={selectedDate}
            hideSubmitButton={true}
            formData={anthropometricData}
            onDataChange={setAnthropometricData}
          />
        </TabsContent>

        <TabsContent value="functional" className="space-y-4">
          <FunctionalTests
            selectedAthleteId={selectedAthleteId}
            selectedDate={selectedDate}
            hideSubmitButton={true}
            formData={functionalData}
            onDataChange={setFunctionalData}
          />
        </TabsContent>

        <TabsContent value="endurance" className="space-y-4">
          <EnduranceTests
            selectedAthleteId={selectedAthleteId}
            selectedDate={selectedDate}
            hideSubmitButton={true}
            formData={enduranceData}
            onDataChange={setEnduranceData}
          />
        </TabsContent>

        <TabsContent value="jump" className="space-y-4">
          <JumpTests
            selectedAthleteId={selectedAthleteId}
            selectedDate={selectedDate}
            hideSubmitButton={true}
            formData={jumpData}
            onDataChange={setJumpData}
          />
        </TabsContent>

        <TabsContent value="strength" className="space-y-4">
          <StrengthTests
            selectedAthleteId={selectedAthleteId}
            selectedDate={selectedDate}
          />
          {saving && (
            <div className="text-center text-gray-600 mt-4">
              <p>Αποθήκευση δεδομένων δύναμης...</p>
            </div>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
};
