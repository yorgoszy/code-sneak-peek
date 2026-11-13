import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Activity, Loader2, Plus, Square, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { changeLabel, performanceDrop } from './calculations';
import type { Database } from '@/integrations/supabase/types';

type Session = Database['public']['Tables']['exercise_measurement_sessions']['Row'];
type Attempt = Database['public']['Tables']['exercise_measurement_attempts']['Row'];
type Protocol = Database['public']['Tables']['measurement_protocols']['Row'];
interface Props { userId: string; exerciseId: string; programExerciseId: string; assignmentId: string; selectedDate: Date; workoutInProgress: boolean }

export function ExerciseMeasurements(props: Props) {
  const [open, setOpen] = useState(false);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [protocolKey, setProtocolKey] = useState('cmj');
  const [conditions, setConditions] = useState('');
  const [kind, setKind] = useState('workout');
  const [threshold, setThreshold] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [source, setSource] = useState('manual');
  const [value, setValue] = useState('');
  const [setNo, setSetNo] = useState('1');
  const [repNo, setRepNo] = useState('1');
  const [xmlId, setXmlId] = useState('');
  const [candidates, setCandidates] = useState<{id: string; recorded_at: string; height_cm: number; test: string}[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const event = useRef<string | null>(null);
  const date = format(props.selectedDate, 'yyyy-MM-dd');
  const protocol = protocols.find(p => p.key === (session?.protocol_key ?? protocolKey));

  useEffect(() => { setSession(null); setAttempts([]); setSessions([]); setOpen(false); event.current = null; }, [props.userId, props.programExerciseId, date]);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all([
      supabase.from('measurement_protocols').select('*').order('name'),
      supabase.from('exercise_measurement_sessions').select('*').eq('user_id', props.userId).eq('assignment_id', props.assignmentId).eq('program_exercise_id', props.programExerciseId).eq('scheduled_date', date).order('started_at', {ascending:false}),
    ]).then(([p, s]) => {
      if (cancelled) return;
      if (p.error || s.error) { setError('Δεν φορτώθηκαν οι μετρήσεις. Δοκίμασε ξανά.'); return; }
      setProtocols(p.data ?? []); setSessions(s.data ?? []); setError('');
    });
    return () => { cancelled = true; };
  }, [open, props.userId, props.assignmentId, props.programExerciseId, date]);

  useEffect(() => {
    if (!session) { setAttempts([]); return; }
    let cancelled = false;
    const load = async () => {
      const all: Attempt[] = [];
      for (let offset=0; ; offset+=1000) {
        const result = await supabase.from('exercise_measurement_attempts').select('*').eq('session_id', session.id).order('set_number').order('rep_number').range(offset, offset+999);
        if (result.error) { if (!cancelled) setError('Δεν φορτώθηκαν οι προσπάθειες.'); return; }
        all.push(...(result.data ?? []));
        if ((result.data?.length ?? 0)<1000) break;
      }
      if (!cancelled) setAttempts(all);
    };
    void load();
    const channel = supabase.channel(`exercise-measurements-${crypto.randomUUID()}`).on('postgres_changes', {event:'INSERT',schema:'public',table:'exercise_measurement_attempts',filter:`session_id=eq.${session.id}`}, () => { void load(); }).subscribe();
    return () => { cancelled = true; void supabase.removeChannel(channel); };
  }, [session?.id]);

  useEffect(() => {
    setCandidates([]); setXmlId('');
    if (!session || source !== 'optojump_xml') return;
    let cancelled = false;
    supabase.rpc('measurement_xml_candidates', {p_user: props.userId, p_protocol: session.protocol_key}).then(({data,error}) => {
      if (cancelled) return;
      if (error) setError('Δεν φορτώθηκαν οι εισαγωγές XML.'); else setCandidates(data ?? []);
    });
    return () => { cancelled = true; };
  }, [session?.id, source, props.userId]);

  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current=true; setBusy(true); setError('');
    try { await action(); } catch { setError('Δεν αποθηκεύτηκε. Έλεγξε τα στοιχεία και ξαναδοκίμασε.'); } finally { lock.current=false; setBusy(false); }
  };
  const start = () => run(async () => {
    if (!conditions.trim()) throw new Error('Conditions required');
    const result = await supabase.from('exercise_measurement_sessions').insert({user_id:props.userId, exercise_id:props.exerciseId, assignment_id:props.assignmentId, program_exercise_id:props.programExerciseId, scheduled_date:date, protocol_key:protocolKey, conditions:conditions.trim(), session_kind:kind, threshold_pct:threshold ? Number(threshold) : null}).select().single();
    if (result.error) throw result.error;
    setSession(result.data); setSessions(prev=>[result.data,...prev]); setRepNo('1');
  });
  const save = () => run(async () => {
    if (!session || session.ended_at) return;
    const n = Number(value.replace(',', '.'));
    if (source === 'manual' && (!Number.isFinite(n) || n<=0)) throw new Error('Invalid value');
    if (!Number.isInteger(Number(setNo)) || !Number.isInteger(Number(repNo)) || Number(setNo)<1 || Number(repNo)<1 || (source==='optojump_xml' && !xmlId)) throw new Error('Invalid attempt');
    if (!event.current) event.current=crypto.randomUUID();
    const result = await supabase.from('exercise_measurement_attempts').insert({session_id:session.id,user_id:props.userId,event_id:event.current,value:source==='manual'?n:1,set_number:Number(setNo),rep_number:Number(repNo),source,optojump_import_id:source==='optojump_xml'?xmlId:null}).select().single();
    if (result.error) {
      const existing = await supabase.from('exercise_measurement_attempts').select('*').eq('event_id', event.current).maybeSingle();
      if (!existing.data) throw result.error;
      setAttempts(prev=>prev.some(a=>a.id===existing.data?.id)?prev:[...prev,existing.data as Attempt]);
    } else setAttempts(prev=>prev.some(a=>a.id===result.data.id)?prev:[...prev,result.data]);
    event.current=null; setValue(''); setCandidates(prev=>prev.filter(c=>c.id!==xmlId)); setXmlId(''); setRepNo(String(Number(repNo)+1)); toast.success('Η μέτρηση αποθηκεύτηκε');
  });
  const close = () => run(async () => {
    if (!session) return;
    const result = await supabase.from('exercise_measurement_sessions').update({ended_at:new Date().toISOString()}).eq('id',session.id).select().single();
    if (result.error) throw result.error;
    setSession(result.data); setSessions(prev=>prev.map(s=>s.id===result.data.id?result.data:s));
  });
  const latest = [...attempts].sort((a,b)=>a.received_at.localeCompare(b.received_at)).at(-1);
  const first = attempts.filter(a=>a.set_number===latest?.set_number).sort((a,b)=>a.rep_number-b.rep_number)[0];
  const drop = latest ? performanceDrop(session?.baseline_value ?? null,latest.value,protocol?.direction ?? 'observe'):null;
  return <section className="border-t border-border bg-background text-foreground px-2 py-1" onClick={e=>e.stopPropagation()}>
    <Button variant="ghost" size="sm" className="rounded-none h-7 text-xs" onClick={()=>setOpen(v=>!v)}><Activity className="h-3 w-3 mr-1"/>Μετρήσεις</Button>
    {open && <div className="space-y-3 py-2 text-xs">
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {sessions.length>0 && <Select value={session?.id ?? ''} onValueChange={id=>setSession(sessions.find(s=>s.id===id)??null)}><SelectTrigger className="rounded-none"><SelectValue placeholder="Καταγραφές ημέρας"/></SelectTrigger><SelectContent>{sessions.map(s=><SelectItem key={s.id} value={s.id}>{protocols.find(p=>p.key===s.protocol_key)?.name} · {s.conditions} · {s.ended_at?'Ολοκληρωμένη':'Ανοιχτή'}</SelectItem>)}</SelectContent></Select>}
      {!session ? <>
        <Select value={protocolKey} onValueChange={setProtocolKey}><SelectTrigger className="rounded-none" aria-label="Πρωτόκολλο"><SelectValue/></SelectTrigger><SelectContent>{protocols.map(p=><SelectItem key={p.key} value={p.key}>{p.name} ({p.unit})</SelectItem>)}</SelectContent></Select>
        <Label>Συνθήκες / παραλλαγή</Label><Input aria-label="Συνθήκες" className="rounded-none" value={conditions} onChange={e=>setConditions(e.target.value)} placeholder="Χέρια, πλευρά, φορτίο, απόσταση…" maxLength={500}/>
        <Select value={kind} onValueChange={setKind}><SelectTrigger className="rounded-none" aria-label="Είδος καταγραφής"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="workout">Προπόνηση</SelectItem><SelectItem value="test">Τεστ αναφοράς</SelectItem></SelectContent></Select>
        <Label>Όριο πτώσης (%) · προαιρετικό</Label><Input aria-label="Όριο πτώσης" type="number" min={0.1} max={100} className="rounded-none" value={threshold} onChange={e=>setThreshold(e.target.value)}/>
        <Button className="rounded-none w-full" disabled={busy || !conditions.trim() || !props.workoutInProgress} onClick={start}>{busy?<Loader2 className="h-4 w-4 animate-spin mr-2"/>:<Plus className="h-4 w-4 mr-2"/>}Νέα καταγραφή</Button>
      </> : <>
        <div className="flex flex-wrap justify-between gap-2"><span>{protocol?.name} · {session.conditions}</span><span className="text-muted-foreground">{session.ended_at?'Ολοκληρωμένη':'Καταγραφή'} · {latest?.source==='optojump_xml'?'Εισαγωγή XML':'Χειροκίνητα'}</span></div>
        <div className="grid grid-cols-2 gap-2"><div>Τρέχον<strong className="block text-lg">{latest?.value ?? '—'} {protocol?.unit}</strong></div><div>Αναφορά<strong className="block text-lg">{session.baseline_value ?? '—'} {protocol?.unit}</strong>{session.baseline_at && <span className="text-muted-foreground">{new Date(session.baseline_at).toLocaleDateString('el-GR')}</span>}</div></div>
        <div>Από αναφορά: {changeLabel(drop)} · Από αρχή σετ: {changeLabel(latest && first ? performanceDrop(first.value,latest.value,protocol?.direction??'observe'):null)}</div>
        {drop!==null && session.threshold_pct!==null && drop>=session.threshold_pct && <p className="font-semibold" role="status">Όριο πτώσης {session.threshold_pct}%</p>}
        {attempts.length>1 && <svg viewBox="0 0 300 60" className="w-full h-16 text-foreground" role="img" aria-label="Εξέλιξη μετρήσεων"><polyline fill="none" stroke="currentColor" strokeWidth="2" points={attempts.map((a,i)=>`${5+i/(attempts.length-1)*290},${55-a.value/Math.max(...attempts.map(x=>x.value))*50}`).join(' ')}/></svg>}
        <div className="max-h-40 overflow-auto"><table className="w-full text-left"><thead><tr><th>Σετ/Επ.</th><th>{protocol?.unit}</th><th>Πηγή</th><th>Ώρα</th></tr></thead><tbody>{attempts.map(a=><tr key={a.id} className="border-b border-border"><td>{a.set_number}/{a.rep_number}</td><td>{a.value}</td><td>{a.source==='manual'?'Χειροκίνητα':'XML'}</td><td>{new Date(a.recorded_at).toLocaleTimeString('el-GR')}</td></tr>)}</tbody></table></div>
        {!session.ended_at && <>
          <Select value={source} onValueChange={v=>{setSource(v);event.current=null;}}><SelectTrigger className="rounded-none" aria-label="Πηγή"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="manual">Χειροκίνητα</SelectItem>{protocol?.optojump_test && <SelectItem value="optojump_xml">Εισαγωγή XML</SelectItem>}</SelectContent></Select>
          {source==='manual'?<Input aria-label={`Τιμή ${protocol?.unit}`} className="rounded-none" value={value} onChange={e=>{setValue(e.target.value);event.current=null;}} inputMode="decimal" placeholder={protocol?.unit}/>:<Select value={xmlId} onValueChange={v=>{setXmlId(v);event.current=null;}}><SelectTrigger className="rounded-none" aria-label="Προσπάθεια XML"><SelectValue placeholder={candidates.length?'Επιλέξτε προσπάθεια':'Δεν υπάρχουν διαθέσιμες προσπάθειες'}/></SelectTrigger><SelectContent>{candidates.map(c=><SelectItem key={c.id} value={c.id}>{c.recorded_at} · {c.height_cm} cm</SelectItem>)}</SelectContent></Select>}
          <div className="grid grid-cols-2 gap-2"><div><Label>Σετ</Label><Input type="number" min={1} className="rounded-none" value={setNo} onChange={e=>{setSetNo(e.target.value);event.current=null;}}/></div><div><Label>Επανάληψη</Label><Input type="number" min={1} className="rounded-none" value={repNo} onChange={e=>{setRepNo(e.target.value);event.current=null;}}/></div></div>
          <div className="flex gap-2"><Button disabled={busy} className="rounded-none flex-1" onClick={save}>{busy?<Loader2 className="h-4 w-4 animate-spin mr-1"/>:<Save className="h-4 w-4 mr-1"/>}Αποθήκευση</Button><Button disabled={busy} variant="outline" className="rounded-none" onClick={close}><Square className="h-4 w-4 mr-1"/>Τέλος</Button></div>
        </>}
        <Button variant="ghost" className="rounded-none" disabled={busy} onClick={()=>{setSession(null);event.current=null;}}>Νέο πρωτόκολλο / τεστ</Button>
      </>}
    </div>}
  </section>;
}