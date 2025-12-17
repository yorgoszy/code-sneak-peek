import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, List, Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NutritionPlanList } from "./NutritionPlanList";
import { NutritionAssignments } from "./NutritionAssignments";
import { NutritionBuilderDialog } from "./NutritionBuilderDialog";
import { FoodsManagement } from "./FoodsManagement";

export const NutritionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("plans");
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePlanCreated = () => {
    setIsBuilderOpen(false);
    setRefreshKey(prev => prev + 1);
    toast.success("Το πρόγραμμα διατροφής δημιουργήθηκε επιτυχώς!");
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Διατροφή</h1>
          <p className="text-sm text-gray-500">Διαχείριση προγραμμάτων διατροφής</p>
        </div>
        <Button 
          onClick={() => setIsBuilderOpen(true)} 
          className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          Νέο Πρόγραμμα
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="rounded-none grid w-full grid-cols-3">
          <TabsTrigger value="plans" className="rounded-none">
            <List className="w-4 h-4 mr-2" />
            Προγράμματα
          </TabsTrigger>
          <TabsTrigger value="assignments" className="rounded-none">
            <Calendar className="w-4 h-4 mr-2" />
            Αναθέσεις
          </TabsTrigger>
          <TabsTrigger value="foods" className="rounded-none">
            <Utensils className="w-4 h-4 mr-2" />
            Τράπεζα Φαγητών
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4">
          <NutritionPlanList key={`plans-${refreshKey}`} />
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <NutritionAssignments key={`assignments-${refreshKey}`} />
        </TabsContent>

        <TabsContent value="foods" className="mt-4">
          <FoodsManagement key={`foods-${refreshKey}`} />
        </TabsContent>
      </Tabs>

      <NutritionBuilderDialog
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSuccess={handlePlanCreated}
      />
    </div>
  );
};
