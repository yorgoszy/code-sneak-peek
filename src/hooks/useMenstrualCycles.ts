import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CycleRecord } from "@/utils/cyclePhase";
import { toast } from "sonner";

export const useMenstrualCycles = (userId: string | null | undefined) => {
  const [cycles, setCycles] = useState<CycleRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCycles = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("menstrual_cycles")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false });
    setLoading(false);
    if (error) {
      console.error("[useMenstrualCycles] fetch error", error);
      return;
    }
    setCycles((data || []) as CycleRecord[]);
  }, [userId]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  const addCycle = async (input: {
    start_date: string;
    period_length?: number;
    cycle_length?: number;
    notes?: string;
  }) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("menstrual_cycles")
      .insert({
        user_id: userId,
        start_date: input.start_date,
        period_length: input.period_length ?? 5,
        cycle_length: input.cycle_length ?? 28,
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (error) {
      toast.error("Αποτυχία καταχώρησης: " + error.message);
      return null;
    }
    toast.success("Καταχωρήθηκε");
    await fetchCycles();
    return data as CycleRecord;
  };

  const updateCycle = async (id: string, updates: Partial<CycleRecord>) => {
    const { error } = await supabase
      .from("menstrual_cycles")
      .update(updates)
      .eq("id", id);
    if (error) {
      toast.error("Αποτυχία ενημέρωσης: " + error.message);
      return false;
    }
    toast.success("Ενημερώθηκε");
    await fetchCycles();
    return true;
  };

  const deleteCycle = async (id: string) => {
    const { error } = await supabase
      .from("menstrual_cycles")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Αποτυχία διαγραφής: " + error.message);
      return false;
    }
    toast.success("Διαγράφηκε");
    await fetchCycles();
    return true;
  };

  return { cycles, loading, fetchCycles, addCycle, updateCycle, deleteCycle };
};
