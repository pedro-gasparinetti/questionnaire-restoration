/**
 * SummaryValidationSection – Automatic summary & consistency check
 *
 * Generates one summary block per restoration method with:
 *   Section 1 — Favorable Scenario (implementation + maintenance)
 *   Section 2 — Context Constraints & Additional Costs
 *   Section 3 — Unfavourable Scenario (computed vs declared)
 *   Production Factor Breakdown (weighted distributions)
 *   Mathematical Consistency Check (collapsible)
 *
 * All values are auto-computed from form state via useMemo.
 */

import { useWatch, useFormContext } from "react-hook-form";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from "recharts";
import type { RestorationModelFormData } from "../../schemas";
import type { MethodCostEntry, FactorShares, ContextConstraintEntry } from "../../types";
import { METHOD_TABS } from "../../constants";
import { CollapsibleSection, SummaryTable } from "../ui";
import { formatUSD } from "../../utils";

// ---------------------------------------------------------------------------
// Constants for constraint labels & units
// ---------------------------------------------------------------------------

const CONSTRAINT_META: Record<string, { label: string; unit: string }> = {
  fireRisk:                  { label: "Firebreak / Fire Risk",                    unit: "US$/ha" },
  grazingPressure:           { label: "Fencing / Grazing Pressure",               unit: "US$/km" },
  invasiveSpeciesPressure:   { label: "Weed Control / Invasive Species Pressure", unit: "US$/ha" },
  pestControl:               { label: "Pest Control / Pest Infestation Risk",      unit: "US$/ha" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(v: number): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sharesSum(s: FactorShares): number {
  return (Number(s.labor) || 0) + (Number(s.materials) || 0) + (Number(s.machinery) || 0);
}

function sharesSumOk(s: FactorShares): boolean {
  return Math.abs(sharesSum(s) - 100) < 0.01;
}

/** Weighted-average factor shares across multiple cost components. */
function weightedShares(
  components: { cost: number; shares: FactorShares }[]
): FactorShares {
  const total = components.reduce((s, c) => s + (c.cost || 0), 0);
  if (total === 0) return { labor: 0, materials: 0, machinery: 0 };
  let labor = 0, materials = 0, machinery = 0;
  for (const c of components) {
    const w = (c.cost || 0) / total;
    labor    += (Number(c.shares.labor)     || 0) * w;
    materials += (Number(c.shares.materials) || 0) * w;
    machinery += (Number(c.shares.machinery) || 0) * w;
  }
  return { labor, materials, machinery };
}

// ---------------------------------------------------------------------------
// Per-method summary data derived from form state
// ---------------------------------------------------------------------------

interface MethodSummary {
  id: string;
  title: string;
  implCost: number;
  maintCost: number;
  totalFavorable: number;
  implDist: FactorShares;
  maintDist: FactorShares;
  constraints: {
    key: string;
    label: string;
    unit: string;
    unitCost: number;
    occurrences: number;
    firebreakArea?: number;
    totalCost: number;
    distribution: FactorShares;
  }[];
  totalAdditional: number;
  computedUnfavourable: number;
  favorableShares: FactorShares;
  unfavourableShares: FactorShares;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SummaryValidationSection() {
  const { control } = useFormContext<RestorationModelFormData>();

  // useWatch subscribes to nested field changes and triggers re-renders
  const methodCosts = useWatch({ control, name: "methodCosts" });
  const contextVariables = useWatch({ control, name: "contextVariables" });
  const disabledMethods: string[] = (useWatch({ control, name: "disabledMethods" }) ?? []) as string[];

  const methodSummaries: MethodSummary[] = (() => {
    const ctx = contextVariables ?? {};

    return METHOD_TABS.filter((tab) => !disabledMethods.includes(tab.id)).map((tab) => {
      const entry: MethodCostEntry = (methodCosts as any)?.[tab.id] ?? {
        implementationCost: 0,
        implementationDistribution: { labor: 0, materials: 0, machinery: 0 },
        maintenanceCost: 0,
        maintenanceDistribution: { labor: 0, materials: 0, machinery: 0 },
      };

      const implCost = Number(entry.implementationCost) || 0;
      const maintCost = Number(entry.maintenanceCost) || 0;
      const totalFavorable = implCost + maintCost;

      const implDist: FactorShares = entry.implementationDistribution ?? { labor: 0, materials: 0, machinery: 0 };
      const maintDist: FactorShares = entry.maintenanceDistribution ?? { labor: 0, materials: 0, machinery: 0 };

      // Context constraints
      const constraintKeys = ["fireRisk", "grazingPressure", "invasiveSpeciesPressure", "pestControl"] as const;
      const constraints = constraintKeys.map((k) => {
        const c: ContextConstraintEntry = (ctx as any)[k] ?? {
          cost: 0,
          occurrences: 0,
          distribution: { labor: 0, materials: 0, machinery: 0 },
        };
        const meta = CONSTRAINT_META[k] ?? { label: k, unit: "US$/ha" };
        const unitCost = Number(c.cost) || 0;
        const occurrences = Number(c.occurrences) || 0;
        return {
          key: k,
          label: meta.label,
          unit: meta.unit,
          unitCost,
          occurrences,
          firebreakArea: k === "fireRisk" ? (Number(c.firebreakArea) || 0) : undefined,
          totalCost: unitCost * occurrences,
          distribution: c.distribution ?? { labor: 0, materials: 0, machinery: 0 },
        };
      });

      const totalAdditional = constraints.reduce((s, c) => s + c.totalCost, 0);
      const computedUnfavourable = totalFavorable + totalAdditional;

      // Weighted factor shares — favorable
      const favorableShares = weightedShares([
        { cost: implCost, shares: implDist },
        { cost: maintCost, shares: maintDist },
      ]);

      // Weighted factor shares — unfavourable (base + constraints)
      const unfavourableComponents = [
        { cost: implCost, shares: implDist },
        { cost: maintCost, shares: maintDist },
        ...constraints
          .filter((c) => c.totalCost > 0)
          .map((c) => ({ cost: c.totalCost, shares: c.distribution })),
      ];
      const unfavourableShares = weightedShares(unfavourableComponents);

      return {
        id: tab.id,
        title: tab.title,
        implCost,
        maintCost,
        totalFavorable,
        implDist,
        maintDist,
        constraints,
        totalAdditional,
        computedUnfavourable,
        favorableShares,
        unfavourableShares,
      };
    });
  })();

  return (
    <CollapsibleSection
      title="Summary &amp; Validation"
      subtitle="Auto-generated summary — review data consistency before saving"
      defaultOpen={false}
      icon={<CheckCircle2 size={20} />}
      headerClassName="section-header--light"
    >
      {methodSummaries.map((m) => (
        <MethodSummaryBlock key={m.id} summary={m} />
      ))}
    </CollapsibleSection>
  );
}

// ---------------------------------------------------------------------------
// Per-method summary block
// ---------------------------------------------------------------------------

function MethodSummaryBlock({ summary: m }: { summary: MethodSummary }) {
  // ── Cost bar chart data (horizontal) ──────────────────────────────────
  const costBars = [
    { name: "Implementation", value: m.implCost, fill: "#2A4B46" },
    { name: "Maintenance", value: m.maintCost, fill: "#4E8465" },
    ...m.constraints
      .filter((c) => c.totalCost > 0)
      .map((c) => ({ name: c.label.split(" / ")[0], value: c.totalCost, fill: "#c0602a" })),
  ].filter((d) => d.value > 0);

  // ── Factor shares data (stacked horizontal bar) ───────────────────────
  const shareData = [
    {
      name: "Favorable",
      labor: Number(m.favorableShares.labor) || 0,
      materials: Number(m.favorableShares.materials) || 0,
      machinery: Number(m.favorableShares.machinery) || 0,
    },
    {
      name: "Unfavorable",
      labor: Number(m.unfavourableShares.labor) || 0,
      materials: Number(m.unfavourableShares.materials) || 0,
      machinery: Number(m.unfavourableShares.machinery) || 0,
    },
  ];

  const favOk = sharesSumOk(m.favorableShares);
  const unfavOk = sharesSumOk(m.unfavourableShares);

  return (
    <div className="summary-method-block">
      <h4 className="summary-method-title">{m.title}</h4>

      {/* ── Visual summary row ──────────────────────────────────────────── */}
      <div className="summary-charts-row">

        {/* Cost breakdown bar chart */}
        <div className="summary-chart-col">
          <p className="summary-chart-label">Cost Breakdown (US$/ha)</p>
          <ResponsiveContainer width="100%" height={Math.max(100, costBars.length * 36 + 24)}>
            <BarChart
              data={costBars}
              layout="vertical"
              margin={{ top: 2, right: 80, left: 8, bottom: 2 }}
              barSize={18}
            >
              <XAxis
                type="number"
                tickFormatter={(v: number) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`
                }
                tick={{ fontSize: 10 }}
              />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip formatter={(v) => [formatUSD(Number(v)), ""]} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {costBars.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Totals */}
          <div className="summary-cost-totals">
            <span>Favorable: <strong>{formatUSD(m.totalFavorable)}</strong></span>
            <span>Unfavorable: <strong>{formatUSD(m.computedUnfavourable)}</strong></span>
          </div>
        </div>

        {/* Factor shares stacked bar */}
        <div className="summary-chart-col">
          <p className="summary-chart-label">Production Factors (%)</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart
              data={shareData}
              layout="vertical"
              margin={{ top: 2, right: 24, left: 8, bottom: 2 }}
              barSize={22}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fontSize: 10 }}
              />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v, name) => [`${Number(v).toFixed(1)}%`, name]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="labor" stackId="f" fill="#4E8465" name="Labor" />
              <Bar dataKey="materials" stackId="f" fill="#A8C2B4" name="Materials" />
              <Bar dataKey="machinery" stackId="f" fill="#2A4B46" name="Machinery" />
            </BarChart>
          </ResponsiveContainer>
          {(!favOk || !unfavOk) && (
            <p className="summary-warning" style={{ marginTop: "0.35rem", marginBottom: 0 }}>
              <AlertTriangle size={13} />
              {!favOk ? " Favorable" : ""}
              {!favOk && !unfavOk ? " &" : ""}
              {!unfavOk ? " Unfavorable" : ""} factor shares don't sum to 100%.
            </p>
          )}
        </div>

      </div>{/* end summary-charts-row */}

      {/* Context Constraints & Additional Costs — kept as table (detailed data) */}
      <SummaryTable
        caption="Context Constraints &amp; Additional Costs"
        headers={["Constraint", "Unit Cost", "Occurrences / Area", "Firebreak Area (ha)", "Total Cost"]}
        rows={[
          ...m.constraints.map((c) => ({
            label: c.label,
            values: [
              c.unitCost > 0 ? `${fmt(c.unitCost)} ${c.unit}` : "—",
              c.occurrences > 0
                ? c.key === "grazingPressure"
                  ? `${c.occurrences} ha`
                  : `${c.occurrences}`
                : "—",
              c.key === "fireRisk" && c.firebreakArea ? `${c.firebreakArea} ha` : "—",
              c.totalCost > 0 ? formatUSD(c.totalCost) : "—",
            ],
          })),
          {
            label: "Total Additional Cost",
            values: ["", "", "", formatUSD(m.totalAdditional)],
            className: "summary-table-total",
          },
        ]}
      />
    </div>
  );
}

// (UnfavourableBlock and FactorBreakdownBlock replaced by inline charts in MethodSummaryBlock)
