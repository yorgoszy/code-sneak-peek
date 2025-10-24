import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StretchesList } from './StretchesList';
import { ExerciseStretchLinks } from './ExerciseStretchLinks';

export const StretchesManagement: React.FC = () => {
  return (
    <Tabs defaultValue="stretches" className="w-full">
      <TabsList className="grid w-full grid-cols-2 rounded-none">
        <TabsTrigger value="stretches" className="rounded-none">
          Διατάσεις
        </TabsTrigger>
        <TabsTrigger value="links" className="rounded-none">
          Σύνδεση με Ασκήσεις
        </TabsTrigger>
      </TabsList>

      <TabsContent value="stretches" className="mt-6">
        <StretchesList />
      </TabsContent>

      <TabsContent value="links" className="mt-6">
        <ExerciseStretchLinks />
      </TabsContent>
    </Tabs>
  );
};
