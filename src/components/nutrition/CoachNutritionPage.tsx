import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, List, Utensils } from "lucide-react";
import { toast } from "sonner";
import { CoachNutritionPlanList } from "./CoachNutritionPlanList";
import { CoachNutritionAssignments } from "./CoachNutritionAssignments";
import { NutritionBuilderDialog } from "./NutritionBuilderDialog";
import { FoodsManagement } from "./FoodsManagement";

export const CoachNutritionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("plans");
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePlanCreated = () => {
    setIsBuilderOpen(false);
    setRefreshKey(prev => prev + 1);
    toast.success("Το πρόγραμμα διατροφής δημιουργήθηκε επιτυχώς!");
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Διατροφή</h1>
          <p className="text-xs sm:text-sm text-gray-500">Διαχείριση προγραμμάτων διατροφής για τους αθλητές σας</p>
        </div>
        <Button 
          onClick={() => setIsBuilderOpen(true)} 
          className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black text-xs sm:text-sm h-8 sm:h-10 w-full sm:w-auto"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          Νέο Πρόγραμμα
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="rounded-none grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="plans" className="rounded-none text-[10px] sm:text-sm py-2 sm:py-2.5 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2">
            <List className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Προγράμματα</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="rounded-none text-[10px] sm:text-sm py-2 sm:py-2.5 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Αναθέσεις</span>
          </TabsTrigger>
          <TabsTrigger value="foods" className="rounded-none text-[10px] sm:text-sm py-2 sm:py-2.5 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2">
            <Utensils className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Τράπεζα</span> <span>Φαγητών</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4">
          <CoachNutritionPlanList key={`plans-${refreshKey}`} />
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <CoachNutritionAssignments key={`assignments-${refreshKey}`} />
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