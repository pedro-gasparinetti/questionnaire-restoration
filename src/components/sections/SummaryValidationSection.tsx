/**
 * SummaryValidationSection – Automatic summary & consistency check
 *
 * Generates one summary block per restoration method with:
 *   Section 1 — Favorable Scenario (implementation + maintenance)
 *   Section 2 — Additional Context Variables & Constraints
 *   Section 3 — Unfavourable Scenario (computed vs declared)
 *   Production Factor Breakdown (weighted distributions)
 *   Mathematical Consistency Check (collapsible)
 *
 * All values are auto-computed from form state via useMemo.
 */

import { useState } from "react";
import { useWatch, useFormContext } from "react-hook-form";
import { CheckCircle, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import type { RestorationModelFormData } from "../../schemas";
import type { ComputedFields, MethodCostEntry, FactorShares, ContextConstraintEntry } from "../../types";
import { METHOD_TABS } from "../../constants";
import { CollapsibleSection, SummaryTable } from "../ui";
import type { SummaryRow } from "../ui";
import { formatUSD } from "../../utils";

// ---------------------------------------------------------------------------
// Constants for constraint labels & units
// ---------------------------------------------------------------------------

const CONSTRAINT_META: Record<string, { label: string; unit: string }> = {
  fireRisk:                  { label: "Firebreak / Fire Risk",                    unit: "US$/ha" },
  grazingPressure:           { label: "Fencing / Grazing Pressure",               unit: "US$/km" },
  invasiveSpeciesPressure:   { label: "Weed Control / Invasive Species Pressure", unit: "US$/ha" },
  humanEncroachment:         { label: "Monitoring / Human Encroachment",          unit: "US$/ha" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(v: number): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(v: number): string {
  return `${fmt(v)}%`;
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
// Props
// ---------------------------------------------------------------------------

interface Props {
  values: RestorationModelFormData;
  computed: ComputedFields;
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
    cost: number;
    appliesToImpl: boolean;
    appliesToMaint: boolean;
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

export function SummaryValidationSection(_props: Props) {
  const { control } = useFormContext<RestorationModelFormData>();
  const [consistencyOpen, setConsistencyOpen] = useState(false);

  // useWatch subscribes to nested field changes and triggers re-renders
  const methodCosts = useWatch({ control, name: "methodCosts" });
  const contextVariables = useWatch({ control, name: "contextVariables" });

  const methodSummaries: MethodSummary[] = (() => {
    const ctx = contextVariables ?? {};

    return METHOD_TABS.map((tab) => {
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
      const constraintKeys = ["fireRisk", "grazingPressure", "invasiveSpeciesPressure", "humanEncroachment"] as const;
      const constraints = constraintKeys.map((k) => {
        const c: ContextConstraintEntry = (ctx as any)[k] ?? {
          cost: 0,
          appliesToImplementation: false,
          appliesToMaintenance: false,
          distribution: { labor: 0, materials: 0, machinery: 0 },
        };
        const meta = CONSTRAINT_META[k] ?? { label: k, unit: "US$/ha" };
        return {
          key: k,
          label: meta.label,
          unit: meta.unit,
          cost: Number(c.cost) || 0,
          appliesToImpl: !!c.appliesToImplementation,
          appliesToMaint: !!c.appliesToMaintenance,
          distribution: c.distribution ?? { labor: 0, materials: 0, machinery: 0 },
        };
      });

      const totalAdditional = constraints.reduce((s, c) => s + c.cost, 0);
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
          .filter((c) => c.cost > 0)
          .map((c) => ({ cost: c.cost, shares: c.distribution })),
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
    >
      {methodSummaries.map((m) => (
        <MethodSummaryBlock key={m.id} summary={m} />
      ))}

      {/* Mathematical Consistency Check (collapsible) */}
      <div className="summary-consistency">
        <button
          type="button"
          className="summary-consistency-toggle"
          onClick={() => setConsistencyOpen((o) => !o)}
        >
          {consistencyOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          Mathematical Consistency Check
        </button>
        {consistencyOpen && (
          <div className="summary-consistency-body">
            {methodSummaries.map((m) => (
              <ConsistencyBlock key={m.id} summary={m} />
            ))}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

// ---------------------------------------------------------------------------
// Per-method summary block
// ---------------------------------------------------------------------------

function MethodSummaryBlock({ summary: m }: { summary: MethodSummary }) {
  return (
    <div className="summary-method-block">
      <h4 className="summary-method-title">{m.title}</h4>

      {/* Section 1 — Favorable Scenario */}
      <SummaryTable
        caption="Favorable Scenario"
        headers={["Cost Component", "Value (US$/ha)"]}
        rows={[
          { label: "Basic Implementation Cost (Year 1)", values: [formatUSD(m.implCost)] },
          { label: "Basic Maintenance Cost (Years 2–20)", values: [formatUSD(m.maintCost)] },
          {
            label: "Total Favorable Scenario Cost",
            values: [formatUSD(m.totalFavorable)],
            className: "summary-table-total",
          },
        ]}
      />

      {/* Section 2 — Additional Context Variables & Constraints */}
      <SummaryTable
        caption="Additional Context Variables &amp; Constraints"
        headers={["Constraint", "Cost", "Phase"]}
        rows={[
          ...m.constraints.map((c) => ({
            label: c.label,
            values: [
              c.cost > 0 ? `${fmt(c.cost)} ${c.unit}` : "—",
              c.cost > 0
                ? [c.appliesToImpl && "Impl.", c.appliesToMaint && "Maint."]
                    .filter(Boolean)
                    .join(" + ") || "—"
                : "—",
            ],
          })),
          {
            label: "Total Additional Cost",
            values: [formatUSD(m.totalAdditional), ""],
            className: "summary-table-total",
          },
        ]}
      />

      {/* Section 3 — Unfavourable Scenario */}
      <UnfavourableBlock summary={m} />

      {/* Production Factor Breakdown */}
      <FactorBreakdownBlock summary={m} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unfavourable Scenario table
// ---------------------------------------------------------------------------

function UnfavourableBlock({ summary: m }: { summary: MethodSummary }) {
  return (
    <SummaryTable
      caption="Unfavourable Scenario"
      headers={["Cost Component", "Value (US$/ha)"]}
      rows={[
        { label: "Total Favorable Scenario Cost", values: [formatUSD(m.totalFavorable)] },
        { label: "Total Additional Cost (Constraints)", values: [formatUSD(m.totalAdditional)] },
        {
          label: "Computed Unfavourable Cost",
          values: [formatUSD(m.computedUnfavourable)],
          className: "summary-table-total",
        },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Production Factor Breakdown table
// ---------------------------------------------------------------------------

function FactorBreakdownBlock({ summary: m }: { summary: MethodSummary }) {
  const favOk = sharesSumOk(m.favorableShares);
  const unfavOk = sharesSumOk(m.unfavourableShares);

  const mkRow = (
    label: string,
    shares: FactorShares,
    totalCost: number,
    ok: boolean
  ): SummaryRow => ({
    label,
    values: [
      pct(shares.labor),
      pct(shares.materials),
      pct(shares.machinery),
      formatUSD(totalCost * (Number(shares.labor) || 0) / 100),
      formatUSD(totalCost * (Number(shares.materials) || 0) / 100),
      formatUSD(totalCost * (Number(shares.machinery) || 0) / 100),
    ],
    className: ok ? "" : "summary-row-warn",
  });

  return (
    <>
      <SummaryTable
        caption="Production Factor Breakdown"
        headers={[
          "Scenario",
          "Labor (%)",
          "Materials (%)",
          "Machinery (%)",
          "Labor (US$/ha)",
          "Materials (US$/ha)",
          "Machinery (US$/ha)",
        ]}
        rows={[
          mkRow("Favorable Scenario", m.favorableShares, m.totalFavorable, favOk),
          mkRow("Unfavourable Scenario", m.unfavourableShares, m.computedUnfavourable, unfavOk),
        ]}
      />
      {!favOk && (
        <p className="summary-warning">
          <AlertTriangle size={14} /> Favorable scenario factor shares do not sum to 100%.
          Please review cost distributions in the Method Costs section.
        </p>
      )}
      {!unfavOk && (
        <p className="summary-warning">
          <AlertTriangle size={14} /> Unfavourable scenario factor shares do not sum to 100%.
          Please review constraint cost distributions.
        </p>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Mathematical Consistency Check
// ---------------------------------------------------------------------------

function ConsistencyBlock({ summary: m }: { summary: MethodSummary }) {
  const favSumOk =
    Math.abs(m.totalFavorable - (m.implCost + m.maintCost)) < 0.01;
  const unfavSumOk =
    Math.abs(m.computedUnfavourable - (m.totalFavorable + m.totalAdditional)) < 0.01;
  const favSharesOk = sharesSumOk(m.favorableShares);
  const unfavSharesOk = sharesSumOk(m.unfavourableShares);

  const checks = [
    {
      label: `Favorable Cost = Implementation + Maintenance = ${fmt(m.implCost)} + ${fmt(m.maintCost)} = ${fmt(m.totalFavorable)}`,
      ok: favSumOk,
    },
    {
      label: `Unfavourable Cost = Favorable + Additional = ${fmt(m.totalFavorable)} + ${fmt(m.totalAdditional)} = ${fmt(m.computedUnfavourable)}`,
      ok: unfavSumOk,
    },
    {
      label: `Favorable factor shares sum = ${fmt(sharesSum(m.favorableShares))}%`,
      ok: favSharesOk,
    },
    {
      label: `Unfavourable factor shares sum = ${fmt(sharesSum(m.unfavourableShares))}%`,
      ok: unfavSharesOk,
    },
  ];

  return (
    <div className="consistency-method">
      <h5>{m.title}</h5>
      <ul className="consistency-checks">
        {checks.map((c, i) => (
          <li key={i} className={c.ok ? "consistency-ok" : "consistency-warn"}>
            {c.ok ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            <span>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
