import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { SessionWeek, PlanStrongMonthWS2, defaultSessionWeek } from './planStrongCalc';

const ZONES = ['>=95%1RM', '91-94%1RM', '81-90%1RM', '71-80%1RM', '61-70%1RM', '50-60%1RM'];
// Map display order (high→low) to data zone index (low→high in planStrongCalc)
const ZONE_DATA_IDX = [5, 4, 3, 2, 1, 0];

const cell = "border border-border px-2 py-1 text-xs";
const head = cell + " bg-muted font-semibold";
const inp = "h-7 px-1 text-xs rounded-none border-0 bg-transparent";

interface WeekBlockProps {
  w: SessionWeek;
  onUpdate: (w: SessionWeek) => void;
}

const WeekBlock: React.FC<WeekBlockProps> = ({ w, onUpdate }) => {
  const dayCount = w.sessions[0]?.length ?? 5;

  const setSession = (zi: number, di: number, v: number) => {
    const sessions = w.sessions.map((row, ri) => ri === zi ? row.map((c, ci) => ci === di ? v : c) : row);
    onUpdate({ ...w, sessions });
  };
  const setPlan = (zi: number, di: number, v: string) => {
    const plans = w.plans.map((row, ri) => ri === zi ? row.map((c, ci) => ci === di ? v : c) : row);
    onUpdate({ ...w, plans });
  };
  const dayTotal = (di: number) => w.sessions.reduce((a, row) => a + (row[di] || 0), 0);

  const addDay = () => {
    const sessions = w.sessions.map(row => [...row, 0]);
    const plans = w.plans.map(row => [...row, '']);
    onUpdate({ ...w, sessions, plans });
  };
  const removeDay = (di: number) => {
    if (dayCount <= 1) return;
    const sessions = w.sessions.map(row => row.filter((_, i) => i !== di));
    const plans = w.plans.map(row => row.filter((_, i) => i !== di));
    onUpdate({ ...w, sessions, plans });
  };

  return (
    <div className="border border-border">
      <div className="bg-muted px-2 py-1 text-xs font-semibold flex items-center justify-between">
        <span>WEEK {w.week}</span>
        <Button size="sm" variant="outline" className="h-6 px-2 rounded-none" onClick={addDay}>
          <Plus className="w-3 h-3 mr-1" /> Ημέρα
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="border-collapse w-full">
          <thead>
            <tr>
              <th className={head}>ZONE / NL</th>
              {Array.from({ length: dayCount }).map((_, di) => (
                <th key={di} className={head}>
                  <div className="flex items-center justify-between gap-1">
                    <span>DAY {di + 1}</span>
                    {dayCount > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDay(di)}
                        className="hover:text-destructive"
                        title="Αφαίρεση ημέρας"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className={head}>CHECK</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={head}>DAY NL</td>
              {Array.from({ length: dayCount }).map((_, di) => (
                <td key={di} className={cell + " bg-muted/30"}>{dayTotal(di)}</td>
              ))}
              <td className={cell + " bg-muted/30"}></td>
            </tr>
            {ZONES.map((z, displayIdx) => {
              const zi = ZONE_DATA_IDX[displayIdx];
              return (
                <tr key={z}>
                  <td className={head}>{z}</td>
                  {w.sessions[zi].map((v, di) => (
                    <td key={di} className={cell + " p-0"}>
                      <Input
                        className={inp + " w-16"}
                        type="number"
                        value={v}
                        onChange={e => setSession(zi, di, +e.target.value)}
                      />
                    </td>
                  ))}
                  <td className={cell + " bg-muted/30"}>{w.sessions[zi].reduce((a, b) => a + b, 0)}</td>
                </tr>
              );
            })}
            <tr>
              <td className={head}>PLAN</td>
              {Array.from({ length: dayCount }).map((_, di) => (
                <td key={di} className={cell + " p-0"}>
                  <Input
                    className={inp}
                    placeholder="3x75"
                    value={w.plans[0]?.[di] ?? ''}
                    onChange={e => setPlan(0, di, e.target.value)}
                  />
                </td>
              ))}
              <td className={cell}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface MonthBlockProps {
  monthIdx: number;
  month: PlanStrongMonthWS2;
  title: string;
  onUpdate: (m: PlanStrongMonthWS2) => void;
}

const MonthBlock: React.FC<MonthBlockProps> = ({ monthIdx, month, title, onUpdate }) => {
  const weeks = month.weeks;
  const updateWeek = (wi: number) => (nw: SessionWeek) => {
    onUpdate({ ...month, weeks: weeks.map((x, i) => i === wi ? nw : x) });
  };
  return (
    <div className="border border-border">
      <div className="bg-foreground text-background px-3 py-2 text-sm font-bold flex justify-between">
        <span>M{monthIdx + 1} — {title}</span>
        <span>WORKSHEET #2</span>
      </div>
      <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
        {weeks.map((w, i) => (
          <WeekBlock key={i} w={w} onUpdate={updateWeek(i)} />
        ))}
      </div>
    </div>
  );
};

interface Props {
  months: PlanStrongMonthWS2[];
  onChange: (months: PlanStrongMonthWS2[]) => void;
  titles: string[]; // length === months.length, e.g. "PS 50"
}

export const Worksheet2: React.FC<Props> = ({ months, onChange, titles }) => {
  const updateMonth = (mi: number) => (m: PlanStrongMonthWS2) => {
    onChange(months.map((x, i) => i === mi ? m : x));
  };
  return (
    <div className="space-y-4">
      {months.map((m, i) => (
        <MonthBlock
          key={i}
          monthIdx={i}
          month={m}
          title={titles[i] ?? ''}
          onUpdate={updateMonth(i)}
        />
      ))}
    </div>
  );
};
