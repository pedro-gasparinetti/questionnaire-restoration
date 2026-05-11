/**
 * RevenueTimelineBuilder
 *
 * Interactive step-line chart for entering NTFP revenue by year range.
 * Each segment = (yearFrom, yearTo, revenue US$/ha).
 * A step-function line chart updates live as values are typed.
 * The sum of all segments is propagated via `onTotalChange`.
 */

import { useId } from "react";
import type { RevenueSegment } from "../../types";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Props {
  startYear?: number;
  maxYear?: number;
  value: RevenueSegment[];
  onChange: (segments: RevenueSegment[]) => void;
  onTotalChange: (total: number) => void;
}

// ─── Colours & geometry ─────────────────────────────────────────────────────

const COLOURS = [
  "#27ae60", "#1a7a42", "#2ecc71",
  "#16a085", "#1abc9c", "#4caf80", "#0d6b3e", "#3ddc84",
];
const colour = (i: number) => COLOURS[i % COLOURS.length];

const VW = 560, VH = 190;
const P  = { top: 18, right: 20, bottom: 42, left: 64 };
const CW = VW - P.left - P.right;
const CH = VH - P.top  - P.bottom;

function formatUSD(v: number) {
  return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function getSegmentSpan(segment: RevenueSegment) {
  return Math.max(0, segment.yearTo - segment.yearFrom + 1);
}

function computeTotal(segments: RevenueSegment[]) {
  return segments.reduce((sum, seg) => sum + getSegmentSpan(seg) * (Number(seg.revenue) || 0), 0);
}

// ─── Step-function line chart ───────────────────────────────────────────────

function LineChart({
  segments, startYear, maxYear,
}: { segments: RevenueSegment[]; startYear: number; maxYear: number; }) {
  const years = maxYear - startYear + 1;

  const revMap: Record<number, number> = {};
  for (let y = startYear; y <= maxYear; y++) revMap[y] = 0;
  segments.forEach((s) => {
    const from = Math.max(startYear, s.yearFrom);
    const to   = Math.min(maxYear, s.yearTo);
    for (let y = from; y <= to; y++) revMap[y] += Number(s.revenue) || 0;
  });

  const maxRev = Math.max(...Object.values(revMap), 1);
  const yMax   = Math.ceil(maxRev / 100) * 100 || 200;

  const xFor = (year: number) => P.left + ((year - startYear) / years) * CW;
  const yFor = (rev: number) => P.top + CH - (rev / yMax) * CH;

  const pts: [number, number][] = [];
  for (let y = startYear; y <= maxYear; y++) {
    pts.push([xFor(y),     yFor(revMap[y])]);
    pts.push([xFor(y + 1), yFor(revMap[y])]);
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
  const hasData = segments.some((s) => (Number(s.revenue) || 0) > 0);

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="cost-timeline-chart revenue-timeline-chart" aria-label="NTFP revenue timeline">
      <defs>
        <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#27ae60" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#27ae60" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yTicks.map((t) => (
        <line key={t} x1={P.left} x2={P.left + CW} y1={yFor(t)} y2={yFor(t)}
          stroke="#e2e8f0" strokeWidth="1" strokeDasharray={t === 0 ? undefined : "4 3"} />
      ))}
      {hasData && <path d={areaD} fill="url(#revAreaGrad)" />}
      {hasData && <polyline points={polyline} fill="none" stroke="#27ae60" strokeWidth="2.2" strokeLinejoin="round" />}
      {hasData && segments.filter((s) => (Number(s.revenue) || 0) > 0).map((s, i) => {
        const y = Math.max(startYear, Math.min(maxYear, s.yearFrom));
        return <circle key={s.id} cx={xFor(y)} cy={yFor(revMap[y])} r="4" fill={colour(i)} stroke="#fff" strokeWidth="1.5" />;
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
          Add a revenue segment below to see the chart
        </text>
      )}
    </svg>
  );
}

function Legend({ segments }: { segments: RevenueSegment[] }) {
  const visible = segments.filter((s) => (Number(s.revenue) || 0) > 0 || s.label);
  if (visible.length === 0) return null;
  return (
    <div className="cost-timeline-legend">
      {segments.map((seg, i) => (
        <span key={seg.id} className="cost-timeline-legend-item">
          <span className="cost-timeline-legend-dot" style={{ background: colour(i) }} />
          {seg.label || `Segment ${i + 1}`}
          {(Number(seg.revenue) || 0) > 0 && (
            <span className="cost-timeline-legend-cost" style={{ color: "#27ae60" }}>US$ {formatUSD(seg.revenue)}/ha</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function RevenueTimelineBuilder({ startYear = 2, maxYear = 20, value, onChange, onTotalChange }: Props) {
  const uid = useId();
  const segments = value;

  const update = (updated: RevenueSegment[]) => {
    // Auto-number labels so the visible segment names always match their position
    const renumbered = updated.map((s, i) => ({ ...s, label: `Segment ${i + 1}` }));
    onChange(renumbered);
    onTotalChange(computeTotal(renumbered));
  };

  const MAX_SEGMENTS = 5;
  const atLimit = segments.length >= MAX_SEGMENTS;

  const add = () => {
    if (atLimit) return;
    update([...segments, { id: `${uid}-${Date.now()}`, label: "", yearFrom: startYear, yearTo: maxYear, revenue: 0 }]);
  };

  const remove = (id: string) => update(segments.filter((s) => s.id !== id));
  const patch  = (id: string, p: Partial<RevenueSegment>) =>
    update(segments.map((s) => (s.id === id ? { ...s, ...p } : s)));

  const total = computeTotal(segments);

  return (
    <div className="cost-timeline-builder revenue-timeline-builder">
      <LineChart segments={segments} startYear={startYear} maxYear={maxYear} />
      <Legend segments={segments} />

      <div className="cost-timeline-rows">
        {segments.length === 0 && (
          <p className="cost-timeline-empty">No revenue segments yet — click "Add revenue segment" to start.</p>
        )}
        {segments.map((seg, i) => (
          <div key={seg.id} className="cost-timeline-row">
            <span className="cost-timeline-row-swatch" style={{ background: colour(i) }} />

            <div className="cost-timeline-field cost-timeline-field--label">
              <label className="cost-timeline-input-label">Name</label>
              <span className="cost-timeline-input cost-timeline-input--readonly">{`Segment ${i + 1}`}</span>
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
              <label className="cost-timeline-input-label">Revenue (US$/ha/yr)</label>
              <input type="number" className="cost-timeline-input"
                min={0} step={0.01} placeholder="0.00"
                value={seg.revenue === 0 ? "" : seg.revenue}
                onChange={(e) => patch(seg.id, { revenue: Number(e.target.value) || 0 })} />
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
        <div className="cost-timeline-add-row">
          <button
            type="button"
            className="cost-timeline-add revenue-add-btn"
            onClick={add}
            disabled={atLimit}
            style={atLimit ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
          >+ Add revenue segment</button>
          <span className="cost-timeline-add-hint">
            {atLimit
              ? `Maximum of ${MAX_SEGMENTS} segments reached. Remove a segment to add a new one.`
              : `Split the revenue period into segments with different annual revenues (e.g., early low-yield years vs. mature harvest years). Maximum ${MAX_SEGMENTS} segments.`}
          </span>
        </div>
        {segments.length > 0 && (
          <span className="cost-timeline-total" style={{ color: "#27ae60" }}>Accumulated total: <strong>US$ {formatUSD(total)}/ha</strong></span>
        )}
      </div>
    </div>
  );
}
