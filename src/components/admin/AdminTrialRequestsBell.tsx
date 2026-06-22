import React, { useEffect, useState } from 'react';
import { Bell, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrialRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  preferred_date: string;
  preferred_time: string;
  message: string | null;
  created_at: string;
  booking_sections?: { name: string } | null;
}

export const AdminTrialRequestsBell: React.FC = () => {
  const [requests, setRequests] = useState<TrialRequest[]>([]);
  const [open, setOpen] = useState(false);
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchPending = async () => {
    const { data } = await supabase
      .from('trial_requests')
      .select('id,name,email,phone,preferred_date,preferred_time,message,created_at,booking_sections(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setRequests((data || []) as any);
  };

  useEffect(() => {
    fetchPending();
    const channel = supabase
      .channel('admin-trial-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trial_requests' }, (payload: any) => {
        fetchPending();
        if (payload.eventType === 'INSERT') {
          toast.info(`Νέο αίτημα δοκιμαστικού: ${payload.new.name}`, {
            duration: 10000,
            action: { label: 'Άνοιγμα', onClick: () => setOpen(true) },
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    setBusyId(id);
    const text = responseText[id] || (action === 'approved'
      ? 'Το αίτημά σου εγκρίθηκε! Σε περιμένουμε την προγραμματισμένη ώρα.'
      : 'Δυστυχώς δεν είναι δυνατόν αυτή την ώρα. Παρακαλώ επικοινώνησε μαζί μας για άλλο ραντεβού.');

    const { data: tr } = await supabase
      .from('trial_requests')
      .update({ status: action, admin_response: text, responded_at: new Date().toISOString() })
      .eq('id', id)
      .select('email,name,preferred_date,preferred_time')
      .maybeSingle();

    // Send email to user via existing function logic — call edge function trial-request-action? It needs token.
    // Simpler: invoke a direct send via send-transactional? We'll call the existing notify path by inserting; instead use resend via edge function. For now rely on DB update + we'll trigger user email via separate function.
    try {
      await supabase.functions.invoke('trial-request-user-email', {
        body: { id, status: action, response: text },
      });
    } catch (e) {
      console.warn('user email failed', e);
    }

    setBusyId(null);
    toast.success(action === 'approved' ? 'Εγκρίθηκε' : 'Απορρίφθηκε');
    setResponseText(r => { const n = { ...r }; delete n[id]; return n; });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-none relative">
          <Bell className="h-4 w-4" />
          {requests.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {requests.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] rounded-none p-0 max-h-[70vh] overflow-y-auto" align="end">
        <div className="p-3 border-b border-gray-200 font-semibold">Αιτήματα δοκιμαστικού ({requests.length})</div>
        {requests.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">Καμία εκκρεμότητα</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requests.map(r => (
              <div key={r.id} className="p-3 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="text-sm">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-gray-600">{r.email}{r.phone ? ` · ${r.phone}` : ''}</div>
                    <div className="text-xs text-gray-600">
                      {r.booking_sections?.name || '—'} · {new Date(r.preferred_date).toLocaleDateString('el-GR')} {String(r.preferred_time).slice(0,5)}
                    </div>
                    {r.message && <div className="text-xs text-gray-700 mt-1 italic">"{r.message}"</div>}
                  </div>
                </div>
                <Textarea
                  className="rounded-none text-xs"
                  rows={2}
                  placeholder="Προαιρετικό μήνυμα προς τον χρήστη..."
                  value={responseText[r.id] || ''}
                  onChange={e => setResponseText(rs => ({ ...rs, [r.id]: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={busyId === r.id}
                    onClick={() => handleAction(r.id, 'approved')}
                    className="flex-1 rounded-none bg-black text-white hover:bg-black/90"
                  >
                    {busyId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" /> Αποδοχή</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === r.id}
                    onClick={() => handleAction(r.id, 'rejected')}
                    className="flex-1 rounded-none"
                  >
                    <X className="h-3 w-3 mr-1" /> Απόρριψη
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
