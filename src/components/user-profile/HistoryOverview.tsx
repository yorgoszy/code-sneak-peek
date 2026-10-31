import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, ClipboardCheck, Activity } from "lucide-react";
import { format, isValid } from 'date-fns';

interface HistoryEntry {
  id: string;
  type: 'payment' | 'test';
  date: Date | null;
  title: string;
  detail: string;
}

const HistoryOverview: React.FC<{ userId: string }> = ({ userId }) => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const results: HistoryEntry[] = [];

      const [paymentsRes, sessionsRes] = await Promise.all([
        supabase
          .from('payments')
          .select('id, amount, status, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('test_sessions')
          .select('id, session_label, test_date, completed_at')
          .eq('user_id', userId)
          .order('test_date', { ascending: false })
          .limit(50),
      ]);

      if (paymentsRes.data) {
        for (const p of paymentsRes.data) {
          results.push({
            id: `payment-${p.id}`,
            type: 'payment',
            date: p.created_at ? new Date(p.created_at) : null,
            title: `Πληρωμή €${Number(p.amount).toFixed(2)}`,
            detail: p.status === 'completed' || p.status === 'paid' ? 'Ολοκληρωμένη' : (p.status || '—'),
          });
        }
      }

      if (sessionsRes.data) {
        for (const s of sessionsRes.data) {
          results.push({
            id: `test-${s.id}`,
            type: 'test',
            date: s.test_date ? new Date(s.test_date) : (s.completed_at ? new Date(s.completed_at) : null),
            title: s.session_label || 'Τεστ',
            detail: 'Συνεδρία τεστ',
          });
        }
      }

      results.sort((a, b) => {
        const ta = a.date ? a.date.getTime() : 0;
        const tb = b.date ? b.date.getTime() : 0;
        return tb - ta;
      });

      if (!cancelled) {
        setEntries(results);
        setLoading(false);
      }
    };

    if (userId) load();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Φόρτωση ιστορικού…</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Δεν υπάρχει ιστορικό δραστηριότητας ακόμη.
      </div>
    );
  }

  const formatDate = (d: Date | null) => (d && isValid(d) ? format(d, 'dd/MM/yyyy') : '—');
  const formatTime = (d: Date | null) => (d && isValid(d) ? format(d, 'HH:mm') : '');

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const Icon = entry.type === 'payment' ? CreditCard : ClipboardCheck;
        return (
          <Card key={entry.id} className="rounded-none">
            <CardContent className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 p-2 bg-gray-50 border border-gray-200">
                  <Icon className="h-4 w-4 text-gray-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{entry.title}</p>
                  <p className="text-xs text-gray-500 truncate">{entry.detail}</p>
                </div>
              </div>
              <div className="text-right shrink-0 flex items-center gap-2">
                <Activity className="h-3 w-3 text-gray-400" />
                <div>
                  <p className="text-xs font-medium">{formatDate(entry.date)}</p>
                  <p className="text-[10px] text-gray-400">{formatTime(entry.date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default HistoryOverview;
