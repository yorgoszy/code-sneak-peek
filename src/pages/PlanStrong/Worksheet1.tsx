import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  computeSide, ZONE_LABELS, ZONE_PCT_LABELS, ZONE_COEF, PlanStrongSideInput, getWeekDifficulty,
} from './planStrongCalc';
import { useExercises } from '@/hooks/useExercises';
import { useUserExerciseDataCacheContext } from '@/hooks/useUserExerciseDataCache';
import { SimpleExerciseSelectionDialog } from '@/components/programs/builder/SimpleExerciseSelectionDialog';

interface Props {
  side: PlanStrongSideInput;
  onChange: (s: PlanStrongSideInput) => void;
  userId?: string;
  userPickerSlot?: React.ReactNode;
  nlActionsSlot?: React.ReactNode;
  headerSlot?: React.ReactNode;
}

const cell = "border border-border px-2 py-1 text-xs";
const headCell = cell + " bg-muted font-semibold";
const inp = "h-7 px-1 text-xs rounded-none border-0 bg-transparent focus-visible:ring-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

const toNum = (v: string): number | '' => v === '' ? '' : +v;
const pctDisplay = (frac: number) => frac ? `${Math.round(frac * 100)}%` : '';
const zonePctLabel = (frac: number) => {
  const pct = frac * 100;
  return `${Number.isInteger(pct) ? pct : +pct.toFixed(1)}%`;
};
const parsePct = (raw: string): number => {
  const cleaned = raw.replace('%', '').trim();
  if (cleaned === '') return 0;
  const n = parseFloat(cleaned);
  if (isNaN(n)) return 0;
  return n / 100;
};

// Color WEEK header based on MAIN VARIANT % value for that week.
// 15±3% → blue, 22±3% → green, 28±3% → yellow, 35±3% → red.
const weekHeadStyle = (frac: number): React.CSSProperties => {
  const pct = Math.round((frac || 0) * 100);
  if (Math.abs(pct - 15) <= 3) return { backgroundColor: '#3b82f6', color: '#fff' };
  if (Math.abs(pct - 22) <= 3) return { backgroundColor: '#22c55e', color: '#fff' };
  if (Math.abs(pct - 28) <= 3) return { backgroundColor: '#facc15', color: '#000' };
  if (Math.abs(pct - 35) <= 3) return { backgroundColor: '#ef4444', color: '#fff' };
  return {};
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

export const Worksheet1Side: React.FC<Props> = ({ side, onChange, userId, userPickerSlot, nlActionsSlot, headerSlot }) => {
  const { getOneRM, userId: cachedUserId } = useUserExerciseDataCacheContext();
  // Use cache when a user is previewed (loads once per user, no refetch per exercise switch)
  const fetched1RM = (userId && cachedUserId === userId && side.exerciseId)
    ? getOneRM(side.exerciseId)
    : null;
  const effectiveOneRM: number | '' = userId
    ? (fetched1RM != null ? fetched1RM : '')
    : (side.oneRM ?? '');
  const effectiveSide: PlanStrongSideInput = { ...side, oneRM: effectiveOneRM };
  const out = computeSide(effectiveSide);
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

  const handleSelectExercise = (exId: string) => {
    const ex = exercises.find(e => e.id === exId);
    if (ex) onChange({ ...side, exerciseId: ex.id, lift: ex.name });
    setPickerOpen(false);
  };

  return (
    <div className="border border-border max-w-3xl">
      <div className="bg-foreground text-background px-3 py-2 text-sm font-bold flex justify-between">
        <span>PLAN STRONG™ — PS {side.ps}</span>
        <span>WORKSHEET #1</span>
      </div>
      <div className="p-2 text-xs space-y-2 overflow-x-auto">
        <div className="flex flex-wrap items-start gap-3">
          {userPickerSlot && (
            <div className="w-[160px]">{userPickerSlot}</div>
          )}
          <table className="border-collapse w-auto">
            <thead>
              <tr>
                {[
                  {h: 'LIFT', w: '160px'},
                  {h: '1RM', w: '80px'},
                  {h: 'PREP/COMP', w: '110px'},
                  {h: 'KG/LB', w: '80px'},
                  {h: 'PS/BTS', w: '90px'},
                  {h: 'NL', w: '80px'},
                ].map(({h, w}) =>
                  <th key={h} className={headCell} style={{ width: w }}>{h}</th>)}
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
                  <Input className={inp} type="number" value={effectiveOneRM}
                    readOnly={!!userId}
                    onChange={e => set({ oneRM: toNum(e.target.value) })} />
                </td>
                <td className={cell}>
                  <select className={inp + " w-full"} value={side.prepComp}
                    onChange={e => set({ prepComp: e.target.value })}>
                    <option>PREP</option><option>COMP</option>
                  </select>
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
          {nlActionsSlot && (
            <div className="flex items-center gap-1 pt-6">{nlActionsSlot}</div>
          )}
        </div>


        {(() => {
          const hiddenZones = side.ps === '70' ? [0, 1] : [];
          const visibleIdx = ZONE_LABELS.map((_, i) => i).filter(i => !hiddenZones.includes(i));
          const hiddenVariants = side.ps === '70' ? ['v50Pct', 'v61Pct'] : [];
          return (
        <div className="max-w-3xl space-y-2">
        <table className="border-collapse w-full">
          <thead>
            <tr>
              <th className={headCell}></th>
              {visibleIdx.map(i => (
                <th key={i} className={headCell + " p-0"}>
                  <PctInput className={inp + " text-center font-semibold"} value={currentCoef[i]} placeholder="0%"
                    onCommit={frac => {
                      const arr = [...currentCoef]; arr[i] = frac; set({ zoneCoef: arr });
                    }} />
                </th>
              ))}
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

        {(() => {
          const arr = side.mainPct && side.mainPct.length === 4 ? side.mainPct : [0, 0, 0, 0];
          const monthly = Number(side.monthlyNL) || 0;
          const nl = arr.map(p => Math.round(monthly * p));
          return (
          <table className="border-collapse w-full table-fixed">
            <colgroup>
              <col style={{ width: '80px' }} />
              <col /><col /><col /><col />
              <col style={{ width: '90px' }} />
            </colgroup>
            <thead>
              <tr>
                <th className={headCell + " text-left"} colSpan={6}>MAIN VARIANT</th>
              </tr>
              <tr>
                <th className={headCell}></th>
                {[0,1,2,3].map(i => {
                  const diff = getWeekDifficulty(arr[i]);
                  return (
                    <th key={i} className={headCell} style={weekHeadStyle(arr[i])}>
                      WEEK {i+1}{diff ? ` · ${diff}` : ''}
                    </th>
                  );
                })}
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
                        set({ mainPct: next });
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
          );
        })()}

        <div className="bg-black p-2 space-y-2">
        {([
          { key: 'v95Pct' as const, zones: [5] },
          { key: 'v91Pct' as const, zones: [4] },
          { key: 'v81Pct' as const, zones: [3] },
          { key: 'v71Pct' as const, zones: [2] },
          { key: 'v61Pct' as const, zones: [1] },
          { key: 'v50Pct' as const, zones: [0] },
        ]).filter(v => !hiddenVariants.includes(v.key as any)).map(v => {
          const arr = (side as any)[v.key] && (side as any)[v.key].length === 4
            ? (side as any)[v.key] as number[]
            : [0, 0, 0, 0];
          const targetNl = v.zones.reduce((a, z) => a + (out.monthlyNlPerZone[z] || 0), 0);
          const nl = arr.map(p => Math.round(targetNl * p));
          return (
          <table key={v.key} className="border-collapse w-full table-fixed bg-background">
            <colgroup>
              <col style={{ width: '80px' }} />
              <col /><col /><col /><col />
              <col style={{ width: '90px' }} />
            </colgroup>
            <thead>
              <tr>
                <th className={headCell + " text-left"} colSpan={6}>
                  Zone {v.zones.map(z => zonePctLabel(currentCoef[z] ?? ZONE_COEF[z])).join(' - ')}
                </th>
              </tr>
              <tr>
                <th className={headCell}></th>
                {[0,1,2,3].map(i => {
                  const mp = (side.mainPct && side.mainPct[i]) || 0;
                  const diff = getWeekDifficulty(mp);
                  return (
                    <th key={i} className={headCell} style={weekHeadStyle(mp)}>
                      WEEK {i+1}{diff ? ` · ${diff}` : ''}
                    </th>
                  );
                })}
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
                {nl.map((n, i) => (
                  <td key={i} className={cell + " p-0"}>
                    <Input
                      className={inp}
                      type="number"
                      value={n || ''}
                      placeholder="0"
                      onChange={e => {
                        const newNl = e.target.value === '' ? 0 : +e.target.value;
                        const newPct = targetNl > 0 ? newNl / targetNl : 0;
                        const next = [...arr]; next[i] = newPct;
                        set({ [v.key]: next } as any);
                      }}
                    />
                  </td>
                ))}
                <td className={cell + " bg-muted/30"}>{nl.reduce((a, b) => a + b, 0)} / {targetNl}</td>
              </tr>
            </tbody>
          </table>
        );})}
        </div>


        <div className="sticky bottom-0 z-20 bg-background border-t border-border shadow-[0_-2px_4px_rgba(0,0,0,0.08)]">
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
              {out.weeklyHari.map((h, i) => {
                const inRange = h >= 75 && h <= 81;
                const color = h > 0 ? (inRange ? 'text-blue-600' : 'text-red-600') : '';
                return <td key={i} className={cell + " bg-muted/30 font-bold " + color}>{h.toFixed(2)}</td>;
              })}
              <td className={cell + " bg-muted/30"}></td>
            </tr>
          </tbody>
        </table>
        </div>
        </div>
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
