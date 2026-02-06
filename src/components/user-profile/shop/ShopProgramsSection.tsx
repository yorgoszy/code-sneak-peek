import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ShopProgramCard } from './ShopProgramCard';

interface Program {
  id: string;
  name: string;
  description: string | null;
  price: number;
  program_weeks?: { id: string }[];
  created_by: string;
}

export const ShopProgramsSection: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name, description, price, created_by, program_weeks!program_weeks_program_id_fkey(id)')
        .eq('is_sellable', true)
        .gt('price', 0)
        .order('name');

      if (error) throw error;

      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00ffba] mx-auto"></div>
      </div>
    );
  }

  if (programs.length === 0) {
    return null; // Don't show section if no programs
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Dumbbell className="w-5 h-5 text-[#00ffba]" />
        <h3 className="text-lg font-semibold">Προγράμματα Προπόνησης</h3>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <ShopProgramCard key={program.id} program={program} />
        ))}
      </div>
    </div>
  );
};
