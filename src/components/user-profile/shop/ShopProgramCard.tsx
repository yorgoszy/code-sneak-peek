import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Dumbbell, ShoppingCart, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarSection } from "@/components/programs/builder/CalendarSection";
import { formatDateForStorage } from "@/utils/dateUtils";
import type { ProgramStructure } from "@/components/programs/builder/hooks/useProgramBuilderState";

interface Program {
  id: string;
  name: string;
  description: string | null;
  price: number;
  program_weeks?: { id: string }[];
  created_by: string;
}

interface ShopProgramCardProps {
  program: Program;
}

export const ShopProgramCard: React.FC<ShopProgramCardProps> = ({ program }) => {
  const [purchasing, setPurchasing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [trainingDates, setTrainingDates] = useState<Date[]>([]);
  const [programStructure, setProgramStructure] = useState<ProgramStructure | null>(null);
  const [totalDays, setTotalDays] = useState(0);
  const [loading, setLoading] = useState(false);

  const weeksCount = program.program_weeks?.length || 0;

  const fetchProgramStructure = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          id, name, description,
          program_weeks!program_weeks_program_id_fkey(
            id, week_number, name,
            program_days!fk_program_days_week_id(id, day_number, name, is_test_day, test_types, is_competition_day)
          )
        `)
        .eq('id', program.id)
        .single();

      if (error) throw error;

      const weeks = (data.program_weeks || [])
        .sort((a: any, b: any) => a.week_number - b.week_number)
        .map((w: any) => ({
          id: w.id,
          name: w.name || `Εβδομάδα ${w.week_number}`,
          week_number: w.week_number,
          program_days: (w.program_days || [])
            .sort((a: any, b: any) => a.day_number - b.day_number)
            .map((d: any) => ({
              id: d.id,
              name: d.name || `Ημέρα ${d.day_number}`,
              day_number: d.day_number,
              is_test_day: d.is_test_day || false,
              test_types: d.test_types || [],
              is_competition_day: d.is_competition_day || false,
              program_blocks: []
            }))
        }));

      const total = weeks.reduce((acc: number, w: any) => acc + (w.program_days?.length || 0), 0);

      setProgramStructure({
        id: data.id,
        name: data.name || '',
        description: data.description || '',
        user_id: '',
        user_ids: [],
        is_multiple_assignment: false,
        training_dates: [],
        weeks
      });
      setTotalDays(total);
    } catch (err) {
      console.error('Error fetching program structure:', err);
      toast.error('Σφάλμα φόρτωσης προγράμματος');
    } finally {
      setLoading(false);
    }
  }, [program.id]);

  const handleOpenDialog = async () => {
    setDialogOpen(true);
    setTrainingDates([]);
    await fetchProgramStructure();
  };

  const handleTrainingDatesChange = (dates: Date[]) => {
    setTrainingDates(dates);
    if (programStructure) {
      setProgramStructure(prev => prev ? { ...prev, training_dates: dates } : prev);
    }
  };

  const handlePurchase = async () => {
    if (trainingDates.length === 0) {
      toast.error('Επιλέξτε ημερομηνίες προπόνησης');
      return;
    }

    setPurchasing(true);
    try {
      const trainingDateStrings = trainingDates.map(d => formatDateForStorage(d));

      const { data, error } = await supabase.functions.invoke('create-program-checkout', {
        body: {
          program_id: program.id,
          training_dates: trainingDateStrings
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Σφάλμα κατά την αγορά');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <>
      <Card className="rounded-none hover:shadow-lg transition-all duration-200 flex flex-col h-[400px]">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center items-center mb-4">
            <div className="bg-gray-100 p-3 rounded-full">
              <Dumbbell className="w-6 h-6 text-gray-700" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold">{program.name}</CardTitle>
          <div className="text-3xl font-bold text-gray-900">
            €{program.price}
          </div>
        </CardHeader>
        <CardContent className="pt-0 flex-1 flex flex-col">
          <div className="space-y-3 mb-6 flex-1">
            {program.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{program.description}</p>
            )}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                Διάρκεια
              </span>
              <Badge variant="secondary" className="rounded-none">
                {weeksCount} εβδομάδες
              </Badge>
            </div>
          </div>

          <div className="mt-auto">
            <Button 
              onClick={handleOpenDialog}
              className="w-full bg-black hover:bg-gray-800 text-white rounded-none"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Αγορά
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-none max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Επιλογή ημερομηνιών προπόνησης - {program.name}</DialogTitle>
          </DialogHeader>
          
          <div className="py-2">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Φόρτωση...</div>
            ) : programStructure && totalDays > 0 ? (
              <CalendarSection
                program={programStructure}
                totalDays={totalDays}
                onTrainingDatesChange={handleTrainingDatesChange}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                Δεν βρέθηκε δομή προγράμματος
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              className="rounded-none"
            >
              Ακύρωση
            </Button>
            <Button 
              onClick={handlePurchase}
              disabled={purchasing || trainingDates.length === 0 || trainingDates.length < totalDays}
              className="bg-black hover:bg-gray-800 text-white rounded-none"
            >
              {purchasing ? 'Επεξεργασία...' : `Αγορά €${program.price}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
