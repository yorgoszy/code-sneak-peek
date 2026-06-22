import React, { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface Section {
  id: string;
  name: string;
  description: string | null;
  available_hours: any;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const schema = z.object({
  name: z.string().trim().min(2, "Συμπλήρωσε όνομα").max(100),
  email: z.string().trim().email("Μη έγκυρο email").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  section_id: z.string().uuid("Επίλεξε τμήμα"),
  preferred_date: z.string().min(1, "Επίλεξε ημερομηνία"),
  preferred_time: z.string().min(1, "Επίλεξε ώρα"),
  message: z.string().max(500).optional().or(z.literal("")),
});

const dayKey = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
};

export const TrialRequestDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [adminResponse, setAdminResponse] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    section_id: '', preferred_date: '', preferred_time: '', message: '',
  });

  useEffect(() => {
    if (!open) return;
    supabase.from('booking_sections').select('id,name,description,available_hours').eq('is_active', true).order('name')
      .then(({ data }) => setSections((data || []) as any));
  }, [open]);

  // Auto-populate time slots from selected section + date
  const availableSlots = useMemo<string[]>(() => {
    const section = sections.find(s => s.id === form.section_id);
    if (!section || !form.preferred_date) return [];
    const day = dayKey(form.preferred_date);
    const hours = section.available_hours?.[day];
    return Array.isArray(hours) ? hours : [];
  }, [sections, form.section_id, form.preferred_date]);

  // When section/date changes, default time to first slot
  useEffect(() => {
    if (!customTime && availableSlots.length > 0) {
      setForm(f => ({ ...f, preferred_time: availableSlots[0] }));
    }
  }, [availableSlots, customTime]);

  // Poll for admin response
  useEffect(() => {
    if (!requestId) return;
    const channel = supabase
      .channel(`trial-${requestId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trial_requests', filter: `id=eq.${requestId}` },
        (payload: any) => {
          setStatus(payload.new.status);
          setAdminResponse(payload.new.admin_response);
        })
      .subscribe();

    const iv = setInterval(async () => {
      const { data } = await supabase.from('trial_requests').select('status,admin_response').eq('id', requestId).maybeSingle();
      if (data) { setStatus(data.status as any); setAdminResponse(data.admin_response); }
    }, 10000);

    return () => { supabase.removeChannel(channel); clearInterval(iv); };
  }, [requestId]);

  const reset = () => {
    setForm({ name: '', email: '', phone: '', section_id: '', preferred_date: '', preferred_time: '', message: '' });
    setRequestId(null); setStatus(null); setAdminResponse(null); setCustomTime(false);
  };

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) setTimeout(reset, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('trial_requests')
      .insert({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        section_id: parsed.data.section_id,
        preferred_date: parsed.data.preferred_date,
        preferred_time: parsed.data.preferred_time,
        message: parsed.data.message || null,
      })
      .select('id')
      .single();
    setLoading(false);
    if (error) {
      toast.error('Σφάλμα: ' + error.message);
      return;
    }
    setRequestId(data.id);
    setStatus('pending');
    toast.success('Το αίτημα στάλθηκε!');
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle className="font-['Roobert_Pro']">Κλείσε δοκιμαστικό</DialogTitle>
          <DialogDescription>
            {!requestId
              ? "Συμπλήρωσε τα στοιχεία σου και θα σου απαντήσουμε άμεσα."
              : "Το αίτημά σου εστάλη — αναμένουμε απάντηση."}
          </DialogDescription>
        </DialogHeader>

        {!requestId ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Ονοματεπώνυμο *</Label>
              <Input className="rounded-none" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" className="rounded-none" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <Label>Τηλέφωνο</Label>
              <Input className="rounded-none" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Τμήμα *</Label>
              <Select value={form.section_id} onValueChange={v => setForm({ ...form, section_id: v, preferred_time: '' })}>
                <SelectTrigger className="rounded-none"><SelectValue placeholder="Επίλεξε τμήμα" /></SelectTrigger>
                <SelectContent className="rounded-none">
                  {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ημερομηνία *</Label>
              <Input type="date" min={today} className="rounded-none" value={form.preferred_date} onChange={e => setForm({ ...form, preferred_date: e.target.value })} required />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Ώρα *</Label>
                {availableSlots.length > 0 && (
                  <button type="button" onClick={() => setCustomTime(c => !c)} className="text-xs underline">
                    {customTime ? 'Επιλογή από διαθέσιμες' : 'Άλλη ώρα'}
                  </button>
                )}
              </div>
              {!customTime && availableSlots.length > 0 ? (
                <Select value={form.preferred_time} onValueChange={v => setForm({ ...form, preferred_time: v })}>
                  <SelectTrigger className="rounded-none"><SelectValue placeholder="Επίλεξε ώρα" /></SelectTrigger>
                  <SelectContent className="rounded-none">
                    {availableSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input type="time" className="rounded-none" value={form.preferred_time} onChange={e => setForm({ ...form, preferred_time: e.target.value })} required />
              )}
              {form.section_id && form.preferred_date && availableSlots.length === 0 && !customTime && (
                <p className="text-xs text-gray-500 mt-1">Δεν υπάρχουν διαθέσιμες ώρες αυτή τη μέρα — όρισε δική σου.</p>
              )}
            </div>
            <div>
              <Label>Μήνυμα</Label>
              <Textarea className="rounded-none" rows={2} maxLength={500} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-none bg-black text-white hover:bg-black/90">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Αποστολή αιτήματος'}
            </Button>
          </form>
        ) : (
          <div className="py-6 text-center space-y-3">
            {status === 'pending' && (
              <>
                <Clock className="w-12 h-12 mx-auto text-gray-500 animate-pulse" />
                <p className="font-medium">Αναμένουμε απάντηση...</p>
                <p className="text-sm text-gray-600">Θα ενημερωθείς εδώ μόλις απαντήσει ο διαχειριστής. Επίσης θα λάβεις email στο {form.email}.</p>
              </>
            )}
            {status === 'approved' && (
              <>
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />
                <p className="font-semibold text-lg">Εγκρίθηκε!</p>
                {adminResponse && <p className="text-sm border border-gray-200 p-3">{adminResponse}</p>}
                <Button onClick={() => handleClose(false)} className="rounded-none bg-black text-white">Κλείσιμο</Button>
              </>
            )}
            {status === 'rejected' && (
              <>
                <XCircle className="w-12 h-12 mx-auto text-red-600" />
                <p className="font-semibold text-lg">Απορρίφθηκε</p>
                {adminResponse && <p className="text-sm border border-gray-200 p-3">{adminResponse}</p>}
                <Button onClick={() => handleClose(false)} className="rounded-none bg-black text-white">Κλείσιμο</Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
