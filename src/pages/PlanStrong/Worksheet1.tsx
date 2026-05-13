import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  computeSide, ZONE_LABELS, ZONE_PCT_LABELS, ZONE_COEF, PlanStrongSideInput,
} from './planStrongCalc';
import { useExercises } from '@/hooks/useExercises';
import { useExercise1RM } from '@/hooks/useExercise1RM';
import { SimpleExerciseSelectionDialog } from '@/components/programs/builder/SimpleExerciseSelectionDialog';

interface Props {
  side: PlanStrongSideInput;
  onChange: (s: PlanStrongSideInput) => void;
  userId?: string;
}

const cell = "border border-border px-2 py-1 text-xs";
const headCell = cell + " bg-muted font-semibold";
const inp = "h-7 px-1 text-xs rounded-none border-0 bg-transparent focus-visible:ring-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

const toNum = (v: string): number | '' => v === '' ? '' : +v;
const pctDisplay = (frac: number) => frac ? `${Math.round(frac * 100)}%` : '';
const parsePct = (raw: string): number => {
  const cleaned = raw.replace('%', '').trim();
  if (cleaned === '') return 0;
  const n = parseFloat(cleaned);
  if (isNaN(n)) return 0;
  return n / 100;
};

// Editable percent input — keeps a local string while focused so backspace works,
// commits parsed fraction on blur / Enter.
const PctInput: React.FC<{
  value: number;
  onCommit: (frac: number) => void;
  className?: string;
  placeholder?: string;
}> = ({ value, onCommit, className, placeholder }) => {
  const [focused, setFocused] = useState(false);
  const [local, setLocal] = useState<string>('');
  const display = focused ? local : pctDisplay(value);
  return (
    <Input
      className={className}
      value={display}
      placeholder={placeholder}
      onFocus={() => {
        setLocal(value ? String(Math.round(value * 100)) : '');
        setFocused(true);
      }}
      onChange={e => setLocal(e.target.value.replace('%', ''))}
      onBlur={() => {
        setFocused(false);
        onCommit(parsePct(local));
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
    />
  );
};

export const Worksheet1Side: React.FC<Props> = ({ side, onChange, userId }) => {
  const out = computeSide(side);
  const set = (patch: Partial<PlanStrongSideInput>) => onChange({ ...side, ...patch });
  const setZone = (i: number, raw: string) => {
    const arr = [...side.zonePct]; arr[i] = parsePct(raw); set({ zonePct: arr });
  };
  const setWeek = (key: 'mainPct' | 'v91Pct' | 'v81Pct', i: number, raw: string) => {
    const arr = [...side[key]]; arr[i] = parsePct(raw); set({ [key]: arr } as any);
  };
  const currentCoef = (side.zoneCoef && side.zoneCoef.length >= 6)
    ? side.zoneCoef.slice(0, 6)
    : ZONE_COEF;
  const currentZonePct = (side.zonePct && side.zonePct.length >= 6)
    ? side.zonePct.slice(0, 6)
    : Array(6).fill(0);
  const setCoef = (i: number, raw: string) => {
    const arr = [...currentCoef]; arr[i] = parsePct(raw); set({ zoneCoef: arr });
  };

  const [pickerOpen, setPickerOpen] = useState(false);
  const { exercises } = useExercises();
  const { oneRM: fetched1RM } = useExercise1RM({
    userId: userId || null,
    exerciseId: side.exerciseId || null,
  });
  const lastApplied1RM = useRef<{ key: string; val: number } | null>(null);
  useEffect(() => {
    if (fetched1RM != null && side.exerciseId && userId) {
      const key = `${userId}:${side.exerciseId}`;
      if (lastApplied1RM.current?.key !== key || lastApplied1RM.current?.val !== fetched1RM) {
        lastApplied1RM.current = { key, val: fetched1RM };
        onChange({ ...side, oneRM: fetched1RM });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetched1RM, side.exerciseId, userId]);

  const handleSelectExercise = (exId: string) => {
    const ex = exercises.find(e => e.id === exId);
    if (ex) onChange({ ...side, exerciseId: ex.id, lift: ex.name });
    setPickerOpen(false);
  };

  return (
    <div className="border border-border">
      <div className="bg-foreground text-background px-3 py-2 text-sm font-bold flex justify-between">
        <span>PLAN STRONG™ — PS {side.ps}</span>
        <span>WORKSHEET #1</span>
      </div>
      <div className="p-2 text-xs space-y-2 overflow-x-auto">
        <table className="border-collapse w-full">
          <thead>
            <tr>
              {['LIFT','PREP/COMP','1RM','KG/LB','PS/BTS','NL'].map(h =>
                <th key={h} className={headCell}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={cell}>
                <Button type="button" variant="outline" size="sm"
                  className="h-7 w-full justify-start rounded-none text-xs px-2"
                  onClick={() => setPickerOpen(true)}>
                  {side.lift || 'Επιλογή άσκησης...'}
                </Button>
              </td>
              <td className={cell}>
                <select className={inp + " w-full"} value={side.prepComp}
                  onChange={e => set({ prepComp: e.target.value })}>
                  <option>PREP</option><option>COMP</option>
                </select>
              </td>
              <td className={cell}>
                <Input className={inp} type="number" value={side.oneRM}
                  onChange={e => set({ oneRM: toNum(e.target.value) })} />
              </td>
              <td className={cell}>
                <select className={inp + " w-full"} value={side.unit}
                  onChange={e => set({ unit: e.target.value as any })}>
                  <option>KG</option><option>LB</option>
                </select>
              </td>
              <td className={cell}>
                <select className={inp + " w-full"} value={side.ps}
                  onChange={e => set({ ps: e.target.value as any })}>
                  <option value="50">50</option>
                  <option value="70">70</option>
                  <option value="BTS3">BTS3</option>
                  <option value="BTS6">BTS6</option>
                </select>
              </td>
              <td className={cell}>
                <Input className={inp} type="number" value={side.monthlyNL}
                  onChange={e => set({ monthlyNL: toNum(e.target.value) })} />
              </td>
            </tr>
          </tbody>
        </table>

        {(() => {
          const hiddenZones = side.ps === '70' ? [0, 1] : [];
          const visibleIdx = ZONE_LABELS.map((_, i) => i).filter(i => !hiddenZones.includes(i));
          const hiddenVariants = side.ps === '70' ? ['v50Pct', 'v61Pct'] : [];
          return (
        <>
        <table className="border-collapse w-full">
          <thead>
            <tr>
              <th className={headCell}></th>
              {visibleIdx.map(i => <th key={i} className={headCell}>{ZONE_LABELS[i]}</th>)}
              <th className={headCell}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={headCell}>KG</td>
              {visibleIdx.map(i => <td key={i} className={cell + " bg-muted/30"}>{out.zoneKg[i] || '-'}</td>)}
              <td className={cell + " bg-muted/30"}>-</td>
            </tr>
            <tr>
              <td className={headCell}>%1RM</td>
              {visibleIdx.map(i => (
                <td key={i} className={cell + " p-0"}>
                  <PctInput className={inp} value={currentCoef[i]} placeholder="0%"
                    onCommit={frac => {
                      const arr = [...currentCoef]; arr[i] = frac; set({ zoneCoef: arr });
                    }} />
                </td>
              ))}
              <td className={cell + " bg-muted/30"}>-</td>
            </tr>
            <tr>
              <td className={headCell}>% NL</td>
              {visibleIdx.map(i => (
                <td key={i} className={cell + " p-0"}>
                  <PctInput className={inp} value={currentZonePct[i]} placeholder="0%"
                    onCommit={frac => {
                      const arr = [...currentZonePct]; arr[i] = frac; set({ zonePct: arr });
                    }} />
                </td>
              ))}
              {(() => {
                const sum = visibleIdx.reduce((a, i) => a + (currentZonePct[i] || 0), 0);
                const pct = Math.round(sum * 100);
                const remaining = 100 - pct;
                return (
                  <td className={cell + " bg-muted/30 font-semibold"}>
                    {pct}% {remaining !== 0 && <span className="text-muted-foreground">({remaining > 0 ? `-${remaining}%` : `+${-remaining}%`})</span>}
                  </td>
                );
              })()}
            </tr>
            <tr>
              <td className={headCell}>NL</td>
              {visibleIdx.map(i => <td key={i} className={cell + " bg-muted/30"}>{out.monthlyNlPerZone[i] || '-'}</td>)}
              <td className={cell + " bg-muted/30 font-semibold"}>
                {Math.round(visibleIdx.reduce((a, i) => a + (out.monthlyNlPerZone[i] || 0), 0))}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="text-xs">
          <strong>ARI/HARI:</strong> {(out.ari * 100).toFixed(2)}
          &nbsp;|&nbsp; <strong>Total NL:</strong> {out.totalNL}
        </div>

        <table className="border-collapse w-full">
          <thead>
            <tr>
              <th className={headCell + " text-left"} colSpan={visibleIdx.length + 2}>MONTHLY NL PER INTENSITY ZONE</th>
            </tr>
            <tr>
              <th className={headCell}></th>
              {visibleIdx.map(i => <th key={i} className={headCell}>{ZONE_LABELS[i]}</th>)}
              <th className={headCell}>TOTAL NL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={headCell}>NL</td>
              {visibleIdx.map(i => <td key={i} className={cell + " bg-muted/30"}>{out.monthlyNlPerZone[i] || '-'}</td>)}
              <td className={cell + " bg-muted/30 font-semibold"}>
                {Math.round(visibleIdx.reduce((a, i) => a + (out.monthlyNlPerZone[i] || 0), 0))}
              </td>
            </tr>
          </tbody>
        </table>

        {([
          { label: 'MAIN VARIANT (91-100% INTENSITY ZONE)', key: 'mainPct' as const },
          { label: 'VARIANT (91-100% INTENSITY ZONE)', key: 'v91Pct' as const },
          { label: 'VARIANT (81-90% INTENSITY ZONE)', key: 'v81Pct' as const },
          { label: 'VARIANT (71-80% INTENSITY ZONE)', key: 'v71Pct' as const },
          { label: 'VARIANT (61-70% INTENSITY ZONE)', key: 'v61Pct' as const },
          { label: 'VARIANT (50-60% INTENSITY ZONE)', key: 'v50Pct' as const },
        ]).filter(v => !hiddenVariants.includes(v.key)).map(v => {
          const arr = (side as any)[v.key] && (side as any)[v.key].length === 4
            ? (side as any)[v.key] as number[]
            : [0, 0, 0, 0];
          const nl = arr.map(p => 2 * Math.round(((Number(side.monthlyNL) || 0) * p) / 2));
          return (
          <table key={v.key} className="border-collapse w-full table-fixed">
            <colgroup>
              <col style={{ width: '80px' }} />
              <col /><col /><col /><col />
              <col style={{ width: '90px' }} />
            </colgroup>
            <thead>
              <tr>
                <th className={headCell + " text-left"} colSpan={6}>{v.label}</th>
              </tr>
              <tr>
                <th className={headCell}></th>
                <th className={headCell}>WEEK 1</th>
                <th className={headCell}>WEEK 2</th>
                <th className={headCell}>WEEK 3</th>
                <th className={headCell}>WEEK 4</th>
                <th className={headCell}>TOTAL NL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={headCell}>%</td>
                {arr.map((p, i) => (
                  <td key={i} className={cell + " p-0"}>
                    <PctInput className={inp} value={p} placeholder="0%"
                      onCommit={frac => {
                        const next = [...arr]; next[i] = frac;
                        set({ [v.key]: next } as any);
                      }} />
                  </td>
                ))}
                <td className={cell + " bg-muted/30"}>
                  {Math.round(arr.reduce((a, b) => a + b, 0) * 100)}%
                </td>
              </tr>
              <tr>
                <td className={headCell}>NL</td>
                {nl.map((n, i) => <td key={i} className={cell + " bg-muted/30"}>{n || '-'}</td>)}
                <td className={cell + " bg-muted/30"}>{nl.reduce((a, b) => a + b, 0)}</td>
              </tr>
            </tbody>
          </table>
        );})}

        <table className="border-collapse w-full table-fixed">
          <colgroup>
            <col style={{ width: '80px' }} />
            <col /><col /><col /><col />
            <col style={{ width: '90px' }} />
          </colgroup>
          <thead>
            <tr>
              <th className={headCell}></th>
              <th className={headCell}>WEEK 1</th>
              <th className={headCell}>WEEK 2</th>
              <th className={headCell}>WEEK 3</th>
              <th className={headCell}>WEEK 4</th>
              <th className={headCell}></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={headCell}>WEEKLY HARI</td>
              {out.weeklyHari.map((h, i) => <td key={i} className={cell + " bg-muted/30"}>{h.toFixed(2)}</td>)}
              <td className={cell + " bg-muted/30"}></td>
            </tr>
          </tbody>
        </table>
        </>
        );})()}
      </div>

      <SimpleExerciseSelectionDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        exercises={exercises as any}
        onSelectExercise={handleSelectExercise}
      />
    </div>
  );
};
