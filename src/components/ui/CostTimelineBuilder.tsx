/**
 * CostTimelineBuilder
 *
 * Interactive step-line chart for entering maintenance costs by year range.
 * Each segment = (yearFrom, yearTo, cost US$/ha).
 * A step-function line chart updates live as values are typed.
 * The sum of all segments is propagated via `onTotalChange`.
 */

import { useState, useId } from "react";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface CostSegment {
  id: string;
  label: string;
  yearFrom: number;
  yearTo: number;
  cost: number;
}

interface Props {
  /** First year on the timeline (default: 2 â€” year 1 is implementation) */
  startYear?: number;
  /** Last year on the timeline (default: 20) */
  maxYear?: number;
  /** Called whenever the total cost changes */
  onTotalChange: (total: number) => void;
}

// â”€â”€â”€ Colours & geometry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const COLOURS = [
  "#2596be", "#b45309", "#7c3aed",
  "#c0392b", "#1a5c8a", "#4caf80", "#f59e0b", "#2196a8",
];
const colour = (i: number) => COLOURS[i % COLOURS.length];

// â”€â”€â”€ Chart geometry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const VW = 560, VH = 190;
const P  = { top: 18, right: 20, bottom: 42, left: 64 };
const CW = VW - P.left - P.right;
const CH = VH - P.top  - P.bottom;

function formatUSD(v: number) {
  return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// â”€â”€â”€ Step-function line chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function LineChart({
  segments, startYear, maxYear,
}: { segments: CostSegment[]; startYear: number; maxYear: number; }) {
  const years = maxYear - startYear + 1;

  const costMap: Record<number, number> = {};
  for (let y = startYear; y <= maxYear; y++) costMap[y] = 0;
  segments.forEach((s) => {
    const from = Math.max(startYear, s.yearFrom);
    const to   = Math.min(maxYear, s.yearTo);
    for (let y = from; y <= to; y++) costMap[y] += Number(s.cost) || 0;
  });

  const maxCost = Math.max(...Object.values(costMap), 1);
  const yMax    = Math.ceil(maxCost / 100) * 100 || 200;

  const xFor = (year: number) => P.left + ((year - startYear) / years) * CW;
  const yFor = (cost: number) => P.top + CH - (cost / yMax) * CH;

  const pts: [number, number][] = [];
  for (let y = startYear; y <= maxYear; y++) {
    pts.push([xFor(y),     yFor(costMap[y])]);
    pts.push([xFor(y + 1), yFor(costMap[y])]);
  }
  const polyline = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaD =
    `M ${xFor(startYear).toFixed(1)},${yFor(0).toFixed(1)} ` +
    pts.map(([x, y]) => `L ${x.toFixed(1)},${y.toFixed(1)}`).join(" ") +
    ` L ${xFor(maxYear + 1).toFixed(1)},${yFor(0).toFixed(1)} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map((f) => Math.round(f * yMax));
  const xTickYears: number[] = [];
  for (let y = startYear; y <= maxYear; y += 5) xTickYears.push(y);
  if (!xTickYears.includes(maxYear)) xTickYears.push(maxYear);
  const hasData = segments.some((s) => (Number(s.cost) || 0) > 0);

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="cost-timeline-chart" aria-label="Maintenance cost timeline">
      <defs>
        <linearGradient id="ctbAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2596be" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2596be" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yTicks.map((t) => (
        <line key={t} x1={P.left} x2={P.left + CW} y1={yFor(t)} y2={yFor(t)}
          stroke="#e2e8f0" strokeWidth="1" strokeDasharray={t === 0 ? undefined : "4 3"} />
      ))}
      {hasData && <path d={areaD} fill="url(#ctbAreaGrad)" />}
      {hasData && <polyline points={polyline} fill="none" stroke="#2596be" strokeWidth="2.2" strokeLinejoin="round" />}
      {hasData && segments.filter((s) => (Number(s.cost) || 0) > 0).map((s, i) => {
        const y = Math.max(startYear, Math.min(maxYear, s.yearFrom));
        return <circle key={s.id} cx={xFor(y)} cy={yFor(costMap[y])} r="4" fill={colour(i)} stroke="#fff" strokeWidth="1.5" />;
      })}
      <line x1={P.left} y1={P.top} x2={P.left} y2={P.top + CH} stroke="#94a3b8" strokeWidth="1.5" />
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={P.left - 4} y1={yFor(t)} x2={P.left} y2={yFor(t)} stroke="#94a3b8" strokeWidth="1" />
          <text x={P.left - 7} y={yFor(t) + 3.5} fill="#64748b" fontSize="9" textAnchor="end">{formatUSD(t)}</text>
        </g>
      ))}
      <text x={22} y={P.top + CH / 2} fill="#64748b" fontSize="9" textAnchor="middle"
        transform={`rotate(-90,22,${P.top + CH / 2})`}>US$/ha</text>
      <line x1={P.left} y1={P.top + CH} x2={P.left + CW} y2={P.top + CH} stroke="#94a3b8" strokeWidth="1.5" />
      {xTickYears.map((y) => (
        <g key={`x${y}`}>
          <line x1={xFor(y)} y1={P.top + CH} x2={xFor(y)} y2={P.top + CH + 4} stroke="#94a3b8" strokeWidth="1" />
          <text x={xFor(y)} y={P.top + CH + 14} fill="#64748b" fontSize="10" textAnchor="middle">Yr {y}</text>
        </g>
      ))}
      {!hasData && (
        <text x={P.left + CW / 2} y={P.top + CH / 2} fill="#b0b8c9" fontSize="12" textAnchor="middle">
          Add a cost segment below to see the chart
        </text>
      )}
    </svg>
  );
}

function Legend({ segments }: { segments: CostSegment[] }) {
  const visible = segments.filter((s) => (Number(s.cost) || 0) > 0 || s.label);
  if (visible.length === 0) return null;
  return (
    <div className="cost-timeline-legend">
      {segments.map((seg, i) => (
        <span key={seg.id} className="cost-timeline-legend-item">
          <span className="cost-timeline-legend-dot" style={{ background: colour(i) }} />
          {seg.label || `Segment ${i + 1}`}
          {(Number(seg.cost) || 0) > 0 && (
            <span className="cost-timeline-legend-cost">US$ {formatUSD(seg.cost)}/ha</span>
          )}
        </span>
      ))}
    </div>
  );
}

// â”€â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function CostTimelineBuilder({ startYear = 2, maxYear = 20, onTotalChange }: Props) {
  const uid = useId();
  const [segments, setSegments] = useState<CostSegment[]>([]);

  const update = (updated: CostSegment[]) => {
    setSegments(updated);
    onTotalChange(updated.reduce((s, seg) => s + (Number(seg.cost) || 0), 0));
  };

  const add = () =>
    update([...segments, { id: `${uid}-${Date.now()}`, label: "", yearFrom: startYear, yearTo: maxYear, cost: 0 }]);

  const remove = (id: string) => update(segments.filter((s) => s.id !== id));
  const patch  = (id: string, p: Partial<CostSegment>) =>
    update(segments.map((s) => (s.id === id ? { ...s, ...p } : s)));

  const total = segments.reduce((s, seg) => s + (Number(seg.cost) || 0), 0);

  return (
    <div className="cost-timeline-builder">
      <LineChart segments={segments} startYear={startYear} maxYear={maxYear} />
      <Legend segments={segments} />

      <div className="cost-timeline-rows">
        {segments.length === 0 && (
          <p className="cost-timeline-empty">No segments yet — click "Add segment" to start.</p>
        )}
        {segments.map((seg, i) => (
          <div key={seg.id} className="cost-timeline-row">
            <span className="cost-timeline-row-swatch" style={{ background: colour(i) }} />

            <div className="cost-timeline-field cost-timeline-field--label">
              <label className="cost-timeline-input-label">Name</label>
              <input type="text" className="cost-timeline-input"
                placeholder={`Segment ${i + 1}`}
                value={seg.label}
                onChange={(e) => patch(seg.id, { label: e.target.value })} />
            </div>

            <div className="cost-timeline-field cost-timeline-field--year">
              <label className="cost-timeline-input-label">From year</label>
              <select
                className="cost-timeline-input"
                value={seg.yearFrom}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  patch(seg.id, { yearFrom: v, yearTo: Math.max(v, seg.yearTo) });
                }}
              >
                {Array.from({ length: maxYear - startYear + 1 }, (_, i) => startYear + i).map((y) => (
                  <option key={y} value={y}>Yr {y}</option>
                ))}
              </select>
            </div>

            <div className="cost-timeline-field cost-timeline-field--year">
              <label className="cost-timeline-input-label">To year</label>
              <select
                className="cost-timeline-input"
                value={seg.yearTo}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  patch(seg.id, { yearTo: Math.max(seg.yearFrom, v) });
                }}
              >
                {Array.from({ length: maxYear - seg.yearFrom + 1 }, (_, i) => seg.yearFrom + i).map((y) => (
                  <option key={y} value={y}>Yr {y}</option>
                ))}
              </select>
            </div>

            <div className="cost-timeline-field cost-timeline-field--cost">
              <label className="cost-timeline-input-label">Total cost (US$/ha)</label>
              <input type="number" className="cost-timeline-input"
                min={0} step={0.01} placeholder="0.00"
                value={seg.cost === 0 ? "" : seg.cost}
                onChange={(e) => patch(seg.id, { cost: Number(e.target.value) || 0 })} />
            </div>

            <button type="button" className="cost-timeline-remove"
              onClick={() => remove(seg.id)} title="Remove segment" aria-label="Remove segment">
              <svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="1" y1="1" x2="9" y2="9" />
                <line x1="9" y1="1" x2="1" y2="9" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="cost-timeline-footer">
        <button type="button" className="cost-timeline-add" onClick={add}>+ Add segment</button>
        {segments.length > 0 && (
          <span className="cost-timeline-total">Total: <strong>US$ {formatUSD(total)}/ha</strong></span>
        )}
      </div>
    </div>
  );
}
