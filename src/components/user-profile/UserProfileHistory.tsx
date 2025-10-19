import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProgressSection } from "./UserProgressSection";
import { ForceVelocityHistory } from "./ForceVelocityHistory";
import { EnduranceHistory } from "./EnduranceHistory";
import { JumpHistory } from "./JumpHistory";
import { AnthropometricHistory } from "./AnthropometricHistory";

interface UserProfileHistoryProps {
  userId: string;
}

export const UserProfileHistory: React.FC<UserProfileHistoryProps> = ({ userId }) => {
  const [activeHistoryTab, setActiveHistoryTab] = useState("force-velocity");

  return (
    <div className="space-y-4">
      <Tabs value={activeHistoryTab} onValueChange={setActiveHistoryTab} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full min-w-max grid-cols-4 rounded-none md:min-w-0">
            <TabsTrigger value="force-velocity" className="rounded-none text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
              Force/Velocity
            </TabsTrigger>
            <TabsTrigger value="endurance" className="rounded-none text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
              Endurance
            </TabsTrigger>
            <TabsTrigger value="jump-profile" className="rounded-none text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
              Jump Profile
            </TabsTrigger>
            <TabsTrigger value="anthropometric" className="rounded-none text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
              Σωματομετρικά
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="force-velocity" className="mt-4">
          <ForceVelocityHistory userId={userId} />
        </TabsContent>

        <TabsContent value="endurance" className="mt-4">
          <EnduranceHistory userId={userId} />
        </TabsContent>

        <TabsContent value="jump-profile" className="mt-4">
          <JumpHistory userId={userId} />
        </TabsContent>

        <TabsContent value="anthropometric" className="mt-4">
          <AnthropometricHistory userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
