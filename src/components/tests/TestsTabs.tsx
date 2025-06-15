
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AnthropometricTests } from "@/components/tests/AnthropometricTests";
import { FunctionalTests } from "@/components/tests/FunctionalTests";
import { StrengthTests } from "@/components/tests/StrengthTests";
import { EnduranceTests } from "@/components/tests/EnduranceTests";
import { JumpTests } from "@/components/tests/JumpTests";

interface TestsTabsProps {
  selectedAthleteId: string;
  selectedDate: string;
  activeTab: string;
  setActiveTab: (val: string) => void;
  anthropometricData: any;
  setAnthropometricData: any;
  functionalData: any;
  setFunctionalData: any;
  enduranceData: any;
  setEnduranceData: any;
  jumpData: any;
  setJumpData: any;
  saveAnthropometricData: () => void;
  saveFunctionalData: () => void;
  saveEnduranceData: () => void;
  saveJumpData: () => void;
  strengthSessionRef: any;
}

export const TestsTabs: React.FC<TestsTabsProps> = (props) => {
  if (!props.selectedAthleteId) return null;
  return (
    <Tabs value={props.activeTab} onValueChange={props.setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5 rounded-none">
        <TabsTrigger value="anthropometric" className="rounded-none">Σωματομετρικά</TabsTrigger>
        <TabsTrigger value="functional" className="rounded-none">Λειτουργικότητα</TabsTrigger>
        <TabsTrigger value="strength" className="rounded-none">Δύναμη</TabsTrigger>
        <TabsTrigger value="endurance" className="rounded-none">Αντοχή</TabsTrigger>
        <TabsTrigger value="jumps" className="rounded-none">Άλματα</TabsTrigger>
      </TabsList>

      <TabsContent value="anthropometric" className="mt-6">
        <div className="space-y-4">
          <AnthropometricTests
            selectedAthleteId={props.selectedAthleteId}
            selectedDate={props.selectedDate}
            hideSubmitButton={true}
            formData={props.anthropometricData}
            onDataChange={props.setAnthropometricData}
          />
          <div className="flex justify-end">
            <Button
              onClick={props.saveAnthropometricData}
              className="rounded-none"
              disabled={!props.selectedAthleteId}
            >
              Καταγραφή Σωματομετρικών
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="functional" className="mt-6">
        <div className="space-y-4">
          <FunctionalTests
            selectedAthleteId={props.selectedAthleteId}
            selectedDate={props.selectedDate}
            hideSubmitButton={true}
            formData={props.functionalData}
            onDataChange={props.setFunctionalData}
          />
          <div className="flex justify-end">
            <Button
              onClick={props.saveFunctionalData}
              className="rounded-none"
              disabled={!props.selectedAthleteId}
            >
              Καταγραφή Λειτουργικών
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="strength" className="mt-6">
        <div className="mb-4 text-xs text-gray-600">
          Η αποθήκευση στα strength tests γίνεται μόνο από το κουμπί στο κάθε session ("Αποθήκευση" ή "Ενημέρωση" κάτω από το τεστ).
        </div>
        <StrengthTests
          selectedAthleteId={props.selectedAthleteId}
          selectedDate={props.selectedDate}
          registerReset={(resetFn: () => void) => {
            if (!props.strengthSessionRef.current) props.strengthSessionRef.current = {};
            props.strengthSessionRef.current.reset = resetFn;
          }}
        />
      </TabsContent>

      <TabsContent value="endurance" className="mt-6">
        <div className="space-y-4">
          <EnduranceTests
            selectedAthleteId={props.selectedAthleteId}
            selectedDate={props.selectedDate}
            hideSubmitButton={true}
            formData={props.enduranceData}
            onDataChange={props.setEnduranceData}
          />
          <div className="flex justify-end">
            <Button
              onClick={props.saveEnduranceData}
              className="rounded-none"
              disabled={!props.selectedAthleteId}
            >
              Καταγραφή Αντοχής
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="jumps" className="mt-6">
        <div className="space-y-4">
          <JumpTests
            selectedAthleteId={props.selectedAthleteId}
            selectedDate={props.selectedDate}
            hideSubmitButton={true}
            formData={props.jumpData}
            onDataChange={props.setJumpData}
          />
          <div className="flex justify-end">
            <Button
              onClick={props.saveJumpData}
              className="rounded-none"
              disabled={!props.selectedAthleteId}
            >
              Καταγραφή Αλμάτων
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};
