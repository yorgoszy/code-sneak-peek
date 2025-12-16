import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProgressSection } from "./UserProgressSection";
import { ForceVelocityHistory } from "./ForceVelocityHistory";
import { EnduranceHistory } from "./EnduranceHistory";
import { JumpHistory } from "./JumpHistory";
import { AnthropometricHistory } from "./AnthropometricHistory";
import { FunctionalHistory } from "./FunctionalHistory";

interface UserProfileHistoryProps {
  userId: string;
}

export const UserProfileHistory: React.FC<UserProfileHistoryProps> = ({ userId }) => {
  const { t } = useTranslation();
  const [activeHistoryTab, setActiveHistoryTab] = useState("force-velocity");

  return (
    <div className="space-y-4">
      <Tabs value={activeHistoryTab} onValueChange={setActiveHistoryTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 rounded-none h-auto gap-0">
          <TabsTrigger value="force-velocity" className="rounded-none text-[10px] sm:text-sm px-1 py-2">
            {t('history.forceVelocity')}
          </TabsTrigger>
          <TabsTrigger value="endurance" className="rounded-none text-[10px] sm:text-sm px-1 py-2">
            {t('history.endurance')}
          </TabsTrigger>
          <TabsTrigger value="jump-profile" className="rounded-none text-[10px] sm:text-sm px-1 py-2">
            {t('history.jumpProfile')}
          </TabsTrigger>
          <TabsTrigger value="anthropometric" className="rounded-none text-[10px] sm:text-sm px-1 py-2">
            {t('history.anthropometric')}
          </TabsTrigger>
          <TabsTrigger value="functional" className="rounded-none text-[10px] sm:text-sm px-1 py-2">
            {t('history.functional', 'Λειτουργικά')}
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="functional" className="mt-4">
          <FunctionalHistory userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
