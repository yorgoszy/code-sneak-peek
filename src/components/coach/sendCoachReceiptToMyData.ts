import { supabase } from "@/integrations/supabase/client";

export interface CoachMyDataSendResult {
  success: boolean;
  skipped?: boolean;
  invoiceMark?: string | null;
  error?: string;
}

/** Sends a coach/club/federation receipt to AADE with the owner's own myDATA credentials. */
export async function sendCoachReceiptToMyData(receiptId: string, auto = false): Promise<CoachMyDataSendResult> {
  const { data, error } = await supabase.functions.invoke('coach-mydata-send-receipt', { body: { receiptId, auto } });
  if (error) return { success: false, error: error.message };
  return data as CoachMyDataSendResult;
}

/** Fire-and-forget automatic send after a receipt is created; never blocks or fails the caller. */
export function autoSendCoachReceipt(receiptId: string | null | undefined) {
  if (!receiptId) return;
  sendCoachReceiptToMyData(receiptId, true).catch(() => undefined);
}
