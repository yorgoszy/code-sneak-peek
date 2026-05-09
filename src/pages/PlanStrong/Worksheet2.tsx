import React from 'react';
import { Input } from '@/components/ui/input';
import { SessionWeek } from './planStrongCalc';

interface Props {
  weeks: SessionWeek[];
  onChange: (weeks: SessionWeek[]) => void;
  title: string;
}

const ZONES = ['>=95%1RM','91-94%1RM','81-90%1RM','71-80%1RM','61-70%1RM','50-60%1RM'];
const cell = "border border-border px-2 py-1 text-xs";
const head = cell + " bg-muted font-semibold";
const inp = "h-7 px-1 text-xs rounded-none border-0 bg-transparent";

const WeekBlock: React.FC<{ w: SessionWeek; onUpdate: (w: SessionWeek) => void }> = ({ w, onUpdate }) => {
  const setSession = (zi: number, si: number, v: number) => {
    const sessions = w.sessions.map((row, ri) => ri === zi ? row.map((c, ci) => ci === si ? v : c) : row);
    onUpdate({ ...w, sessions });
  };
  const setPlan = (zi: number, si: number, v: string) => {
    const plans = w.plans.map((row, ri) => ri === zi ? row.map((c, ci) => ci === si ? v : c) : row);
    onUpdate({ ...w, plans });
  };
  const sessionTotals = (si: number) => w.sessions.reduce((a, row) => a + (row[si] || 0), 0);

  return (
    <div className="border border-border">
      <div className="bg-muted px-2 py-1 text-xs font-semibold">WEEK {w.week}</div>
      <table className="border-collapse w-full">
        <thead>
          <tr>
            <th className={head}>ZONE / NL</th>
            {[1, 2, 3, 4, 5].map(s => <th key={s} className={head}>SESSION {s}</th>)}
            <th className={head}>CHECK</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={head}>SESSION NL</td>
            {[0, 1, 2, 3, 4].map(si => <td key={si} className={cell + " bg-muted/30"}>{sessionTotals(si)}</td>)}
            <td className={cell + " bg-muted/30"}></td>
          </tr>
          {ZONES.map((z, zi) => (
            <tr key={z}>
              <td className={head}>{z}</td>
              {w.sessions[zi].map((v, si) => (
                <td key={si} className={cell + " p-0"}>
                  <Input className={inp + " w-16"} type="number" value={v}
                    onChange={e => setSession(zi, si, +e.target.value)} />
                </td>
              ))}
              <td className={cell + " bg-muted/30"}>{w.sessions[zi].reduce((a, b) => a + b, 0)}</td>
            </tr>
          ))}
          <tr>
            <td className={head}>PLAN</td>
            {[0, 1, 2, 3, 4].map(si => (
              <td key={si} className={cell + " p-0"}>
                <Input className={inp} placeholder="3x75"
                  value={w.plans[0][si]}
                  onChange={e => setPlan(0, si, e.target.value)} />
              </td>
            ))}
            <td className={cell}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export const Worksheet2: React.FC<Props> = ({ weeks, onChange, title }) => {
  const upd = (i: number) => (w: SessionWeek) => onChange(weeks.map((x, idx) => idx === i ? w : x));
  return (
    <div className="border border-border">
      <div className="bg-foreground text-background px-3 py-2 text-sm font-bold flex justify-between">
        <span>PLAN STRONG™ — {title}</span>
        <span>WORKSHEET #2</span>
      </div>
      <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
        {weeks.map((w, i) => <WeekBlock key={i} w={w} onUpdate={upd(i)} />)}
      </div>
    </div>
  );
};
