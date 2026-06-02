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

// ---------------------------------------------------------------------------
// Excel (.xlsx) Export
// ---------------------------------------------------------------------------
//
// Fixed-column structure with one row per answered (non-disabled) method.
// 231 columns total, ordered to follow the questionnaire flow:
//   A. Identification (shared, 7)
//   D. Method ID (per row, 2)
//   E. Implementation costs (per row, 4)
//   G. Maintenance segments (per row, 150) — Strategy B grouped by activity
//   F. Maintenance distribution (per row, 3)
//   H. NTFP species & price (per row, 2 — empty for non-NTFP)
//   I. NTFP productivity segments (per row, 15 — empty for non-NTFP)
//   J. NTFP revenue segments (per row, 15 — empty for non-NTFP)
//   B. Context constraints (shared, 23)
//   C. Labor breakdown (shared, 10)
//
// Only fields the user can actually fill in the active questionnaire form are
// exported. Computed totals (maintenanceCost, ntfpProductivity, ntfpRevenue)
// and orphan model fields without UI bindings are intentionally excluded.

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

/**
 * Maintenance activities (Strategy B): each segment's `label` is matched
 * against these patterns to determine which prefix block it belongs to.
 * Two label variants exist (ANR vs other methods) but share the same prefix.
 */
const MAINT_ACTIVITIES = [
  { prefix: "RegInd",     match: (l: string) => /regenerating individuals/i.test(l) },
  { prefix: "MaintNTFP",  match: (l: string) => /NTFP species/i.test(l) },
  { prefix: "Harvest",    match: (l: string) => /^harvest$/i.test(l.trim()) },
  { prefix: "TechAssist", match: (l: string) => /technical assistance/i.test(l) },
  { prefix: "Monitoring", match: (l: string) => /monitoring/i.test(l) },
] as const;

const MAINT_SEGMENT_SLOTS = 10;
const PROD_REV_SEGMENT_SLOTS = 5;

type Cell = string | number;
type Row = Record<string, Cell>;

/** Numeric cell helper — empty string for null/undefined, number otherwise. */
function num(v: number | undefined | null): Cell {
  return v == null ? "" : Number(v);
}

/** String cell helper — empty string for null/undefined. */
function str(v: string | undefined | null): string {
  return v ?? "";
}

/**
 * Convert a US$/km cost to US$/ha given an area in hectares.
 * Inverse of `haToKm` in the form's CostEstimatesSection.
 *   cost/km = cost/ha × √A / 0.4   →   cost/ha = cost/km × 0.4 / √A
 */
function costKmToHa(costPerKm: number, areaHa: number): Cell {
  if (!costPerKm || !areaHa || areaHa <= 0) return "";
  return (costPerKm * 0.4) / Math.sqrt(areaHa);
}

// ---------------------------------------------------------------------------
// Block builders — one per section letter (A, B, C, D, E, F, G, H, I, J)
// ---------------------------------------------------------------------------

/** A. Identification (shared). */
function blockA_identification(d: RestorationModel): Row {
  return {
    Respondent: str(d.respondentName),
    User:       str(d.userName),
    Date:       str(d.dataCollectionDate),
    GPS:        str(d.gpsCoordinates),
    Ecosystem:  str(d.ecosystem),
    Country:    str(d.country),
    City:       str(d.city),
  };
}

/** D. Method identification (per row). */
function blockD_methodId(mk: MethodType): Row {
  return {
    Method:    METHOD_LABELS[mk] ?? mk,
    Method_ID: mk,
  };
}

/** E. Implementation cost + distribution (per row). */
function blockE_implementation(d: RestorationModel, mk: MethodType): Row {
  const m = d.methodCosts?.[mk];
  return {
    Impl_USD:        num(m?.implementationCost),
    "Impl_Labor_%":  num(m?.implementationDistribution?.labor),
    "Impl_Mater_%":  num(m?.implementationDistribution?.materials),
    "Impl_Mach_%":   num(m?.implementationDistribution?.machinery),
  };
}

/**
 * G. Maintenance segments — Strategy B.
 * Always emits 5 activities × 10 slots × 3 fields = 150 cols, in fixed order.
 * Segments matching an activity fill that activity's slots in input order;
 * unmatched / missing slots remain empty.
 */
function blockG_maintenanceSegments(d: RestorationModel, mk: MethodType): Row {
  const segments = d.methodCosts?.[mk]?.maintenanceSegments ?? [];
  const row: Row = {};

  // Initialise every slot empty so columns always exist in the same order.
  for (const a of MAINT_ACTIVITIES) {
    for (let i = 1; i <= MAINT_SEGMENT_SLOTS; i++) {
      row[`Maint_${a.prefix}_Seg${i}_From_yr`]    = "";
      row[`Maint_${a.prefix}_Seg${i}_To_yr`]      = "";
      row[`Maint_${a.prefix}_Seg${i}_Annual_USD`] = "";
    }
  }

  // Fill slots per activity, respecting input order.
  const counters: Record<string, number> = {};
  for (const a of MAINT_ACTIVITIES) counters[a.prefix] = 0;

  for (const seg of segments) {
    const activity = MAINT_ACTIVITIES.find((a) => a.match(seg.label ?? ""));
    if (!activity) continue;
    counters[activity.prefix] += 1;
    const i = counters[activity.prefix];
    if (i > MAINT_SEGMENT_SLOTS) continue;
    const p = activity.prefix;
    row[`Maint_${p}_Seg${i}_From_yr`]    = num(seg.yearFrom);
    row[`Maint_${p}_Seg${i}_To_yr`]      = num(seg.yearTo);
    row[`Maint_${p}_Seg${i}_Annual_USD`] = num(seg.cost);
  }

  return row;
}

/** F. Maintenance distribution (per row). */
function blockF_maintenanceDistribution(d: RestorationModel, mk: MethodType): Row {
  const m = d.methodCosts?.[mk];
  return {
    "Maint_Labor_%": num(m?.maintenanceDistribution?.labor),
    "Maint_Mater_%": num(m?.maintenanceDistribution?.materials),
    "Maint_Mach_%":  num(m?.maintenanceDistribution?.machinery),
  };
}

/** H. NTFP species & price (per row, empty for non-NTFP methods). */
function blockH_ntfpSpeciesPrice(d: RestorationModel, mk: MethodType): Row {
  const m = d.methodCosts?.[mk];
  const isNtfp = mk.endsWith("_ntfp");
  return {
    NTFP_Species:      isNtfp ? str(m?.ntfpSpecies) : "",
    NTFP_Price_USD_kg: isNtfp ? num(m?.ntfpPrice)   : "",
  };
}

/** I. NTFP productivity segments (per row, 5 flat slots). */
function blockI_prodSegments(d: RestorationModel, mk: MethodType): Row {
  const segments = d.methodCosts?.[mk]?.ntfpProductivitySegments ?? [];
  const row: Row = {};
  for (let i = 1; i <= PROD_REV_SEGMENT_SLOTS; i++) {
    const s = segments[i - 1];
    row[`ProdSeg${i}_From_yr`]   = s ? num(s.yearFrom)     : "";
    row[`ProdSeg${i}_To_yr`]     = s ? num(s.yearTo)       : "";
    row[`ProdSeg${i}_kg_ha_yr`]  = s ? num(s.productivity) : "";
  }
  return row;
}

/** J. NTFP revenue segments (per row, 5 flat slots). */
function blockJ_revSegments(d: RestorationModel, mk: MethodType): Row {
  const segments = d.methodCosts?.[mk]?.ntfpRevenueSegments ?? [];
  const row: Row = {};
  for (let i = 1; i <= PROD_REV_SEGMENT_SLOTS; i++) {
    const s = segments[i - 1];
    row[`RevSeg${i}_From_yr`]    = s ? num(s.yearFrom) : "";
    row[`RevSeg${i}_To_yr`]      = s ? num(s.yearTo)   : "";
    row[`RevSeg${i}_Annual_USD`] = s ? num(s.revenue)  : "";
  }
  return row;
}

/**
 * B. Context constraints (shared).
 * Fire and Fence costs are user-entered as US$/km; the corresponding US$/ha
 * is derived from the constraint's area input (firebreakArea / occurrences).
 */
function blockB_contextConstraints(d: RestorationModel): Row {
  const fire  = d.contextVariables?.fireRisk;
  const fence = d.contextVariables?.grazingPressure;
  const weed  = d.contextVariables?.invasiveSpeciesPressure;
  const pest  = d.contextVariables?.pestControl;

  const fireKm   = fire?.cost ?? 0;
  const fireArea = Number(fire?.firebreakArea) || 0;
  const fireHa   = fireKm > 0 ? costKmToHa(fireKm, fireArea) : "";

  const fenceKm   = fence?.cost ?? 0;
  const fenceArea = Number(fence?.occurrences) || 0;
  const fenceHa   = fenceKm > 0 ? costKmToHa(fenceKm, fenceArea) : "";

  return {
    // Fire (7)
    Fire_UnitCost_USD_km:    num(fire?.cost),
    Fire_UnitCost_USD_ha:    fireHa,
    Fire_Occur:              num(fire?.occurrences),
    Fire_FirebreakArea_ha:   num(fire?.firebreakArea),
    "Fire_Labor_%":          num(fire?.distribution?.labor),
    "Fire_Mater_%":          num(fire?.distribution?.materials),
    "Fire_Mach_%":           num(fire?.distribution?.machinery),
    // Fence (6)
    Fence_UnitCost_USD_km:   num(fence?.cost),
    Fence_UnitCost_USD_ha:   fenceHa,
    Fence_Area_ha:           num(fence?.occurrences),
    "Fence_Labor_%":         num(fence?.distribution?.labor),
    "Fence_Mater_%":         num(fence?.distribution?.materials),
    "Fence_Mach_%":          num(fence?.distribution?.machinery),
    // Weed (5)
    Weed_UnitCost:           num(weed?.cost),
    Weed_Occur:              num(weed?.occurrences),
    "Weed_Labor_%":          num(weed?.distribution?.labor),
    "Weed_Mater_%":          num(weed?.distribution?.materials),
    "Weed_Mach_%":           num(weed?.distribution?.machinery),
    // Pest (5)
    Pest_UnitCost:           num(pest?.cost),
    Pest_Occur:              num(pest?.occurrences),
    "Pest_Labor_%":          num(pest?.distribution?.labor),
    "Pest_Mater_%":          num(pest?.distribution?.materials),
    "Pest_Mach_%":           num(pest?.distribution?.machinery),
  };
}

/** C. Labor breakdown (shared). */
function blockC_laborBreakdown(d: RestorationModel): Row {
  const lb = d.laborBreakdown;
  return {
    "Impl_Hired_%":           num(lb?.implementation?.hiredLabor),
    "Impl_Family_%":          num(lb?.implementation?.familyLabor),
    "Maint_Hired_%":          num(lb?.maintenance?.hiredLabor),
    "Maint_Family_%":         num(lb?.maintenance?.familyLabor),
    HiredLaborCost_USD_day:   num(lb?.hiredLaborCostPerDay),
    MachineryUnitCost_USD_hr: num(lb?.machineryUnitCostPerHour),
    LandLease_USD_ha_yr:      num(lb?.landLeaseCostPerHaPerYear),
    "Gender_Male_%":          num(lb?.genderDistribution?.male),
    "Gender_Female_%":        num(lb?.genderDistribution?.female),
    "Gender_Other_%":         num(lb?.genderDistribution?.other),
  };
}

/** Per-method block sequence: D → E → G → F → H → I → J. */
function buildPerMethodCols(d: RestorationModel, mk: MethodType): Row {
  return {
    ...blockD_methodId(mk),
    ...blockE_implementation(d, mk),
    ...blockG_maintenanceSegments(d, mk),
    ...blockF_maintenanceDistribution(d, mk),
    ...blockH_ntfpSpeciesPrice(d, mk),
    ...blockI_prodSegments(d, mk),
    ...blockJ_revSegments(d, mk),
  };
}

/**
 * Build one row per answered (non-disabled) method.
 * Final column order: A → D → E → G → F → H → I → J → B → C.
 */
function buildExcelRows(d: RestorationModel): Row[] {
  const disabled = new Set(d.disabledMethods ?? []);
  const answered = METHOD_KEYS.filter((mk) => !disabled.has(mk));

  const a = blockA_identification(d);
  const b = blockB_contextConstraints(d);
  const c = blockC_laborBreakdown(d);

  // No method answered → emit a single row with empty per-method blocks so
  // the column structure is still preserved.
  if (answered.length === 0) {
    const emptyMethod = buildPerMethodCols(d, METHOD_KEYS[0]);
    for (const k of Object.keys(emptyMethod)) emptyMethod[k] = "";
    return [{ ...a, ...emptyMethod, ...b, ...c }];
  }

  return answered.map((mk) => ({
    ...a,
    ...buildPerMethodCols(d, mk),
    ...b,
    ...c,
  }));
}

// ---------------------------------------------------------------------------
// Metadata sheet
// ---------------------------------------------------------------------------
//
// Field-by-field documentation. Repeating segment columns are collapsed into
// a single descriptive row each (per user request); every other column gets
// its own line.

type MetaRow = [string, string, string, string]; // Field | Unit | Section | Description

const METADATA_ROWS: MetaRow[] = [
  // 1. Identification
  ["Respondent", "text", "1. Identification", "Name of the field expert / consultant who provided the data"],
  ["User", "text", "1. Identification", "Name of the person filling out the questionnaire"],
  ["Date", "YYYY-MM-DD", "1. Identification", "Date when the data was collected"],
  ["GPS", "text \"lat, lon\"", "1. Identification", "GPS coordinates of the project site"],
  ["Ecosystem", "text", "1. Identification", "Ecosystem type (e.g., Tropical Forest, Cerrado, Mangrove)"],
  ["Country", "text", "1. Identification", "Country where the project is located"],
  ["City", "text", "1. Identification", "City where the project is located"],
  // 2. Method
  ["Method", "text", "2. Method", "Display label of the restoration method for this row"],
  ["Method_ID", "text", "2. Method", "Internal ID of the method (anr_30, anr_30_ntfp, seed_dispersal, seed_dispersal_ntfp, seedling_planting, seedling_planting_ntfp)"],
  // 3. Implementation
  ["Impl_USD", "US$/ha", "3. Implementation", "Basic implementation cost (Year 1) for this method"],
  ["Impl_Labor_%", "%", "3. Implementation", "Share of implementation cost attributable to labor (must sum to 100% with Mater/Mach)"],
  ["Impl_Mater_%", "%", "3. Implementation", "Share of implementation cost attributable to materials"],
  ["Impl_Mach_%", "%", "3. Implementation", "Share of implementation cost attributable to machinery/services"],
  // 4. Maintenance segments — one row per activity (5 activities x 10 slots x 3 fields)
  ["Maint_RegInd_Seg<N>_<Field>",
    "year (From/To) or US$/ha/yr (Annual_USD)",
    "4. Maintenance segments",
    "Segments for 'Maintenance of regenerating individuals' (pruning, thinning, support staking). <N> in 1..10. <Field> in {From_yr (start year), To_yr (end year, >= From_yr), Annual_USD (annual cost in US$/ha)}. Empty when the user has not used that segment slot."],
  ["Maint_MaintNTFP_Seg<N>_<Field>",
    "year (From/To) or US$/ha/yr (Annual_USD)",
    "4. Maintenance segments",
    "Segments for 'Maintenance of NTFP species' (pruning, thinning, support staking). <N> in 1..10. <Field> in {From_yr, To_yr, Annual_USD}. Empty when the slot was not used."],
  ["Maint_Harvest_Seg<N>_<Field>",
    "year (From/To) or US$/ha/yr (Annual_USD)",
    "4. Maintenance segments",
    "Segments for 'Harvest' activity (e.g. NTFP collection, when treated as a maintenance cost). <N> in 1..10. <Field> in {From_yr, To_yr, Annual_USD}. Empty when the slot was not used."],
  ["Maint_TechAssist_Seg<N>_<Field>",
    "year (From/To) or US$/ha/yr (Annual_USD)",
    "4. Maintenance segments",
    "Segments for 'Technical assistance' (agronomist/forester visits, planning, training). <N> in 1..10. <Field> in {From_yr, To_yr, Annual_USD}. Empty when the slot was not used."],
  ["Maint_Monitoring_Seg<N>_<Field>",
    "year (From/To) or US$/ha/yr (Annual_USD)",
    "4. Maintenance segments",
    "Segments for 'Monitoring General Maintenance Activities' (e.g. shade management, light interventions). <N> in 1..10. <Field> in {From_yr, To_yr, Annual_USD}. Empty when the slot was not used."],
  // 5. Maintenance distribution
  ["Maint_Labor_%", "%", "5. Maintenance distribution", "Share of maintenance cost attributable to labor (sum to 100%)"],
  ["Maint_Mater_%", "%", "5. Maintenance distribution", "Share of maintenance cost attributable to materials"],
  ["Maint_Mach_%", "%", "5. Maintenance distribution", "Share of maintenance cost attributable to machinery/services"],
  // 6. NTFP species & price
  ["NTFP_Species", "text", "6. NTFP species & price", "Selected Non-Timber Forest Product species (NTFP methods only - empty otherwise)"],
  ["NTFP_Price_USD_kg", "US$/kg", "6. NTFP species & price", "Average price of the NTFP during harvesting season (NTFP methods only)"],
  // 7. ProdSeg — collapsed
  ["ProdSeg<N>_<Field>",
    "year (From/To) or kg/ha/yr (kg_ha_yr)",
    "7. NTFP Productivity segments",
    "NTFP productivity segments. <N> in 1..5. <Field> in {From_yr, To_yr, kg_ha_yr (annual productivity)}. Filled only when the user picks 'Productivity data' mode for an NTFP method. Empty otherwise."],
  // 8. RevSeg — collapsed
  ["RevSeg<N>_<Field>",
    "year (From/To) or US$/ha/yr (Annual_USD)",
    "8. NTFP Revenue segments",
    "NTFP revenue segments. <N> in 1..5. <Field> in {From_yr, To_yr, Annual_USD (annual revenue)}. Filled only when the user picks 'Revenue data' mode for an NTFP method. Empty otherwise."],
  // 9. Context Constraints — Fire
  ["Fire_UnitCost_USD_km", "US$/km", "9. Context Constraints", "Firebreak unit cost per linear km"],
  ["Fire_UnitCost_USD_ha", "US$/ha", "9. Context Constraints", "Firebreak unit cost per hectare (derived from US$/km via firebreak area)"],
  ["Fire_Occur", "count", "9. Context Constraints", "Number of times firebreak activity occurs over the 20-year horizon"],
  ["Fire_FirebreakArea_ha", "ha", "9. Context Constraints", "Average total area that needs fire breaks"],
  ["Fire_Labor_%", "%", "9. Context Constraints", "Share of firebreak cost attributable to labor (sum to 100%)"],
  ["Fire_Mater_%", "%", "9. Context Constraints", "Share of firebreak cost attributable to materials"],
  ["Fire_Mach_%", "%", "9. Context Constraints", "Share of firebreak cost attributable to machinery/services"],
  // 9 — Fence
  ["Fence_UnitCost_USD_km", "US$/km", "9. Context Constraints", "Fencing unit cost per linear km"],
  ["Fence_UnitCost_USD_ha", "US$/ha", "9. Context Constraints", "Fencing unit cost per hectare (derived from US$/km via fenced area)"],
  ["Fence_Area_ha", "ha", "9. Context Constraints", "Average area that needs fences in one typical property"],
  ["Fence_Labor_%", "%", "9. Context Constraints", "Share of fencing cost attributable to labor"],
  ["Fence_Mater_%", "%", "9. Context Constraints", "Share of fencing cost attributable to materials"],
  ["Fence_Mach_%", "%", "9. Context Constraints", "Share of fencing cost attributable to machinery/services"],
  // 9 — Weed
  ["Weed_UnitCost", "US$/ha", "9. Context Constraints", "Invasive species / weed control unit cost"],
  ["Weed_Occur", "count", "9. Context Constraints", "Number of weed-control occurrences over the 20-year horizon"],
  ["Weed_Labor_%", "%", "9. Context Constraints", "Share of weed-control cost attributable to labor"],
  ["Weed_Mater_%", "%", "9. Context Constraints", "Share of weed-control cost attributable to materials"],
  ["Weed_Mach_%", "%", "9. Context Constraints", "Share of weed-control cost attributable to machinery/services"],
  // 9 — Pest
  ["Pest_UnitCost", "US$/ha", "9. Context Constraints", "Pest control unit cost"],
  ["Pest_Occur", "count", "9. Context Constraints", "Number of pest-control occurrences over the 20-year horizon"],
  ["Pest_Labor_%", "%", "9. Context Constraints", "Share of pest-control cost attributable to labor"],
  ["Pest_Mater_%", "%", "9. Context Constraints", "Share of pest-control cost attributable to materials"],
  ["Pest_Mach_%", "%", "9. Context Constraints", "Share of pest-control cost attributable to machinery/services"],
  // 10. Labor breakdown
  ["Impl_Hired_%", "%", "10. Labor Breakdown", "Implementation labor: share of hired (paid) workers (Hired+Family = 100%)"],
  ["Impl_Family_%", "%", "10. Labor Breakdown", "Implementation labor: share of family (unpaid) labor"],
  ["Maint_Hired_%", "%", "10. Labor Breakdown", "Maintenance labor: share of hired (paid) workers"],
  ["Maint_Family_%", "%", "10. Labor Breakdown", "Maintenance labor: share of family (unpaid) labor"],
  ["HiredLaborCost_USD_day", "US$/day", "10. Labor Breakdown", "Regional reference: average daily wage for hired field workers"],
  ["MachineryUnitCost_USD_hr", "US$/hour", "10. Labor Breakdown", "Regional reference: hourly cost of machinery"],
  ["LandLease_USD_ha_yr", "US$/ha/year", "10. Labor Breakdown", "Regional reference: average annual land lease (rent) rate per hectare"],
  ["Gender_Male_%", "%", "10. Labor Breakdown", "Share of total labor hours contributed by male workers (sum to 100% with Female/Other)"],
  ["Gender_Female_%", "%", "10. Labor Breakdown", "Share of total labor hours contributed by female workers"],
  ["Gender_Other_%", "%", "10. Labor Breakdown", "Share of total labor hours contributed by non-binary / other workers"],
];

/** Build the Metadata worksheet. */
function buildMetadataSheet(): XLSX.WorkSheet {
  const aoa: (string | number)[][] = [
    ["Field", "Unit", "Section", "Description"],
    ...METADATA_ROWS,
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Column widths for readability
  ws["!cols"] = [{ wch: 38 }, { wch: 28 }, { wch: 30 }, { wch: 90 }];
  return ws;
}

/**
 * Export model data as an .xlsx file with two sheets:
 *   - "Data": one row per answered method, fixed 230-column layout
 *   - "Metadata": one descriptive row per field/group
 * Column structure is fixed regardless of which methods or segments were filled.
 */
export function exportToXlsxFile(data: RestorationModel, filename: string): void {
  const rows = buildExcelRows(data);
  const dataSheet = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, dataSheet, "Data");
  XLSX.utils.book_append_sheet(wb, buildMetadataSheet(), "Metadata");
  XLSX.writeFile(wb, filename);
}
