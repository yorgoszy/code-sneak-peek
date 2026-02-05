import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Dumbbell, ShoppingCart, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Δευτέρα' },
  { key: 'tuesday', label: 'Τρίτη' },
  { key: 'wednesday', label: 'Τετάρτη' },
  { key: 'thursday', label: 'Πέμπτη' },
  { key: 'friday', label: 'Παρασκευή' },
  { key: 'saturday', label: 'Σάββατο' },
  { key: 'sunday', label: 'Κυριακή' },
];

export const ShopProgramCard: React.FC<ShopProgramCardProps> = ({ program }) => {
  const { t } = useTranslation();
  const [purchasing, setPurchasing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const weeksCount = program.program_weeks?.length || 0;

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handlePurchase = async () => {
    if (selectedDays.length === 0) {
      toast.error('Επιλέξτε τουλάχιστον μία ημέρα προπόνησης');
      return;
    }

    setPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-program-checkout', {
        body: {
          program_id: program.id,
          training_days: selectedDays
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
            <div className="bg-[#00ffba]/20 p-3 rounded-full">
              <Dumbbell className="w-6 h-6 text-[#00ffba]" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold">{program.name}</CardTitle>
          <div className="text-3xl font-bold text-[#cb8954]">
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
                <Calendar className="w-4 h-4 mr-2 text-[#00ffba]" />
                Διάρκεια
              </span>
              <Badge variant="secondary" className="rounded-none">
                {weeksCount} εβδομάδες
              </Badge>
            </div>
          </div>

          <div className="mt-auto">
            <Button 
              onClick={() => setDialogOpen(true)}
              className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Αγορά
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle>Επιλογή ημερών προπόνησης</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Επιλέξτε τις ημέρες που θέλετε να προπονείστε:
            </p>
            <div className="space-y-2">
              {DAYS_OF_WEEK.map(day => (
                <div 
                  key={day.key}
                  className="flex items-center p-3 border border-gray-200 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleDayToggle(day.key)}
                >
                  <Checkbox 
                    checked={selectedDays.includes(day.key)}
                    onCheckedChange={() => handleDayToggle(day.key)}
                    className="mr-3"
                  />
                  <span>{day.label}</span>
                </div>
              ))}
            </div>
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
              disabled={purchasing || selectedDays.length === 0}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              {purchasing ? 'Επεξεργασία...' : `Αγορά €${program.price}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
