/**
 * =============================================================================
 * Computed Fields & Utility Functions
 * =============================================================================
 *
 * Derives values from the form data at runtime.
 *
 * Cost additivity:
 *   computedUnfavorableCost = favorableTotalCost + Σ(assistanceCosts) + interactionAdj
 *
 * Reconciliation check:
 *   |declaredUnfavorable − computedUnfavorable| / declaredUnfavorable ≤ tolerance
 * =============================================================================
 */

import type { AssistanceCost, ComputedFields, CostBreakdownItem, MethodCosts } from "../types";
import type { RestorationModelFormData } from "../schemas";
import { RECONCILIATION_TOLERANCE } from "../constants";

/**
 * Check whether all four method tabs have been filled (both costs > 0, both distributions sum to 100%).
 */
export function allMethodTabsComplete(methodCosts: MethodCosts | undefined): boolean {
  if (!methodCosts) return false;
  const tabs = ["natural_regeneration", "anr_30", "anr_30_ntfp", "seed_dispersal", "seed_dispersal_ntfp", "seedling_planting", "seedling_planting_ntfp"] as const;
  return tabs.every((t) => {
    const entry = methodCosts[t];
    if (!entry || entry.implementationCost <= 0 || entry.maintenanceCost <= 0) return false;
    const id = entry.implementationDistribution;
    const md = entry.maintenanceDistribution;
    if (!id || !md) return false;
    const iSum = (Number(id.labor) || 0) + (Number(id.machinery) || 0) + (Number(id.materials) || 0);
    const mSum = (Number(md.labor) || 0) + (Number(md.machinery) || 0) + (Number(md.materials) || 0);
    return Math.abs(iSum - 100) < 0.01 && Math.abs(mSum - 100) < 0.01;
  });
}

/**
 * Check whether at least one method tab has been filled completely.
 * A tab is complete when both implementation and maintenance costs are > 0
 * and both distributions sum to 100%.
 */
export function atLeastOneMethodTabComplete(methodCosts: MethodCosts | undefined): boolean {
  if (!methodCosts) return false;
  const tabs = ["natural_regeneration", "anr_30", "anr_30_ntfp", "seed_dispersal", "seed_dispersal_ntfp", "seedling_planting", "seedling_planting_ntfp"] as const;
  return tabs.some((t) => {
    const entry = methodCosts[t];
    if (!entry || entry.implementationCost <= 0 || entry.maintenanceCost <= 0) return false;
    const id = entry.implementationDistribution;
    const md = entry.maintenanceDistribution;
    if (!id || !md) return false;
    const iSum = (Number(id.labor) || 0) + (Number(id.machinery) || 0) + (Number(id.materials) || 0);
    const mSum = (Number(md.labor) || 0) + (Number(md.machinery) || 0) + (Number(md.materials) || 0);
    return Math.abs(iSum - 100) < 0.01 && Math.abs(mSum - 100) < 0.01;
  });
}

/**
 * Compute the total of all individual assistance costs (US$/ha).
 */
export function computeTotalAssistanceCost(assistanceCosts: AssistanceCost[]): number {
  return assistanceCosts.reduce((sum, a) => sum + (a.cost || 0), 0);
}

/**
 * Compute all derived fields from the current form state.
 */
export function computeFields(
  favorableTotalCost: number,
  assistanceCosts: AssistanceCost[],
  declaredUnfavorableCost: number,
  interactionAdjustment: number = 0
): ComputedFields {
  const totalAssistanceCost = computeTotalAssistanceCost(assistanceCosts);

  // Additive cost model: favorable + assistance + interaction = unfavorable
  const computedUnfavorableCost =
    favorableTotalCost + totalAssistanceCost + interactionAdjustment;

  const differenceFromDeclared = declaredUnfavorableCost - computedUnfavorableCost;

  // Tolerance check: within RECONCILIATION_TOLERANCE of declared
  const isWithinTolerance =
    declaredUnfavorableCost === 0
      ? computedUnfavorableCost === 0
      : Math.abs(differenceFromDeclared / declaredUnfavorableCost) <= RECONCILIATION_TOLERANCE;

  const costBreakdownSummary: CostBreakdownItem[] = assistanceCosts.map((a) => ({
    name: a.name || "(unnamed)",
    costPerHa: a.cost || 0,
    phase: a.phase,
  }));

  return {
    totalAssistanceCost,
    computedUnfavorableCost,
    differenceFromDeclared,
    isWithinTolerance,
    costBreakdownSummary,
  };
}

/**
 * Format a number as US currency.
 */
export function formatUSD(value: number): string {
  return `US$ ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Generate a timestamped filename for JSON export.
 */
export function generateExportFilename(ecosystem: string, method: string): string {
  const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  const eco = ecosystem.replace(/\s+/g, "_") || "unknown";
  const mth = method.replace(/\s+/g, "_") || "unknown";
  return `restoration_${eco}_${mth}_${ts}.json`;
}

// ---------------------------------------------------------------------------
// Test Data Generator
// ---------------------------------------------------------------------------

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDist(): { labor: number; materials: number; machinery: number } {
  const a = randInt(20, 60);
  const b = randInt(10, 100 - a - 5);
  const c = 100 - a - b;
  return { labor: a, materials: b, machinery: c };
}

function randMethodEntry(isNtfp: boolean) {
  const implDist = randDist();
  const maintDist = randDist();
  const startYr = randInt(2, 6);
  return {
    implementationCost: rand(500, 8000),
    implementationDistribution: implDist,
    maintenanceCost: rand(200, 5000),
    maintenanceDistribution: maintDist,
    intensiveMaintenanceStartYear: startYr,
    intensiveMaintenanceEndYear: randInt(startYr + 1, 12),
    intensiveMaintenanceCost: rand(100, 3000),
    ntfpSpecies: isNtfp ? ["Açaí", "Brazil nut", "Copaíba", "Andiroba", "Buriti"][randInt(0, 4)] : "",
    ntfpProductivity: isNtfp ? rand(50, 800) : 0,
    ntfpPrice: isNtfp ? rand(0.5, 15) : 0,
    ntfpRevenue: isNtfp ? rand(100, 5000) : 0,
  };
}

function randConstraint() {
  const dist = randDist();
  return {
    cost: rand(50, 2000),
    occurrences: randInt(1, 10),
    distribution: dist,
  };
}

const ECOSYSTEMS = ["Atlantic Forest", "Cerrado", "Amazon Rainforest", "Caatinga", "Pantanal", "Mangrove"];
const COUNTRIES = ["Brazil", "Colombia", "Peru", "Indonesia", "Costa Rica", "Mexico"];
const CITIES = ["São Paulo", "Manaus", "Bogotá", "Lima", "Jakarta", "San José"];
const NAMES = ["Dr. Silva", "Prof. García", "M. Santos", "A. Kumar", "J. Müller"];

/**
 * Generate a complete set of random test data for the form.
 */
export function generateTestData(): RestorationModelFormData {
  const favImpl = rand(1000, 10000);
  const favMaint = rand(500, 8000);
  const favTotal = favImpl + favMaint;
  const favShares = randDist();

  const assistNames = ["Fencing", "Firebreak", "Invasive Control", "Irrigation", "Replanting"];
  const numAssist = randInt(1, 3);
  const selectedAssistances = assistNames.slice(0, numAssist);
  const assistanceCosts = selectedAssistances.map((name) => ({
    name,
    cost: rand(100, 3000),
    phase: (["implementation", "maintenance", "both"] as const)[randInt(0, 2)],
    factorShares: randDist(),
  }));

  const totalAssist = assistanceCosts.reduce((s, a) => s + a.cost, 0);
  const interaction = rand(-200, 200);
  const unfavTotal = favTotal + totalAssist + interaction;
  const unfavImpl = rand(favImpl, favImpl + totalAssist * 0.4);
  const unfavMaint = unfavTotal - unfavImpl;

  const implHired = randInt(40, 90);
  const maintHired = randInt(40, 90);
  const gMale = randInt(30, 70);
  const gFemale = randInt(10, 100 - gMale - 5);
  const gOther = 100 - gMale - gFemale;

  return {
    userName: NAMES[randInt(0, NAMES.length - 1)],
    dataCollectionDate: new Date().toISOString().slice(0, 10),
    respondentName: NAMES[randInt(0, NAMES.length - 1)],
    gpsCoordinates: `${rand(-23, 5).toFixed(4)}, ${rand(-75, -35).toFixed(4)}`,
    ecosystem: ECOSYSTEMS[randInt(0, ECOSYSTEMS.length - 1)],
    country: COUNTRIES[randInt(0, COUNTRIES.length - 1)],
    city: CITIES[randInt(0, CITIES.length - 1)],
    timeHorizon: 20 as const,
    disabledMethods: [],
    methodType: "anr_30",
    enrichmentIntensity: 50,
    methodCosts: {
      natural_regeneration: randMethodEntry(false),
      anr_30: randMethodEntry(false),
      anr_30_ntfp: randMethodEntry(true),
      seed_dispersal: randMethodEntry(false),
      seed_dispersal_ntfp: randMethodEntry(true),
      seedling_planting: randMethodEntry(false),
      seedling_planting_ntfp: randMethodEntry(true),
    },
    contextVariables: {
      fireRisk: randConstraint(),
      grazingPressure: randConstraint(),
      invasiveSpeciesPressure: randConstraint(),
    },
    selectedAssistances: selectedAssistances,
    favorableScenario: {
      totalCost: Math.round(favTotal * 100) / 100,
      implementationCost: Math.round(favImpl * 100) / 100,
      maintenanceCost: Math.round(favMaint * 100) / 100,
    },
    unfavorableScenario: {
      totalCost: Math.round(unfavTotal * 100) / 100,
      implementationCost: Math.round(unfavImpl * 100) / 100,
      maintenanceCost: Math.round(unfavMaint * 100) / 100,
    },
    assistanceCosts,
    interactionAdjustment: Math.round(interaction * 100) / 100,
    favorableFactorShares: favShares,
    laborBreakdown: {
      implementation: { hiredLabor: implHired, familyLabor: 100 - implHired },
      maintenance: { hiredLabor: maintHired, familyLabor: 100 - maintHired },
      hiredLaborCostPerDay: rand(15, 80),
      genderDistribution: { male: gMale, female: gFemale, other: gOther },
    },
  };
}
