/**
 * Cost-Benefit Analysis (CBA) computation and Excel export.
 *
 * Reads all user-provided data from the questionnaire form and computes
 * NPV, IRR, BCR, and 20-year cash flow for each answered method.
 *
 * External parameters (discount rates, carbon price, sequestration curves)
 * use sensible defaults and are clearly separated.
 */

import type { RestorationModel, MethodType, MethodCostEntry } from "../types";
import * as XLSX from "xlsx";

// ---------------------------------------------------------------------------
// External parameters (NOT in questionnaire)
// ---------------------------------------------------------------------------

const DISCOUNT_RATES = [0.03, 0.06, 0.08, 0.10, 0.12];
const DEFAULT_DISCOUNT_RATE = 0.06;

/** Carbon price US$/tCO2 — default for main analysis + range for sensitivity */
const CARBON_PRICE = 10;

/**
 * Carbon sequestration by ecosystem (tCO2/ha/yr).
 * Literature-based rough averages. These are the mean annual values
 * over a 20-year restoration horizon.
 */
const CARBON_SEQ: Record<string, number> = {
  "Tropical Forest": 12.0,
  "Subtropical Forest": 9.0,
  "Savanna or Dry Forest": 5.0,
  "Mangrove": 8.0,
  "Mountaine Forest": 7.0,
  "Arid or Semi-Arid Zones": 2.5,
};

/** Method-specific carbon multiplier relative to full seedling planting (=1.0) */
const METHOD_CARBON_MULT: Record<string, number> = {
  anr_30: 0.65,
  anr_30_ntfp: 0.65,
  seed_dispersal: 0.80,
  seed_dispersal_ntfp: 0.80,
  seedling_planting: 1.0,
  seedling_planting_ntfp: 1.0,
};

/** NTFP maturation lag — years before revenue starts */
const NTFP_LAG_YEARS = 4;

const METHOD_LABELS: Record<string, string> = {
  anr_30: "ANR/50% Enrichment",
  anr_30_ntfp: "ANR/50% Enrichment (NTFP)",
  seed_dispersal: "Seed Dispersal",
  seed_dispersal_ntfp: "Seed Dispersal (NTFP)",
  seedling_planting: "Full Seedling Plantation",
  seedling_planting_ntfp: "Full Seedling Plantation (NTFP)",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface YearCashFlow {
  year: number;
  implCost: number;
  maintCost: number;
  constraintCost: number;
  totalCost: number;
  ntfpRevenue: number;
  carbonBenefit: number;
  totalBenefit: number;
  netFlow: number;
  cumulativeNet: number;
  discountedNet: number;
  cumulativeDiscountedNet: number;
}

interface MethodCBA {
  methodId: string;
  methodLabel: string;
  isNtfp: boolean;
  cashFlows: YearCashFlow[];
  npvByRate: { rate: number; npv: number }[];
  irr: number | null;
  bcr: number;
  paybackYear: number | null;
  totalCosts20yr: number;
  totalBenefits20yr: number;
  carbonSeqRate: number;
  costPerTCO2: number | null;
}

// ---------------------------------------------------------------------------
// Core computations
// ---------------------------------------------------------------------------

function getCarbon(ecosystem: string): number {
  // Try exact match, then partial match
  if (CARBON_SEQ[ecosystem]) return CARBON_SEQ[ecosystem];
  const key = Object.keys(CARBON_SEQ).find((k) =>
    ecosystem.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(ecosystem.toLowerCase())
  );
  return key ? CARBON_SEQ[key] : 6.0; // fallback
}

/**
 * Compute NPV at a given rate.
 */
function computeNPV(cashFlows: YearCashFlow[], rate: number): number {
  return cashFlows.reduce((sum, cf) => sum + cf.netFlow / Math.pow(1 + rate, cf.year), 0);
}

/**
 * Compute IRR using bisection method.
 */
function computeIRR(cashFlows: YearCashFlow[]): number | null {
  let lo = -0.5, hi = 5.0;
  const npvAt = (r: number) => cashFlows.reduce((s, cf) => s + cf.netFlow / Math.pow(1 + r, cf.year), 0);

  // Check if IRR exists (sign change)
  if (npvAt(lo) * npvAt(hi) > 0) return null;

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (npvAt(mid) > 0) lo = mid; else hi = mid;
    if (Math.abs(hi - lo) < 1e-8) break;
  }
  const result = (lo + hi) / 2;
  return isFinite(result) ? result : null;
}

/**
 * Build 20-year cash flow for one method.
 */
function buildCashFlows(
  method: MethodCostEntry,
  methodId: string,
  data: RestorationModel,
  discountRate: number,
): YearCashFlow[] {
  const horizon = data.timeHorizon || 20;
  const flows: YearCashFlow[] = [];

  // --- COSTS ---
  const implCostTotal = method.implementationCost || 0;
  const maintCostTotal = method.maintenanceCost || 0;
  const intMaintStart = method.intensiveMaintenanceStartYear || 0;
  const intMaintEnd = method.intensiveMaintenanceEndYear || 0;
  const intMaintCost = method.intensiveMaintenanceCost || 0;

  // Distribute maintenance: intensive years get proportionally more
  const maintYears = horizon - 1; // years 1..19
  const intMaintYears = intMaintEnd > intMaintStart ? intMaintEnd - intMaintStart + 1 : 0;
  const normalMaintYears = maintYears - intMaintYears;

  // Intensive maintenance cost is part of total maintenance
  const normalMaintTotal = Math.max(0, maintCostTotal - intMaintCost);
  const normalMaintPerYear = normalMaintYears > 0 ? normalMaintTotal / normalMaintYears : 0;
  const intMaintPerYear = intMaintYears > 0 ? intMaintCost / intMaintYears : 0;

  // --- CONSTRAINT COSTS (distribute over horizon) ---
  const ctx = data.contextVariables;
  const fireTotal = (ctx?.fireRisk?.cost || 0) * (ctx?.fireRisk?.occurrences || 0);
  const fenceTotal = (ctx?.grazingPressure?.cost || 0) * (ctx?.grazingPressure?.occurrences || 0);
  const weedTotal = (ctx?.invasiveSpeciesPressure?.cost || 0) * (ctx?.invasiveSpeciesPressure?.occurrences || 0);
  const antTotal = (ctx?.antInfestation?.cost || 0) * (ctx?.antInfestation?.occurrences || 0);

  // Fire: spread evenly over horizon
  const firePerYear = fireTotal / horizon;
  // Fencing: 70% in year 0, 30% spread over remaining years
  const fenceYear0 = fenceTotal * 0.7;
  const fencePerYearMaint = (fenceTotal * 0.3) / Math.max(1, maintYears);
  // Weed: spread evenly over horizon
  const weedPerYear = weedTotal / horizon;
  // Ant control: spread evenly over horizon
  const antPerYear = antTotal / horizon;

  // --- BENEFITS ---
  const isNtfp = methodId.endsWith("_ntfp");
  const ntfpRevenueTotal = isNtfp ? (method.ntfpRevenue || 0) : 0;
  // Annualize NTFP revenue over revenue-producing years
  const ntfpRevenueYears = Math.max(1, horizon - NTFP_LAG_YEARS);
  const ntfpPerYear = ntfpRevenueTotal / ntfpRevenueYears;

  const baseCarbon = getCarbon(data.ecosystem);
  const carbonMult = METHOD_CARBON_MULT[methodId] || 0.75;
  // Carbon ramps up: year t gets t/horizon fraction of peak
  const carbonPeak = baseCarbon * carbonMult;

  let cumNet = 0;
  let cumDiscNet = 0;

  for (let t = 0; t < horizon; t++) {
    const isImpl = t === 0;
    const implCost = isImpl ? implCostTotal : 0;

    let maintCost = 0;
    if (t > 0) {
      const yr = t + 1; // year number (1-based for matching intMaint range)
      if (intMaintYears > 0 && yr >= intMaintStart && yr <= intMaintEnd) {
        maintCost = intMaintPerYear;
      } else {
        maintCost = normalMaintPerYear;
      }
    }

    const constraintCost =
      (isImpl ? fenceYear0 : fencePerYearMaint) + firePerYear + weedPerYear + antPerYear;

    const totalCost = implCost + maintCost + constraintCost;

    // NTFP revenue starts after lag
    const ntfpRev = isNtfp && t >= NTFP_LAG_YEARS ? ntfpPerYear : 0;

    // Carbon benefit ramps linearly
    const carbonSeqThisYear = carbonPeak * Math.min(1, (t + 1) / 10);
    const carbonBen = carbonSeqThisYear * CARBON_PRICE;

    const totalBenefit = ntfpRev + carbonBen;
    const netFlow = totalBenefit - totalCost;
    cumNet += netFlow;

    const discFactor = Math.pow(1 + discountRate, t);
    const discNet = netFlow / discFactor;
    cumDiscNet += discNet;

    flows.push({
      year: t,
      implCost,
      maintCost,
      constraintCost,
      totalCost,
      ntfpRevenue: ntfpRev,
      carbonBenefit: carbonBen,
      totalBenefit,
      netFlow,
      cumulativeNet: cumNet,
      discountedNet: discNet,
      cumulativeDiscountedNet: cumDiscNet,
    });
  }

  return flows;
}

/**
 * Compute full CBA for one method.
 */
function computeMethodCBA(
  methodId: string,
  method: MethodCostEntry,
  data: RestorationModel,
): MethodCBA {
  const cashFlows = buildCashFlows(method, methodId, data, DEFAULT_DISCOUNT_RATE);
  const isNtfp = methodId.endsWith("_ntfp");

  const npvByRate = DISCOUNT_RATES.map((rate) => ({
    rate,
    npv: computeNPV(cashFlows, rate),
  }));

  const irr = computeIRR(cashFlows);

  const totalCosts = cashFlows.reduce((s, cf) => s + cf.totalCost / Math.pow(1 + DEFAULT_DISCOUNT_RATE, cf.year), 0);
  const totalBenefits = cashFlows.reduce((s, cf) => s + cf.totalBenefit / Math.pow(1 + DEFAULT_DISCOUNT_RATE, cf.year), 0);
  const bcr = totalCosts > 0 ? totalBenefits / totalCosts : 0;

  // Payback: first year where cumulative discounted net >= 0
  const paybackYear = cashFlows.find((cf) => cf.cumulativeDiscountedNet >= 0)?.year ?? null;

  const carbonSeqRate = getCarbon(data.ecosystem) * (METHOD_CARBON_MULT[methodId] || 0.75);
  const totalCarbonPV = cashFlows.reduce(
    (s, cf) => s + cf.carbonBenefit / CARBON_PRICE / Math.pow(1 + DEFAULT_DISCOUNT_RATE, cf.year),
    0,
  );
  const costPerTCO2 = totalCarbonPV > 0 ? totalCosts / totalCarbonPV : null;

  return {
    methodId,
    methodLabel: METHOD_LABELS[methodId] || methodId,
    isNtfp,
    cashFlows,
    npvByRate,
    irr,
    bcr,
    paybackYear,
    totalCosts20yr: cashFlows.reduce((s, cf) => s + cf.totalCost, 0),
    totalBenefits20yr: cashFlows.reduce((s, cf) => s + cf.totalBenefit, 0),
    carbonSeqRate,
    costPerTCO2,
  };
}

// ---------------------------------------------------------------------------
// Excel export
// ---------------------------------------------------------------------------

const METHOD_KEYS: MethodType[] = [
  "anr_30", "anr_30_ntfp",
  "seed_dispersal", "seed_dispersal_ntfp",
  "seedling_planting", "seedling_planting_ntfp",
];

function fmt(n: number): string {
  return Number(n.toFixed(2)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Sanitize string for use as Excel sheet name (max 31 chars, no \/?*[]) */
function safeSheetName(name: string): string {
  return name.replace(/[\\\/?*\[\]]/g, "-").substring(0, 31);
}

/**
 * Export full CBA as multi-sheet Excel workbook.
 */
export function exportCBAToXlsx(data: RestorationModel, filename: string): void {
  const disabled = new Set(data.disabledMethods ?? []);
  const answered = METHOD_KEYS.filter((mk) => !disabled.has(mk));

  if (answered.length === 0) return;

  const results = answered.map((mk) => {
    const method = data.methodCosts?.[mk];
    if (!method) return null;
    return computeMethodCBA(mk, method, data);
  }).filter(Boolean) as MethodCBA[];

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Parameters ──────────────────────────────────────────────
  const paramRows = [
    ["COST-BENEFIT ANALYSIS — KEY PARAMETERS", ""],
    ["", ""],
    ["Respondent", data.respondentName ?? ""],
    ["User", data.userName ?? ""],
    ["Date", data.dataCollectionDate ?? ""],
    ["Ecosystem", data.ecosystem ?? ""],
    ["Country", data.country ?? ""],
    ["City", data.city ?? ""],
    ["Time Horizon (years)", data.timeHorizon ?? 20],
    ["", ""],
    ["EXTERNAL ASSUMPTIONS", ""],
    ["Default Discount Rate", `${(DEFAULT_DISCOUNT_RATE * 100).toFixed(0)}%`],
    ["Carbon Price (US$/tCO2)", CARBON_PRICE],
    ["Carbon Seq. Rate (tCO2/ha/yr)", getCarbon(data.ecosystem)],
    ["NTFP Maturation Lag (years)", NTFP_LAG_YEARS],
    ["", ""],
    ["CONTEXT CONSTRAINTS", "Unit Cost", "Occurrences / Area", "Total Cost"],
    [
      "Firebreak / Fire Risk",
      data.contextVariables?.fireRisk?.cost ?? 0,
      data.contextVariables?.fireRisk?.occurrences ?? 0,
      (data.contextVariables?.fireRisk?.cost ?? 0) * (data.contextVariables?.fireRisk?.occurrences ?? 0),
    ],
    [
      "Fencing / Grazing Pressure",
      data.contextVariables?.grazingPressure?.cost ?? 0,
      data.contextVariables?.grazingPressure?.occurrences ?? 0,
      (data.contextVariables?.grazingPressure?.cost ?? 0) * (data.contextVariables?.grazingPressure?.occurrences ?? 0),
    ],
    [
      "Weed Control / Invasive Species",
      data.contextVariables?.invasiveSpeciesPressure?.cost ?? 0,
      data.contextVariables?.invasiveSpeciesPressure?.occurrences ?? 0,
      (data.contextVariables?.invasiveSpeciesPressure?.cost ?? 0) * (data.contextVariables?.invasiveSpeciesPressure?.occurrences ?? 0),
    ],
    [
      "Ant Control / Ant Infestation",
      data.contextVariables?.antInfestation?.cost ?? 0,
      data.contextVariables?.antInfestation?.occurrences ?? 0,
      (data.contextVariables?.antInfestation?.cost ?? 0) * (data.contextVariables?.antInfestation?.occurrences ?? 0),
    ],
  ];
  const wsParams = XLSX.utils.aoa_to_sheet(paramRows);
  wsParams["!cols"] = [{ wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsParams, "Parameters");

  // ── Sheet 2: Summary (all methods compared) ──────────────────────────
  const summaryHeaders = [
    "Method",
    "Impl. Cost (US$/ha)",
    "Maint. Cost (US$/ha)",
    "Total Cost 20yr (US$/ha)",
    "NTFP Revenue 20yr (US$/ha)",
    "Carbon Benefit 20yr (US$/ha)",
    "Total Benefits 20yr (US$/ha)",
    `NPV @${(DEFAULT_DISCOUNT_RATE * 100).toFixed(0)}% (US$/ha)`,
    "IRR",
    "BCR",
    "Payback (year)",
    "Carbon Seq. (tCO2/ha/yr)",
    "Cost per tCO2 (US$)",
    ...DISCOUNT_RATES.map((r) => `NPV @${(r * 100).toFixed(0)}%`),
  ];

  const summaryRows = results.map((r) => [
    r.methodLabel,
    fmt(r.cashFlows[0]?.implCost ?? 0),
    fmt(r.totalCosts20yr - (r.cashFlows[0]?.implCost ?? 0)),
    fmt(r.totalCosts20yr),
    fmt(r.cashFlows.reduce((s, cf) => s + cf.ntfpRevenue, 0)),
    fmt(r.cashFlows.reduce((s, cf) => s + cf.carbonBenefit, 0)),
    fmt(r.totalBenefits20yr),
    fmt(r.npvByRate.find((n) => n.rate === DEFAULT_DISCOUNT_RATE)?.npv ?? 0),
    r.irr !== null ? `${(r.irr * 100).toFixed(1)}%` : "N/A",
    r.bcr.toFixed(2),
    r.paybackYear !== null ? `Year ${r.paybackYear}` : "N/A",
    r.carbonSeqRate.toFixed(1),
    r.costPerTCO2 !== null ? fmt(r.costPerTCO2) : "N/A",
    ...r.npvByRate.map((n) => fmt(n.npv)),
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
  wsSummary["!cols"] = summaryHeaders.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // ── Sheet 3+: Cash Flow per method ───────────────────────────────────
  for (const r of results) {
    const cfHeaders = [
      "Year",
      "Implementation Cost",
      "Maintenance Cost",
      "Constraint Cost",
      "Total Cost",
      "NTFP Revenue",
      "Carbon Benefit",
      "Total Benefits",
      "Net Cash Flow",
      "Cumulative Net",
      "Discounted Net Flow",
      "Cumulative Discounted",
    ];

    const cfRows = r.cashFlows.map((cf) => [
      cf.year,
      fmt(cf.implCost),
      fmt(cf.maintCost),
      fmt(cf.constraintCost),
      fmt(cf.totalCost),
      fmt(cf.ntfpRevenue),
      fmt(cf.carbonBenefit),
      fmt(cf.totalBenefit),
      fmt(cf.netFlow),
      fmt(cf.cumulativeNet),
      fmt(cf.discountedNet),
      fmt(cf.cumulativeDiscountedNet),
    ]);

    // Add summary row at bottom
    cfRows.push([]);
    cfRows.push(["KEY INDICATORS", ""]);
    cfRows.push(["NPV (6%)", fmt(r.npvByRate.find((n) => n.rate === DEFAULT_DISCOUNT_RATE)?.npv ?? 0)]);
    cfRows.push(["IRR", r.irr !== null ? `${(r.irr * 100).toFixed(1)}%` : "N/A"]);
    cfRows.push(["BCR", r.bcr.toFixed(2)]);
    cfRows.push(["Payback Year", r.paybackYear !== null ? r.paybackYear : "N/A"]);
    cfRows.push(["Cost per tCO2", r.costPerTCO2 !== null ? fmt(r.costPerTCO2) : "N/A"]);

    const wsCF = XLSX.utils.aoa_to_sheet([cfHeaders, ...cfRows]);
    wsCF["!cols"] = cfHeaders.map(() => ({ wch: 20 }));

    const sheetName = safeSheetName(r.methodLabel);
    XLSX.utils.book_append_sheet(wb, wsCF, sheetName);
  }

  // ── Sheet: NPV Sensitivity ──────────────────────────────────────────
  const sensHeaders = ["Method", ...DISCOUNT_RATES.map((r) => `NPV @${(r * 100).toFixed(0)}%`)];
  const sensRows = results.map((r) => [
    r.methodLabel,
    ...r.npvByRate.map((n) => fmt(n.npv)),
  ]);
  const wsSens = XLSX.utils.aoa_to_sheet([sensHeaders, ...sensRows]);
  wsSens["!cols"] = sensHeaders.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, wsSens, "NPV Sensitivity");

  XLSX.writeFile(wb, filename);
}
