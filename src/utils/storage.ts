/**
 * Local Storage persistence for saved Restoration Models.
 * This is a mock persistence layer — to be replaced by backend API calls
 * in a future iteration.
 */

import type { RestorationModel } from "../types";
import type { MethodType } from "../types";
import { STORAGE_KEY } from "../constants";
import * as XLSX from "xlsx";

export interface SavedModel {
  id: string;
  savedAt: string;
  data: RestorationModel;
}

/**
 * Load all saved models from local storage.
 */
export function loadModels(): SavedModel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedModel[];
  } catch {
    console.warn("Failed to load models from local storage.");
    return [];
  }
}

/**
 * Save a model to local storage. Generates a unique ID and timestamp.
 */
export function saveModel(data: RestorationModel): SavedModel {
  const models = loadModels();
  const entry: SavedModel = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    data,
  };
  models.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
  return entry;
}

/**
 * Delete a saved model by ID.
 */
export function deleteModel(id: string): void {
  const models = loadModels().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
}

/**
 * Export a model (or any object) as a downloadable JSON file.
 */
export function exportToJsonFile(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------

/**
 * Recursively flatten a nested object into an array of [key, value] pairs
 * using dot-notation for nested objects and bracket-notation for array items.
 */
function flattenObject(
  obj: unknown,
  prefix = "",
  rows: [string, string][] = []
): [string, string][] {
  if (obj === null || obj === undefined) {
    rows.push([prefix, ""]);
  } else if (Array.isArray(obj)) {
    if (obj.length === 0) {
      rows.push([prefix, ""]);
    } else {
      obj.forEach((item, i) => flattenObject(item, `${prefix}[${i}]`, rows));
    }
  } else if (typeof obj === "object") {
    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) =>
      flattenObject(v, prefix ? `${prefix}.${k}` : k, rows)
    );
  } else {
    rows.push([prefix, String(obj)]);
  }
  return rows;
}

/**
 * Escape a CSV cell value (wrap in quotes if it contains comma, quote, or newline).
 */
function csvCell(value: string): string {
  if (/[,"\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/**
 * Export a model as a downloadable two-row CSV file:
 * Row 1 = headers (dot-notation field names), Row 2 = values.
 */
export function exportToCsvFile(data: unknown, filename: string): void {
  const rows = flattenObject(data);
  const headers = rows.map(([k]) => csvCell(k)).join(",");
  const values  = rows.map(([, v]) => csvCell(v)).join(",");
  const csv = `${headers}\n${values}`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Excel (.xlsx) Export
// ---------------------------------------------------------------------------

const METHOD_KEYS: MethodType[] = [
  "anr_30", "anr_30_ntfp",
  "seed_dispersal", "seed_dispersal_ntfp",
  "seedling_planting", "seedling_planting_ntfp",
];

const METHOD_LABELS: Record<string, string> = {
  anr_30: "ANR/50% Enrichment",
  anr_30_ntfp: "ANR/50% Enrichment (NTFP)",
  seed_dispersal: "Seed Dispersal",
  seed_dispersal_ntfp: "Seed Dispersal (NTFP)",
  seedling_planting: "Full Seedling Plantation",
  seedling_planting_ntfp: "Full Seedling Plantation (NTFP)",
};

const CONSTRAINT_KEYS = ["fireRisk", "grazingPressure", "invasiveSpeciesPressure", "antInfestation"] as const;
const CONSTRAINT_SHORT: Record<string, string> = {
  fireRisk: "Fire",
  grazingPressure: "Fence",
  invasiveSpeciesPressure: "Weed",
  antInfestation: "Ant",
};

type Row = Record<string, string | number>;

/**
 * Build the shared (non-method-specific) columns that repeat on every row.
 */
function buildSharedColumns(d: RestorationModel): Row {
  const row: Row = {};

  // Identification
  row["Respondent"] = d.respondentName ?? "";
  row["User"] = d.userName ?? "";
  row["Date"] = d.dataCollectionDate ?? "";
  row["GPS"] = d.gpsCoordinates ?? "";
  row["Ecosystem"] = d.ecosystem ?? "";
  row["Country"] = d.country ?? "";
  row["City"] = d.city ?? "";
  row["Horizon_yr"] = d.timeHorizon ?? 20;

  // Context constraints (shared across all methods)
  for (const ck of CONSTRAINT_KEYS) {
    const c = d.contextVariables?.[ck];
    const s = CONSTRAINT_SHORT[ck];
    if (!c) continue;

    row[`${s}_UnitCost`] = c.cost ?? 0;
    row[ck === "grazingPressure" ? `${s}_Area_ha` : `${s}_Occur`] = c.occurrences ?? 0;
    if (ck === "fireRisk") {
      row[`${s}_FirebreakArea_ha`] = c.firebreakArea ?? 0;
    }
    row[`${s}_TotalCost`] = (c.cost ?? 0) * (c.occurrences ?? 0);
    row[`${s}_Labor_%`] = c.distribution?.labor ?? 0;
    row[`${s}_Mater_%`] = c.distribution?.materials ?? 0;
    row[`${s}_Mach_%`] = c.distribution?.machinery ?? 0;
  }

  // Scenario costs
  row["Fav_Total_USD"] = d.favorableScenario?.totalCost ?? 0;
  row["Fav_Impl_USD"] = d.favorableScenario?.implementationCost ?? 0;
  row["Fav_Maint_USD"] = d.favorableScenario?.maintenanceCost ?? 0;
  row["Unfav_Total_USD"] = d.unfavorableScenario?.totalCost ?? 0;
  row["Unfav_Impl_USD"] = d.unfavorableScenario?.implementationCost ?? 0;
  row["Unfav_Maint_USD"] = d.unfavorableScenario?.maintenanceCost ?? 0;

  // Assistance costs
  row["Assistances"] = (d.selectedAssistances ?? []).join("; ");
  if (d.assistanceCosts) {
    for (let i = 0; i < d.assistanceCosts.length; i++) {
      const a = d.assistanceCosts[i];
      row[`Assist${i + 1}_Name`] = a.name ?? "";
      row[`Assist${i + 1}_USD`] = a.cost ?? 0;
      row[`Assist${i + 1}_Phase`] = a.phase ?? "";
      row[`Assist${i + 1}_Labor_%`] = a.factorShares?.labor ?? 0;
      row[`Assist${i + 1}_Mater_%`] = a.factorShares?.materials ?? 0;
      row[`Assist${i + 1}_Mach_%`] = a.factorShares?.machinery ?? 0;
    }
  }
  row["Interaction_USD"] = d.interactionAdjustment ?? 0;

  // Factor shares (favorable)
  row["Fav_Labor_%"] = d.favorableFactorShares?.labor ?? 0;
  row["Fav_Mater_%"] = d.favorableFactorShares?.materials ?? 0;
  row["Fav_Mach_%"] = d.favorableFactorShares?.machinery ?? 0;

  // Labor breakdown
  row["Impl_Hired_%"] = d.laborBreakdown?.implementation?.hiredLabor ?? 0;
  row["Impl_Family_%"] = d.laborBreakdown?.implementation?.familyLabor ?? 0;
  row["Maint_Hired_%"] = d.laborBreakdown?.maintenance?.hiredLabor ?? 0;
  row["Maint_Family_%"] = d.laborBreakdown?.maintenance?.familyLabor ?? 0;
  row["HiredRate_USD_day"] = d.laborBreakdown?.hiredLaborCostPerDay ?? 0;
  row["MachineryRate_USD_hr"] = d.laborBreakdown?.machineryUnitCostPerHour ?? 0;
  row["Gender_Male_%"] = d.laborBreakdown?.genderDistribution?.male ?? 0;
  row["Gender_Female_%"] = d.laborBreakdown?.genderDistribution?.female ?? 0;
  row["Gender_Other_%"] = d.laborBreakdown?.genderDistribution?.other ?? 0;

  return row;
}

/**
 * Build the method-specific columns for a single method.
 */
function buildMethodColumns(mk: MethodType, d: RestorationModel): Row {
  const m = d.methodCosts?.[mk];
  const row: Row = {};

  row["Method"] = METHOD_LABELS[mk] ?? mk;
  row["Method_ID"] = mk;
  row["Is_NTFP"] = mk.endsWith("_ntfp") ? "Yes" : "No";
  row["Enrichment_%"] = d.enrichmentIntensity ?? 0;

  row["Impl_USD"] = m?.implementationCost ?? 0;
  row["Maint_USD"] = m?.maintenanceCost ?? 0;
  row["IntMaint_Start_yr"] = m?.intensiveMaintenanceStartYear ?? 0;
  row["IntMaint_End_yr"] = m?.intensiveMaintenanceEndYear ?? 0;
  row["IntMaint_USD"] = m?.intensiveMaintenanceCost ?? 0;
  row["Impl_Labor_%"] = m?.implementationDistribution?.labor ?? 0;
  row["Impl_Mater_%"] = m?.implementationDistribution?.materials ?? 0;
  row["Impl_Mach_%"] = m?.implementationDistribution?.machinery ?? 0;
  row["Maint_Labor_%"] = m?.maintenanceDistribution?.labor ?? 0;
  row["Maint_Mater_%"] = m?.maintenanceDistribution?.materials ?? 0;
  row["Maint_Mach_%"] = m?.maintenanceDistribution?.machinery ?? 0;

  // NTFP columns always present (empty/0 for non-NTFP methods)
  row["NTFP_Species"] = m?.ntfpSpecies ?? "";
  row["NTFP_Productiv_kg"] = m?.ntfpProductivity ?? 0;
  row["NTFP_Price_USD"] = m?.ntfpPrice ?? 0;
  row["NTFP_Revenue_USD"] = m?.ntfpRevenue ?? 0;

  m?.maintenanceSegments?.forEach((segment, index) => {
    const n = index + 1;
    row[`MaintSeg${n}_Name`] = segment.label ?? "";
    row[`MaintSeg${n}_From_yr`] = segment.yearFrom ?? 0;
    row[`MaintSeg${n}_To_yr`] = segment.yearTo ?? 0;
    row[`MaintSeg${n}_Annual_USD`] = segment.cost ?? 0;
  });

  m?.ntfpProductivitySegments?.forEach((segment, index) => {
    const n = index + 1;
    row[`ProdSeg${n}_Name`] = segment.label ?? "";
    row[`ProdSeg${n}_From_yr`] = segment.yearFrom ?? 0;
    row[`ProdSeg${n}_To_yr`] = segment.yearTo ?? 0;
    row[`ProdSeg${n}_kg_ha_yr`] = segment.productivity ?? 0;
  });

  m?.ntfpRevenueSegments?.forEach((segment, index) => {
    const n = index + 1;
    row[`RevSeg${n}_Name`] = segment.label ?? "";
    row[`RevSeg${n}_From_yr`] = segment.yearFrom ?? 0;
    row[`RevSeg${n}_To_yr`] = segment.yearTo ?? 0;
    row[`RevSeg${n}_Annual_USD`] = segment.revenue ?? 0;
  });

  return row;
}

/**
 * Build one row per answered method. Shared columns repeat; method columns vary.
 * Methods listed in disabledMethods are skipped.
 */
function buildExcelRows(d: RestorationModel): Row[] {
  const disabled = new Set(d.disabledMethods ?? []);
  const shared = buildSharedColumns(d);
  const answeredMethods = METHOD_KEYS.filter((mk) => !disabled.has(mk));

  // If no methods answered, still export one row with shared data
  if (answeredMethods.length === 0) {
    return [{ ...shared, Method: "", Method_ID: "", Is_NTFP: "", "Enrichment_%": 0,
      Impl_USD: 0, Maint_USD: 0, IntMaint_Start_yr: 0, IntMaint_End_yr: 0, IntMaint_USD: 0,
      "Impl_Labor_%": 0, "Impl_Mater_%": 0, "Impl_Mach_%": 0,
      "Maint_Labor_%": 0, "Maint_Mater_%": 0, "Maint_Mach_%": 0,
      NTFP_Species: "", NTFP_Productiv_kg: 0, NTFP_Price_USD: 0, NTFP_Revenue_USD: 0 }];
  }

  return answeredMethods.map((mk) => ({
    ...shared,
    ...buildMethodColumns(mk, d),
  }));
}

/**
 * Export model data as an .xlsx file.
 * One row per answered method; shared data is repeated across rows.
 * Columns are always the same regardless of which methods were answered.
 */
export function exportToXlsxFile(data: RestorationModel, filename: string): void {
  const rows = buildExcelRows(data);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, filename);
}
