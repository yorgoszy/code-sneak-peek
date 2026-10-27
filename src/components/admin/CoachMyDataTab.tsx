import { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Pencil, Save, Loader2, LockKeyhole } from 'lucide-react';
import { matchesSearchTerm } from '@/lib/utils';
import { toast } from 'sonner';
import { coachVatOptions, isValidGreekAfm } from './coachMyDataRules';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type Settings = Tables<'coach_mydata_settings'>;
type Coach = { id: string; name: string; email: string; avatar_url: string | null; photo_url: string | null };
const emptyForm = {
  business_name: '', vat_number: '', tax_office: '', address: '', city: '', postal_code: '', activity: '',
  branch: '0', vat_category: '', vat_exemption_category: '', receipt_series: '', next_number: '1',
};

export function CoachMyDataTab() {
  const { isAdmin } = useAuthContext();
  const admin = isAdmin();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [settings, setSettings] = useState<Settings[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<Coach | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!admin) return;
    setLoading(true);
    setLoadError(false);
    try {
      const loadedCoaches: Coach[] = [];
      const loadedSettings: Settings[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase.from('app_users').select('id,name,email,avatar_url,photo_url').eq('role', 'coach').order('id').range(offset, offset + 999);
        if (error) throw error;
        loadedCoaches.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase.from('coach_mydata_settings').select('*').order('coach_id').range(offset, offset + 999);
        if (error) throw error;
        loadedSettings.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      setCoaches(loadedCoaches.sort((a, b) => a.name.localeCompare(b.name, 'el')));
      setSettings(loadedSettings);
    } catch {
      setLoadError(true);
      toast.error('Δεν ήταν δυνατή η φόρτωση των φορολογικών στοιχείων');
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [admin]);

  function edit(coach: Coach) {
    const existing = settings.find(item => item.coach_id === coach.id);
    setForm(existing ? {
      business_name: existing.business_name, vat_number: existing.vat_number, tax_office: existing.tax_office,
      address: existing.address, city: existing.city, postal_code: existing.postal_code, activity: existing.activity,
      branch: String(existing.branch), vat_category: existing.vat_category === null ? '' : String(existing.vat_category),
      vat_exemption_category: existing.vat_exemption_category === null ? '' : String(existing.vat_exemption_category),
      receipt_series: existing.receipt_series, next_number: String(existing.next_number),
    } : { ...emptyForm });
    setSelected(coach);
  }

  async function save() {
    if (!selected || !admin) return;
    if (!isValidGreekAfm(form.vat_number)) { toast.error('Ελέγξτε το ΑΦΜ'); return; }
    if (![form.business_name, form.tax_office, form.address, form.city, form.postal_code, form.activity, form.receipt_series, form.vat_category].every(value => value.trim())) {
      toast.error('Συμπληρώστε τα φορολογικά στοιχεία και το καθεστώς ΦΠΑ'); return;
    }
    const branch = Number(form.branch);
    const next = Number(form.next_number);
    const exemption = form.vat_category === '7' ? Number(form.vat_exemption_category) : null;
    if (!Number.isSafeInteger(branch) || branch < 0 || !Number.isSafeInteger(next) || next < 1 || (form.vat_category === '7' && (!exemption || !Number.isInteger(exemption) || exemption < 1))) {
      toast.error('Ελέγξτε υποκατάστημα, αρίθμηση και αιτία απαλλαγής'); return;
    }
    setSaving(true);
    try {
      const payload: TablesInsert<'coach_mydata_settings'> = {
        coach_id: selected.id, business_name: form.business_name.trim(), vat_number: form.vat_number,
        tax_office: form.tax_office.trim(), address: form.address.trim(), city: form.city.trim(), postal_code: form.postal_code.trim(), activity: form.activity.trim(),
        branch, vat_category: Number(form.vat_category), vat_exemption_category: exemption,
        receipt_series: form.receipt_series.trim(), next_number: next,
      };
      const { error } = await supabase.from('coach_mydata_settings').upsert(payload, { onConflict: 'coach_id' });
      if (error) throw error;
      toast.success('Τα φορολογικά στοιχεία αποθηκεύτηκαν');
      setSelected(null);
      await load();
    } catch { toast.error('Δεν ήταν δυνατή η αποθήκευση'); }
    finally { setSaving(false); }
  }

  if (!admin) return null;
  const filtered = coaches.filter(coach => matchesSearchTerm(coach.name, search) || matchesSearchTerm(coach.email, search));
  const fields: { key: keyof typeof emptyForm; label: string; type?: string }[] = [
    { key: 'business_name', label: 'Επωνυμία' }, { key: 'vat_number', label: 'ΑΦΜ' }, { key: 'tax_office', label: 'ΔΟΥ' },
    { key: 'activity', label: 'Δραστηριότητα / ΚΑΔ' }, { key: 'address', label: 'Διεύθυνση' }, { key: 'city', label: 'Πόλη' },
    { key: 'postal_code', label: 'Ταχυδρομικός κώδικας' }, { key: 'branch', label: 'Υποκατάστημα', type: 'number' },
    { key: 'receipt_series', label: 'Σειρά ΑΠΥ' }, { key: 'next_number', label: 'Επόμενος αριθμός ΑΠΥ', type: 'number' },
  ];
  return <section className="space-y-5 text-foreground">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-xl font-semibold">Coach myDATA</h2>
      <div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Αναζήτηση coach" value={search} onChange={e => setSearch(e.target.value)} placeholder="Όνομα ή email" className="rounded-none pl-9" /></div>
    </div>
    {loading ? <div role="status" className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : loadError ? <div className="py-8 text-center"><p>Δεν ήταν δυνατή η φόρτωση.</p><Button className="mt-3 rounded-none" variant="outline" onClick={() => void load()}>Επανάληψη</Button></div> : filtered.length === 0 ? <p className="py-8 text-center text-muted-foreground">Δεν βρέθηκαν προπονητές</p> : <div className="divide-y divide-border border-y border-border">
      {filtered.map(coach => {
        const tax = settings.find(item => item.coach_id === coach.id);
        return <div key={coach.id} className="grid items-center gap-3 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto]">
          <div className="flex min-w-0 items-center gap-3"><Avatar className="h-10 w-10 shrink-0"><AvatarImage src={coach.avatar_url || coach.photo_url || undefined} /><AvatarFallback>{coach.name.slice(0, 1)}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate font-medium">{coach.name}</p><p className="truncate text-sm text-muted-foreground">{coach.email}</p></div></div>
          <div className="min-w-0 text-sm"><p className="truncate">{tax?.business_name || 'Χωρίς φορολογικά στοιχεία'}</p><p className="text-muted-foreground">{tax?.vat_number ? `ΑΦΜ ${tax.vat_number}` : '—'} · {coachVatOptions.find(item => item.category === tax?.vat_category)?.label || 'ΦΠΑ μη ορισμένο'}</p></div>
          <Badge variant="outline" className="w-fit rounded-none">{tax?.enabled && tax.connection_verified_at ? 'Ενεργή σύνδεση' : 'Μη ενεργοποιημένη'}</Badge>
          <Button variant="outline" onClick={() => { window.location.href = `/dashboard/coach-profile?coachId=${coach.id}`; }} className="rounded-none"><Pencil className="mr-2 h-4 w-4" />Στοιχεία</Button>
        </div>;
      })}
    </div>}
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open && !saving) setSelected(null); }}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-none"><DialogHeader><DialogTitle>{selected?.name} — myDATA</DialogTitle></DialogHeader>
      <form onSubmit={e => { e.preventDefault(); void save(); }} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{fields.map(field => <div key={field.key} className="space-y-2"><Label htmlFor={`coach-tax-${field.key}`}>{field.label}</Label><Input id={`coach-tax-${field.key}`} required type={field.type || 'text'} value={form[field.key]} min={field.key === 'next_number' ? 1 : field.type === 'number' ? 0 : undefined} maxLength={field.key === 'vat_number' ? 9 : 255} onChange={e => setForm(previous => ({ ...previous, [field.key]: e.target.value }))} className="rounded-none" /></div>)}
          <div className="space-y-2"><Label htmlFor="coach-tax-vat">Καθεστώς ΦΠΑ</Label><Select value={form.vat_category} onValueChange={value => setForm(previous => ({ ...previous, vat_category: value, vat_exemption_category: '' }))}><SelectTrigger id="coach-tax-vat" className="rounded-none"><SelectValue placeholder="Επιλέξτε ΦΠΑ" /></SelectTrigger><SelectContent>{coachVatOptions.map(item => <SelectItem key={item.category} value={String(item.category)}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          {form.vat_category === '7' && <div className="space-y-2"><Label htmlFor="coach-tax-exemption">Κωδικός αιτίας απαλλαγής myDATA</Label><Input id="coach-tax-exemption" type="number" min="1" required value={form.vat_exemption_category} onChange={e => setForm(previous => ({ ...previous, vat_exemption_category: e.target.value }))} className="rounded-none" /></div>}
        </div>
        <div className="border-t border-border pt-4"><p className="flex items-center gap-2 text-sm font-medium"><LockKeyhole className="h-4 w-4" />Σύνδεση ΑΑΔΕ: μη ενεργοποιημένη</p></div>
        <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={() => setSelected(null)} className="rounded-none">Ακύρωση</Button><Button type="submit" disabled={saving} className="rounded-none">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Αποθήκευση</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
  </section>;
}