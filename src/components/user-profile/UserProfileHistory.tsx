import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProgressSection } from "./UserProgressSection";
import { ForceVelocityHistory } from "./ForceVelocityHistory";
import { EnduranceHistory } from "./EnduranceHistory";

interface UserProfileHistoryProps {
  userId: string;
}

export const UserProfileHistory: React.FC<UserProfileHistoryProps> = ({ userId }) => {
  const [activeHistoryTab, setActiveHistoryTab] = useState("force-velocity");

  return (
    <div className="space-y-4">
      <Tabs value={activeHistoryTab} onValueChange={setActiveHistoryTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-none">
          <TabsTrigger value="force-velocity" className="rounded-none">
            Force/Velocity
          </TabsTrigger>
          <TabsTrigger value="endurance" className="rounded-none">
            Endurance
          </TabsTrigger>
          <TabsTrigger value="jump-profile" className="rounded-none">
            Jump Profile
          </TabsTrigger>
          <TabsTrigger value="anthropometric" className="rounded-none">
            Σωματομετρικά
          </TabsTrigger>
        </TabsList>

        <TabsContent value="force-velocity" className="mt-4">
          <ForceVelocityHistory userId={userId} />
        </TabsContent>

        <TabsContent value="endurance" className="mt-4">
          <EnduranceHistory userId={userId} />
        </TabsContent>

        <TabsContent value="jump-profile" className="mt-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Jump Profile Ιστορικό</h3>
            {/* Jump Profile content */}
            <UserProgressSection userId={userId} />
          </div>
        </TabsContent>

        <TabsContent value="anthropometric" className="mt-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Σωματομετρικά Ιστορικό</h3>
            {/* Anthropometric content */}
            <UserProgressSection userId={userId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
