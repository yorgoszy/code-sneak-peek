import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

interface AnthropometricNewRecordProps {
  userId: string;
  onRecordCreated?: () => void;
}

export const AnthropometricNewRecord: React.FC<AnthropometricNewRecordProps> = ({ 
  userId, 
  onRecordCreated 
}) => {
  const { toast } = useToast();
  const [testDate, setTestDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    body_fat_percentage: "",
    muscle_mass_percentage: "",
    chest_circumference: "",
    waist_circumference: "",
    hip_circumference: "",
    arm_circumference: "",
    thigh_circumference: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Δημιουργία session
      const { data: sessionData, error: sessionError } = await supabase
        .from('anthropometric_test_sessions')
        .insert({
          user_id: userId,
          test_date: format(testDate, 'yyyy-MM-dd'),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Δημιουργία test data
      const testData: any = {
        test_session_id: sessionData.id,
      };

      // Προσθήκη μόνο των συμπληρωμένων πεδίων
      Object.entries(formData).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          testData[key] = parseFloat(value);
        }
      });

      const { error: dataError } = await supabase
        .from('anthropometric_test_data')
        .insert(testData);

      if (dataError) throw dataError;

      toast({
        title: "Επιτυχία",
        description: "Η καταγραφή αποθηκεύτηκε επιτυχώς",
      });

      // Reset form
      setFormData({
        weight: "",
        height: "",
        body_fat_percentage: "",
        muscle_mass_percentage: "",
        chest_circumference: "",
        waist_circumference: "",
        hip_circumference: "",
        arm_circumference: "",
        thigh_circumference: "",
      });

      onRecordCreated?.();
    } catch (error) {
      console.error('Error saving record:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία αποθήκευσης καταγραφής",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Ημερομηνία Τεστ</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal rounded-none"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {testDate ? format(testDate, "PPP", { locale: el }) : "Επιλέξτε ημερομηνία"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-none">
            <Calendar
              mode="single"
              selected={testDate}
              onSelect={(date) => date && setTestDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weight">Βάρος (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={formData.weight}
            onChange={(e) => handleInputChange("weight", e.target.value)}
            className="rounded-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="height">Ύψος (cm)</Label>
          <Input
            id="height"
            type="number"
            step="0.1"
            value={formData.height}
            onChange={(e) => handleInputChange("height", e.target.value)}
            className="rounded-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body_fat_percentage">Λίπος (%)</Label>
          <Input
            id="body_fat_percentage"
            type="number"
            step="0.1"
            value={formData.body_fat_percentage}
            onChange={(e) => handleInputChange("body_fat_percentage", e.target.value)}
            className="rounded-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="muscle_mass_percentage">Μυϊκή Μάζα (%)</Label>
          <Input
            id="muscle_mass_percentage"
            type="number"
            step="0.1"
            value={formData.muscle_mass_percentage}
            onChange={(e) => handleInputChange("muscle_mass_percentage", e.target.value)}
            className="rounded-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="chest_circumference">Στήθος (cm)</Label>
          <Input
            id="chest_circumference"
            type="number"
            step="0.1"
            value={formData.chest_circumference}
            onChange={(e) => handleInputChange("chest_circumference", e.target.value)}
            className="rounded-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="waist_circumference">Μέση (cm)</Label>
          <Input
            id="waist_circumference"
            type="number"
            step="0.1"
            value={formData.waist_circumference}
            onChange={(e) => handleInputChange("waist_circumference", e.target.value)}
            className="rounded-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hip_circumference">Γοφοί (cm)</Label>
          <Input
            id="hip_circumference"
            type="number"
            step="0.1"
            value={formData.hip_circumference}
            onChange={(e) => handleInputChange("hip_circumference", e.target.value)}
            className="rounded-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="arm_circumference">Μπράτσο (cm)</Label>
          <Input
            id="arm_circumference"
            type="number"
            step="0.1"
            value={formData.arm_circumference}
            onChange={(e) => handleInputChange("arm_circumference", e.target.value)}
            className="rounded-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="thigh_circumference">Μηρός (cm)</Label>
          <Input
            id="thigh_circumference"
            type="number"
            step="0.1"
            value={formData.thigh_circumference}
            onChange={(e) => handleInputChange("thigh_circumference", e.target.value)}
            className="rounded-none"
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
        disabled={loading}
      >
        {loading ? "Αποθήκευση..." : "Αποθήκευση Καταγραφής"}
      </Button>
    </form>
  );
};
