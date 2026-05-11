/**
 * CBAResultsSection – Illustrative Cost-Benefit Analysis results panel.
 *
 * Reads current form values, computes 20-year CBA projections for every
 * active (non-disabled) restoration method, and displays:
 *   — KPI summary cards: NPV, BCR, IRR, Payback Year
 *   — Annual cost components (stacked bar: implementation / maintenance / constraints)
 *   — NPV sensitivity (bar chart across 5 discount rates)
 *   — 20-year totals footer row
 *
 * This panel is illustrative only — no download. The questionnaire data is
 * exported through the main Export Excel button.
 */

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { BarChart3 } from "lucide-react";
import type { RestorationModelFormData } from "../../schemas";
import type { RestorationModel } from "../../types";
import { computeMethodCBA, METHOD_KEYS as CBA_METHOD_KEYS } from "../../utils/cba";
import type { MethodCBA } from "../../utils/cba";
import { CollapsibleSection } from "../ui";

// ---------------------------------------------------------------------------
// Palette — distinct colours per cost category for the stacked bar chart.
// ---------------------------------------------------------------------------
const PALETTE = {
  impl:       "#c0392b",   // red       – implementation cost
  maint:      "#2596be",   // blue      – maintenance cost
  constraint: "#f59e0b",   // amber     – constraint cost
  netLine:    "#1a3530",   // very dark – reference line
  npvPos:     "#4E8465",
  npvNeg:     "#c0392b",
};

function fmtUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  values: RestorationModelFormData;
}

// ---------------------------------------------------------------------------
// Main section component
// ---------------------------------------------------------------------------

export function CBAResultsSection({ values }: Props) {
  const results = useMemo<MethodCBA[]>(() => {
    const disabled = new Set<string>((values.disabledMethods ?? []) as string[]);
    const data = values as unknown as RestorationModel;
    return CBA_METHOD_KEYS
      .filter((mk) => !disabled.has(mk))
      .map((mk) => {
        const method = data.methodCosts?.[mk];
        if (!method || !((method.implementationCost ?? 0) > 0)) return null;
        try { return computeMethodCBA(mk, method, data); } catch { return null; }
      })
      .filter((r): r is MethodCBA => r !== null);
  }, [values]);

  const [activeId, setActiveId] = useState<string>("");
  const active = results.find((r) => r.methodId === activeId) ?? results[0] ?? null;

  if (results.length === 0) return null;

  return (
    <CollapsibleSection
      title="Results: Cost-Benefit Analysis"
      subtitle="20-year NPV, IRR, BCR and cash-flow projections per restoration method"
      defaultOpen={true}
      icon={<BarChart3 size={20} />}
    >
      {/* Method selector tabs (only shown when > 1 method) */}
      {results.length > 1 && (
        <div className="cba-method-tabs">
          {results.map((r) => (
            <button
              key={r.methodId}
              type="button"
              className={`cba-method-tab${active?.methodId === r.methodId ? " cba-method-tab--active" : ""}`}
              onClick={() => setActiveId(r.methodId)}
            >
              {r.methodLabel}
            </button>
          ))}
        </div>
      )}

      {active ? (
        <MethodCBAView cba={active} />
      ) : (
        <p className="form-empty">Complete at least one method's costs to see results.</p>
      )}
    </CollapsibleSection>
  );
}

// ---------------------------------------------------------------------------
// Per-method view with KPIs + 3 charts
// ---------------------------------------------------------------------------

function MethodCBAView({ cba }: { cba: MethodCBA }) {
  const npv10 = cba.npvByRate.find((r) => r.rate === 0.10)?.npv ?? 0;

  // Calculate discounted totals at 10%
  const totalCostsDiscounted = cba.cashFlows.reduce((sum, cf) => {
    const discountFactor = 1 / Math.pow(1.10, cf.projectYear - 1);
    return sum + cf.totalCost * discountFactor;
  }, 0);
  const totalBenefitsDiscounted = cba.cashFlows.reduce((sum, cf) => {
    const discountFactor = 1 / Math.pow(1.10, cf.projectYear - 1);
    return sum + cf.totalBenefit * discountFactor;
  }, 0);

  // Chart data ----------------------------------------------------------------

  const costComponentsData = cba.cashFlows.map((cf) => ({
    year: `Y${cf.projectYear}`,
    implementation: cf.implCost,
    maintenance: cf.maintCost,
    constraints: cf.constraintCost,
  }));

  const npvSensData = cba.npvByRate.map((r) => ({
    rate: `${(r.rate * 100).toFixed(0)}%`,
    npv: r.npv,
  }));

  // ---------------------------------------------------------------------------
  return (
    <div className="cba-method-view">

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <div className="cba-kpi-row">
        <KpiCard

          label="NPV (10% discount)"
          value={fmtUSD(npv10)}
          sub="20-year net present value"
          variant={npv10 >= 0 ? "positive" : "negative"}
        />
        <KpiCard
          label="BCR"
          value={cba.bcr.toFixed(2)}
          sub="Benefit-cost ratio"
          variant={cba.bcr >= 1 ? "positive" : "negative"}
        />
        <KpiCard
          label="IRR"
          value={cba.irr != null ? `${(cba.irr * 100).toFixed(1)}%` : "N/A"}
          sub="Internal rate of return"
          variant={cba.irr != null && cba.irr > 0.06 ? "positive" : "neutral"}
        />
        <KpiCard
          label="Payback Year"
          value={cba.paybackYear != null ? `Year ${cba.paybackYear}` : "Not reached"}
          sub="Discounted payback"
          variant={cba.paybackYear != null ? "positive" : "neutral"}
        />
      </div>

      {/* ── Charts (2-column row) ───────────────────────────────────────── */}
      <div className="cba-charts-2col">

        {/* Cost components stacked bar */}
        <div className="cba-chart-block">
          <h4 className="cba-chart-title">Annual Cost Components (US$/ha)</h4>
          <p className="cba-chart-hint">Stacked breakdown by implementation, maintenance, and constraint costs per year.</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={costComponentsData}
              barSize={10}
              barCategoryGap="22%"
              margin={{ top: 8, right: 16, left: 4, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e9" />
              <XAxis dataKey="year" tick={{ fontSize: 9 }} />
              <YAxis
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 9 }}
              />
              <Tooltip formatter={(v, name) => [fmtUSD(Number(v)), String(name)]} />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
              <Bar dataKey="implementation" name="Implementation" stackId="c" fill={PALETTE.impl} />
              <Bar dataKey="maintenance" name="Maintenance" stackId="c" fill={PALETTE.maint} />
              <Bar dataKey="constraints" name="Constraints" stackId="c" fill={PALETTE.constraint} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* NPV sensitivity */}
        <div className="cba-chart-block">
          <h4 className="cba-chart-title">NPV Sensitivity to Discount Rate</h4>
          <p className="cba-chart-hint">How different discount rate assumptions affect net present value.</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={npvSensData}
              barSize={32}
              margin={{ top: 8, right: 16, left: 4, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e9" />
              <XAxis dataKey="rate" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip formatter={(v) => [fmtUSD(Number(v)), "NPV"]} />
              <ReferenceLine y={0} stroke={PALETTE.netLine} strokeWidth={1.5} />
              <Bar
                dataKey="npv"
                name="NPV (US$/ha)"
                fill={PALETTE.npvPos}
                radius={[3, 3, 0, 0]}
                label={{
                  position: "top",
                  fontSize: 9,
                  formatter: (v: unknown) => {
                    const n = Number(v);
                    return `${n >= 0 ? "+" : ""}${(n / 1000).toFixed(0)}k`;
                  },
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>{/* end 2-col */}

      {/* ── Totals footer ─────────────────────────────────────────────────── */}
      <div className="cba-totals-row">
        <div className="cba-total-item">
          <span className="cba-total-label">Total Costs (undiscounted)</span>
          <span className="cba-total-value cba-total-value--cost">{fmtUSD(cba.totalCosts20yr)}</span>
        </div>
        <div className="cba-total-item">
          <span className="cba-total-label">Total Costs (disc. 10%)</span>
          <span className="cba-total-value cba-total-value--cost">{fmtUSD(totalCostsDiscounted)}</span>
        </div>
        <div className="cba-total-item">
          <span className="cba-total-label">Total Benefits (undiscounted)</span>
          <span className="cba-total-value cba-total-value--benefit">{fmtUSD(cba.totalBenefits20yr)}</span>
        </div>
        <div className="cba-total-item">
          <span className="cba-total-label">Total Benefits (disc. 10%)</span>
          <span className="cba-total-value cba-total-value--benefit">{fmtUSD(totalBenefitsDiscounted)}</span>
        </div>
      </div>

    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

interface KpiProps {
  label: string;
  value: string;
  sub: string;
  variant: "positive" | "negative" | "neutral";
}

function KpiCard({ label, value, sub, variant }: KpiProps) {
  return (
    <div className={`cba-kpi-card cba-kpi-card--${variant}`}>
      <div className="cba-kpi-label">{label}</div>
      <div className="cba-kpi-value">{value}</div>
      <div className="cba-kpi-sub">{sub}</div>
    </div>
  );
}
