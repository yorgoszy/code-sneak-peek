import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dumbbell, User } from 'lucide-react';
import { MuscleList } from './MuscleList';
import { AllTestsPanel } from './AllTestsPanel';
import { MusclePositionMapper } from './MusclePositionMapper';

export const MuscleMapping = () => {
  const [activeTab, setActiveTab] = useState('tests');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Muscle Mapping</h1>
          <p className="text-gray-600">
            Διαχείριση μυών και συνδέσεων με λειτουργικά τεστ
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="rounded-none">
          <TabsTrigger value="tests" className="rounded-none">
            Λειτουργικά Τεστ
          </TabsTrigger>
          <TabsTrigger value="muscles" className="rounded-none">
            <Dumbbell className="w-4 h-4 mr-2" />
            Τράπεζα Μυών
          </TabsTrigger>
          <TabsTrigger value="3d-mapper" className="rounded-none">
            <User className="w-4 h-4 mr-2" />
            3D Muscle Mapper
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="mt-4">
          <AllTestsPanel />
        </TabsContent>

        <TabsContent value="muscles" className="mt-4">
          <MuscleList />
        </TabsContent>

        <TabsContent value="3d-mapper" className="mt-4">
          <MusclePositionMapper />
        </TabsContent>
      </Tabs>
    </div>
  );
};
