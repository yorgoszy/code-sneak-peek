import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  userId: string;
}

interface CreditRow {
  id: string;
  amount: number;
  source: string;
  notes: string | null;
  created_at: string;
}

const sourceLabel = (s: string) => {
  switch (s) {
    case 'gift_card': return 'Δωροκάρτα';
    case 'subscription_use': return 'Χρήση σε συνδρομή';
    case 'manual_adjustment': return 'Χειροκίνητη προσαρμογή';
    case 'refund': return 'Επιστροφή';
    default: return s;
  }
};

export const UserCreditsWidget: React.FC<Props> = ({ userId }) => {
  const { isAdmin } = useRoleCheck();
  const [balance, setBalance] = useState(0);
  const [rows, setRows] = useState<CreditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<CreditRow | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [{ data: rowsData }, { data: bal }] = await Promise.all([
      supabase
        .from('user_credits')
        .select('id, amount, source, notes, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase.rpc('get_user_credit_balance', { _user_id: userId }),
    ]);
    setRows((rowsData as CreditRow[]) || []);
    setBalance(Number(bal) || 0);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('user_credits').delete().eq('id', toDelete.id);
    if (error) {
      toast.error('Αποτυχία διαγραφής: ' + error.message);
    } else {
      toast.success('Η εγγραφή διαγράφηκε');
      setToDelete(null);
      load();
    }
  };

  const handleClearAll = async () => {
    const { error } = await supabase.from('user_credits').delete().eq('user_id', userId);
    if (error) {
      toast.error('Αποτυχία: ' + error.message);
    } else {
      toast.success('Όλες οι πιστώσεις διαγράφηκαν');
      load();
    }
  };

  if (loading) return null;
  if (rows.length === 0 && balance === 0) return null;

  return (
    <>
      <Card className="rounded-none border-black">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Πίστωση χρήστη
            </span>
            <span className={`font-mono text-lg ${balance > 0 ? 'text-[#cb8954]' : 'text-muted-foreground'}`}>
              €{balance.toFixed(2)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="rounded-none"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? 'Απόκρυψη ιστορικού' : `Ιστορικό (${rows.length})`}
            </Button>
            {isAdmin() && rows.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-none border-red-300 text-red-600 hover:bg-red-50"
                onClick={handleClearAll}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Διαγραφή όλων
              </Button>
            )}
          </div>

          {expanded && (
            <div className="border border-black divide-y divide-black">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{sourceLabel(r.source)}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {format(new Date(r.created_at), 'dd MMM yyyy HH:mm', { locale: el })}
                      {r.notes ? ` — ${r.notes}` : ''}
                    </div>
                  </div>
                  <div className={`font-mono font-semibold px-2 ${r.amount >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {r.amount >= 0 ? '+' : ''}€{Number(r.amount).toFixed(2)}
                  </div>
                  {isAdmin() && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-none h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                      onClick={() => setToDelete(r)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Διαγραφή εγγραφής πίστωσης;</AlertDialogTitle>
            <AlertDialogDescription>
              Θα διαγραφεί η εγγραφή {toDelete && `€${Number(toDelete.amount).toFixed(2)}`}. Η ενέργεια δεν αναιρείται.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 rounded-none"
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
