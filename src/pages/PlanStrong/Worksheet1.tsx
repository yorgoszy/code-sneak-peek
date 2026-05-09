import React from 'react';
import { Input } from '@/components/ui/input';
import { computeSide, ZONE_LABELS, ZONE_COEF, PlanStrongSideInput } from './planStrongCalc';

interface Props {
  side: PlanStrongSideInput;
  onChange: (s: PlanStrongSideInput) => void;
  title: string;
}

const cell = "border border-border px-2 py-1 text-xs";
const headCell = cell + " bg-muted font-semibold";
const inp = "h-7 px-1 text-xs rounded-none border-0 bg-transparent focus-visible:ring-1";

export const Worksheet1Side: React.FC<Props> = ({ side, onChange, title }) => {
  const out = computeSide(side);
  const set = (patch: Partial<PlanStrongSideInput>) => onChange({ ...side, ...patch });
  const setZone = (i: number, v: number) => {
    const arr = [...side.zonePct]; arr[i] = v; set({ zonePct: arr });
  };
  const setWeek = (key: 'mainPct' | 'v91Pct' | 'v81Pct', i: number, v: number) => {
    const arr = [...side[key]]; arr[i] = v; set({ [key]: arr } as any);
  };

  return (
    <div className="border border-border">
      <div className="bg-foreground text-background px-3 py-2 text-sm font-bold flex justify-between">
        <span>PLAN STRONG™ — {title}</span>
        <span>WORKSHEET #1</span>
      </div>
      <div className="p-2 text-xs space-y-2 overflow-x-auto">
        {/* Header row */}
        <table className="border-collapse w-full">
          <thead>
            <tr>
              {['LIFT','PREP/COMP','1RM','KG/LB','PS 50/70','NL'].map(h =>
                <th key={h} className={headCell}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={cell}><Input className={inp} value={side.lift} onChange={e => set({ lift: e.target.value })} /></td>
              <td className={cell}>
                <select className={inp + " w-full"} value={side.prepComp} onChange={e => set({ prepComp: e.target.value })}>
                  <option>PREP</option><option>COMP</option>
                </select>
              </td>
              <td className={cell}><Input className={inp} type="number" value={side.oneRM} onChange={e => set({ oneRM: +e.target.value })} /></td>
              <td className={cell}>
                <select className={inp + " w-full"} value={side.unit} onChange={e => set({ unit: e.target.value as any })}>
                  <option>KG</option><option>LB</option>
                </select>
              </td>
              <td className={cell}><Input className={inp} type="number" value={side.ps} onChange={e => set({ ps: +e.target.value })} /></td>
              <td className={cell}><Input className={inp} type="number" value={side.monthlyNL} onChange={e => set({ monthlyNL: +e.target.value })} /></td>
            </tr>
          </tbody>
        </table>

        {/* Zone table */}
        <table className="border-collapse w-full">
          <thead>
            <tr>
              <th className={headCell}></th>
              {ZONE_LABELS.map(l => <th key={l} className={headCell}>{l}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={headCell}>KG</td>
              {out.zoneKg.map((k, i) => <td key={i} className={cell + " bg-muted/30"}>{k || '-'}</td>)}
            </tr>
            <tr>
              <td className={headCell}>%1RM</td>
              {ZONE_COEF.map((c, i) => <td key={i} className={cell + " text-muted-foreground"}>{c || '-'}</td>)}
            </tr>
            <tr>
              <td className={headCell}>% NL</td>
              {side.zonePct.map((p, i) => (
                <td key={i} className={cell}>
                  <Input className={inp} type="number" step="0.01" value={p}
                    onChange={e => setZone(i, +e.target.value)} />
                </td>
              ))}
            </tr>
            <tr>
              <td className={headCell}>NL</td>
              {out.monthlyNlPerZone.map((n, i) => <td key={i} className={cell + " bg-muted/30"}>{n || '-'}</td>)}
            </tr>
          </tbody>
        </table>

        <div className="text-xs">
          <strong>ARI/HARI:</strong> {out.ari.toFixed(4)}
          &nbsp;|&nbsp; <strong>Total NL:</strong> {out.totalNL}
        </div>

        {/* Variants */}
        {[
          { label: 'MAIN VARIANT (91-100% INTENSITY ZONE)', key: 'mainPct' as const, nl: out.mainNlPerWeek },
          { label: 'VARIANT (91-100% INTENSITY ZONE)', key: 'v91Pct' as const, nl: out.v91NlPerWeek },
          { label: 'VARIANT (81-90% INTENSITY ZONE)', key: 'v81Pct' as const,
            nl: side.v81Pct.map(p => +(side.monthlyNL * p).toFixed(2)) },
        ].map(v => (
          <table key={v.key} className="border-collapse w-full">
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
                {side[v.key].map((p, i) => (
                  <td key={i} className={cell}>
                    <Input className={inp} type="number" step="0.01" value={p}
                      onChange={e => setWeek(v.key, i, +e.target.value)} />
                  </td>
                ))}
                <td className={cell + " bg-muted/30"}>
                  {side[v.key].reduce((a, b) => a + b, 0).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className={headCell}>NL</td>
                {v.nl.map((n, i) => <td key={i} className={cell + " bg-muted/30"}>{n || '-'}</td>)}
                <td className={cell + " bg-muted/30"}>{v.nl.reduce((a, b) => a + b, 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        ))}

        {/* Weekly HARI */}
        <table className="border-collapse w-full">
          <thead>
            <tr>
              <th className={headCell}></th>
              <th className={headCell}>WEEK 1</th>
              <th className={headCell}>WEEK 2</th>
              <th className={headCell}>WEEK 3</th>
              <th className={headCell}>WEEK 4</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={headCell}>WEEKLY HARI</td>
              {out.weeklyHari.map((h, i) => <td key={i} className={cell + " bg-muted/30"}>{h.toFixed(2)}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
