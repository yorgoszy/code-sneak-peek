import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { bestValue } from './calculations';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw } from 'lucide-react';

type HistoryRow = {id:string; value:number; recorded_at:string; source:string; set_number:number; rep_number:number; exercise_measurement_sessions: {exercise_id:string;conditions:string;session_kind:string;exercises:{name:string}|null;measurement_protocols:{name:string;unit:string;direction:string}|null}|null};
export function MeasurementHistory({userId}: {userId:string}) {
  const [rows,setRows] = useState<HistoryRow[]>([]);
  const [error,setError] = useState(false);
  const [busy,setBusy] = useState(false);
  const [reload,setReload] = useState(0);
  useEffect(()=>{
    let cancelled=false; setRows([]); setBusy(true); setError(false);
    (async()=>{
      const all:HistoryRow[]=[];
      for(let offset=0;;offset+=1000){
        const result=await supabase.from('exercise_measurement_attempts').select('id,value,recorded_at,source,set_number,rep_number,exercise_measurement_sessions(exercise_id,conditions,session_kind,exercises(name),measurement_protocols(name,unit,direction))').eq('user_id',userId).order('recorded_at',{ascending:false}).range(offset,offset+999);
        if(result.error){if(!cancelled){setError(true);setBusy(false);}return;}
        all.push(...(result.data as HistoryRow[] ?? []));
        if((result.data?.length??0)<1000)break;
      }
      if(!cancelled){setRows(all);setBusy(false);}
    })();
    return()=>{cancelled=true;};
  },[userId,reload]);
  const groups=new Map<string,HistoryRow[]>();
  rows.forEach(row=>{
    const s=row.exercise_measurement_sessions;
    if(!s)return;
    const key=JSON.stringify([s.exercise_id,s.measurement_protocols?.name,s.conditions]);
    groups.set(key,[...(groups.get(key)??[]),row]);
  });
  return <section className="w-full border-t border-border py-3 text-foreground">
    <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4"/>Μετρήσεις ασκήσεων</h3><Button variant="ghost" size="icon" className="rounded-none h-8 w-8" aria-label="Ανανέωση μετρήσεων" disabled={busy} onClick={()=>setReload(v=>v+1)}><RefreshCw className={`h-4 w-4 ${busy?'animate-spin':''}`}/></Button></div>
    {error?<p role="alert" className="text-sm text-destructive">Δεν φορτώθηκαν οι μετρήσεις.</p>:busy?<p className="text-sm text-muted-foreground">Φόρτωση…</p>:!rows.length?<p className="text-sm text-muted-foreground">Δεν υπάρχουν καταγεγραμμένες μετρήσεις.</p>:<div className="space-y-4 mt-3">{Array.from(groups.entries()).map(([key,list])=>{
      const s=list[0].exercise_measurement_sessions;
      const p=s?.measurement_protocols;
      const best=bestValue(list.filter(r=>r.exercise_measurement_sessions?.session_kind==='test').map(r=>r.value),p?.direction??'observe');
      const bestRow=list.find(r=>r.value===best && r.exercise_measurement_sessions?.session_kind==='test');
      const recent=list.slice(0,10);
      return <div key={key} className="border-b border-border pb-3"><div className="flex flex-wrap justify-between gap-2 text-sm"><strong>{s?.exercises?.name} · {p?.name}</strong><span>Καλύτερο τεστ: {best??'—'} {p?.unit}{bestRow?` · ${new Date(bestRow.recorded_at).toLocaleDateString('el-GR')}`:''}</span></div><p className="text-xs text-muted-foreground">{s?.conditions}</p>
        {recent.length>1 && <svg viewBox="0 0 300 45" className="w-full max-w-sm h-12 text-foreground" aria-label="Πρόσφατη εξέλιξη" role="img"><polyline stroke="currentColor" strokeWidth="2" fill="none" points={[...recent].reverse().map((r,i)=>`${5+i/(recent.length-1)*290},${40-r.value/Math.max(...recent.map(a=>a.value))*35}`).join(' ')}/></svg>}
        <div className="overflow-x-auto"><table className="w-full text-xs text-left"><thead><tr><th>Ημερομηνία</th><th>Τιμή ({p?.unit})</th><th>Σετ/Επ.</th><th>Πηγή</th></tr></thead><tbody>{recent.map(r=><tr key={r.id}><td>{new Date(r.recorded_at).toLocaleString('el-GR')}</td><td>{r.value}</td><td>{r.set_number}/{r.rep_number}</td><td>{r.source==='manual'?'Χειροκίνητα':'XML'}</td></tr>)}</tbody></table></div>
      </div>;
    })}</div>}
  </section>;
}