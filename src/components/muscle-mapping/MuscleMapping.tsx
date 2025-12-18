import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dumbbell, Target, FlaskConical, Palette } from 'lucide-react';
import { MuscleList } from './MuscleList';
import { AllTestsPanel } from './AllTestsPanel';
import { MusclePositionMapper } from './MusclePositionMapper';
import { BodyMapExperiment } from './BodyMapExperiment';

export const MuscleMapping = () => {
  const [activeTab, setActiveTab] = useState('tests');

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">Muscle Mapping</h1>
          <p className="text-sm md:text-base text-gray-600">
            Διαχείριση μυών και συνδέσεων με λειτουργικά τεστ
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="rounded-none w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="tests" className="rounded-none flex-1 min-w-[80px] text-xs sm:text-sm">
            <FlaskConical className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Λειτουργικά</span> Τεστ
          </TabsTrigger>
          <TabsTrigger value="muscles" className="rounded-none flex-1 min-w-[80px] text-xs sm:text-sm">
            <Dumbbell className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Τράπεζα</span> Μυών
          </TabsTrigger>
          <TabsTrigger value="3d-mapper" className="rounded-none flex-1 min-w-[80px] text-xs sm:text-sm">
            <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            3D Mapper
          </TabsTrigger>
          <TabsTrigger value="experiment" className="rounded-none flex-1 min-w-[80px] text-xs sm:text-sm">
            <Palette className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Πειραματισμός
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="mt-3 md:mt-4">
          <AllTestsPanel />
        </TabsContent>

        <TabsContent value="muscles" className="mt-3 md:mt-4">
          <MuscleList />
        </TabsContent>

        <TabsContent value="3d-mapper" className="mt-3 md:mt-4">
          <MusclePositionMapper />
        </TabsContent>

        <TabsContent value="experiment" className="mt-3 md:mt-4">
          <BodyMapExperiment />
        </TabsContent>
      </Tabs>
    </div>
  );
};
