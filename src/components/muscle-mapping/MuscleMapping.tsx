import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Save, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
import { MuscleList } from './MuscleList';
import { IssueMappingPanel } from './IssueMappingPanel';

export const MuscleMapping = () => {
  const [activeTab, setActiveTab] = useState('muscles');

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
          <TabsTrigger value="muscles" className="rounded-none">
            <Dumbbell className="w-4 h-4 mr-2" />
            Τράπεζα Μυών
          </TabsTrigger>
          <TabsTrigger value="posture" className="rounded-none">
            Στάση Σώματος
          </TabsTrigger>
          <TabsTrigger value="squat" className="rounded-none">
            Καθήματα
          </TabsTrigger>
          <TabsTrigger value="single_leg_squat" className="rounded-none">
            Μονοποδικά Καθήματα
          </TabsTrigger>
        </TabsList>

        <TabsContent value="muscles" className="mt-4">
          <MuscleList />
        </TabsContent>

        <TabsContent value="posture" className="mt-4">
          <IssueMappingPanel 
            category="posture" 
            title="Στάση Σώματος"
            issues={['Κύφωση', 'Λόρδωση', 'Πρηνισμός', 'Σκολίωση']}
          />
        </TabsContent>

        <TabsContent value="squat" className="mt-4">
          <IssueMappingPanel 
            category="squat" 
            title="Καθήματα"
            issues={[
              'Valgus ΑΡΙΣΤΕΡΑ', 'Valgus ΔΕΞΙΑ',
              'Varus ΑΡΙΣΤΕΡΑ', 'Varus ΔΕΞΙΑ',
              'Ανύψωση Πτέρνας ΑΡΙΣΤΕΡΑ', 'Ανύψωση Πτέρνας ΔΕΞΙΑ',
              'Υπερβολική Κάμψη Κορμού',
              'Πλάγια Κλίση',
              'Περιορισμένο ROM ΑΡΙΣΤΕΡΑ', 'Περιορισμένο ROM ΔΕΞΙΑ',
              'Ισχύς Γλουτών ΑΡΙΣΤΕΡΑ', 'Ισχύς Γλουτών ΔΕΞΙΑ'
            ]}
          />
        </TabsContent>

        <TabsContent value="single_leg_squat" className="mt-4">
          <IssueMappingPanel 
            category="single_leg_squat" 
            title="Μονοποδικά Καθήματα"
            issues={[
              'ΑΝΗΨΩΣΗ ΙΣΧΙΟΥ ΑΡΙΣΤΕΡΑ', 'ΑΝΗΨΩΣΗ ΙΣΧΙΟΥ ΔΕΞΙΑ',
              'ΠΤΩΣΗ ΙΣΧΙΟΥ ΑΡΙΣΤΕΡΑ', 'ΠΤΩΣΗ ΙΣΧΙΟΥ ΔΕΞΙΑ',
              'ΣΤΡΟΦΗ ΚΟΡΜΟΥ ΑΡΙΣΤΕΡΑ', 'ΣΤΡΟΦΗ ΚΟΡΜΟΥ ΔΕΞΙΑ'
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
