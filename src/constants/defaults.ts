/**
 * Default values and constants for the Restoration Calculator form.
 */

import type { RestorationModelFormData } from "../schemas";

/** Tolerance for unfavorable cost reconciliation (5%) */
export const RECONCILIATION_TOLERANCE = 0.05;

/** Default time horizon in years */
export const DEFAULT_TIME_HORIZON = 20;

/** Predefined ecosystem options (extendable) */
export const ECOSYSTEM_OPTIONS = [
  "Atlantic Forest",
  "Cerrado",
  "Amazon Rainforest",
  "Caatinga",
  "Pantanal",
  "Mangrove",
  "Pampas",
] as const;

/**
 * Method tab configurations.
 * Each tab defines a baseline ecological scenario with preset conditions.
 */
export const METHOD_TABS = [
  {
    id: "natural_regeneration" as const,
    title: "Natural Regeneration",
    description:
      "This scenario assumes the soil is not degraded and there is high availability of natural regeneration sources (propagules).\nPlease fill in the cost parameters assuming favorable ecological conditions, with no need for enrichment or intensive intervention.",
    implementationCostInfo:
      "Basic implementation cost should reflect the minimum cost required to initiate natural regeneration under favorable ecological conditions.\nThis includes initial site assessment, basic planning, light site preparation (if necessary), and administrative setup.\nDo not include costs related to invasive species control, fencing, fire management, pest control, or other external constraints. These must be added separately as assistance costs.",
    maintenanceCostInfo:
      "Enter the accumulated total cost over the entire maintenance period (Years 2\u201330), not the annual cost.\nBasic maintenance costs should reflect the minimum recurring expenses required to ensure successful natural regeneration under favorable ecological conditions.\nThis may include periodic site monitoring, minor follow-up inspections, and light corrective actions if needed.\nDo not include costs related to invasive species control, fencing maintenance, fire management, pest control, or other context-specific constraints. These must be added separately as assistance costs.",
    implementationMaterialExamples: "e.g., signage, boundary markers, basic planning/documentation supplies",
    maintenanceMaterialExamples: "e.g., monitoring markers, data collection supplies, minor repair materials",
    soilDegradation: "Low",
    propaguleAvailability: "High",
    defaultEnrichment: 0,
    enrichmentEditable: false,
    enrichmentMin: 0,
    enrichmentMax: 0,
  },
  {
    id: "anr_30" as const,
    title: "Assisted Natural Regeneration (ANR) \u2013 50% Enrichment",
    description:
      "This scenario assumes a slightly less favorable context, with minor soil degradation and moderate availability of natural regeneration sources.\nEnrichment planting is applied at 50% intensity to support regeneration and accelerate structural recovery.\nEnrichment intensity is fixed at 50%.",
    implementationCostInfo:
      "Basic implementation cost should include the minimum cost required to initiate assisted natural regeneration under mildly restrictive conditions.\nThis includes all Natural Regeneration base activities plus localized enrichment planting at 50% intensity, including seedling acquisition, planting labor, and light localized soil correction.\nDo not include costs related to invasive species control, fencing, fire management, or other external constraints. These must be modeled as assistance costs.",
    maintenanceCostInfo:
      "Enter the accumulated total cost over the entire maintenance period (Years 2\u201330), not the annual cost.\nBasic maintenance costs should include minimal follow-up activities required to support assisted natural regeneration with 50% enrichment.\nThis may include survival checks, limited replacement of failed enriched seedlings, and light monitoring activities.\nDo not include invasive species control, fencing, firebreak maintenance, pest management, or other external constraint-related costs. These should be modeled separately as assistance costs.",
    implementationMaterialExamples: "e.g., seedlings, fertilizer, stakes, tree guards, localized soil amendments",
    maintenanceMaterialExamples: "e.g., replacement seedlings, monitoring tags, minor repair materials",
    soilDegradation: "Low to Moderate",
    propaguleAvailability: "Moderate",
    defaultEnrichment: 50,
    enrichmentEditable: false,
    enrichmentMin: 50,
    enrichmentMax: 50,
    enrichmentWarning:
      "Enrichment above 50% suggests transition to seed dispersal or planting method.",
  },
  {
    id: "seed_dispersal" as const,
    title: "Seed Dispersal / Direct Seeding",
    description:
      "This scenario assumes moderate soil degradation and low to moderate availability of natural regeneration sources.\nRegeneration cannot rely solely on natural processes and requires active seed dispersal across the site.\nEnrichment intensity is fixed at 100%.",
    implementationCostInfo:
      "Basic implementation cost should reflect the minimum cost required to implement direct seeding under moderately restrictive ecological conditions.\nThis includes seed acquisition, seed treatment (if applicable), light surface soil preparation, and seed distribution.\nDo not include fencing, invasive species control, firebreak construction, pest control, or other external restriction-related costs.",
    maintenanceCostInfo:
      "Enter the accumulated total cost over the entire maintenance period (Years 2\u201330), not the annual cost.\nBasic maintenance costs should reflect the minimum follow-up required after direct seeding under moderately restrictive but stable ecological conditions.\nThis may include monitoring germination success, limited reseeding in small areas if necessary, and basic site inspections.\nDo not include large-scale replanting, invasive species control, fencing, fire management, or other context-driven interventions.",
    implementationMaterialExamples: "e.g., native seeds, seed coating/treatment products, basic soil amendments",
    maintenanceMaterialExamples: "e.g., replacement seeds, monitoring supplies, small-area reseeding materials",
    soilDegradation: "Moderate",
    propaguleAvailability: "Low or Moderate",
    defaultEnrichment: 100,
    enrichmentEditable: false,
    enrichmentMin: 100,
    enrichmentMax: 100,
  },
  {
    id: "seedling_planting" as const,
    title: "Seedling Plantation (Full Planting)",
    description:
      "This scenario assumes high soil degradation and low availability of natural regeneration sources.\nNatural regeneration is not sufficient to reach the benchmark carbon curve, and full-scale seedling planting is required.\nEnrichment intensity is fixed at 100%.",
    implementationCostInfo:
      "Basic implementation cost should reflect the minimum cost required to establish full seedling planting under degraded soil and low propagule availability.\nThis includes seedling production or acquisition, transport, standard soil preparation, planting labor, and basic fertilization at planting.\nDo not include erosion control infrastructure, invasive species management, fencing, irrigation systems, or other external constraint-related costs.",
    maintenanceCostInfo:
      "Enter the accumulated total cost over the entire maintenance period (Years 2\u201330), not the annual cost.\nBasic maintenance costs should reflect the minimum recurring expenses required to ensure successful establishment of planted seedlings under degraded but stable ecological conditions.\nThis may include survival monitoring, limited replanting of failed seedlings, and basic follow-up inspections.\nDo not include invasive species management, fencing, firebreak maintenance, irrigation systems beyond initial establishment, or other context-specific interventions.",
    implementationMaterialExamples: "e.g., seedlings, fertilizer, stakes, tree guards, soil amendments, basic planting tools",
    maintenanceMaterialExamples: "e.g., replacement seedlings, fertilizer, monitoring tags, minor repair materials",
    soilDegradation: "High",
    propaguleAvailability: "Low",
    defaultEnrichment: 100,
    enrichmentEditable: false,
    enrichmentMin: 100,
    enrichmentMax: 100,
  },
] as const;

/** Display label for a method type */
export function getMethodLabel(methodType: string): string {
  return METHOD_TABS.find((t) => t.id === methodType)?.title || methodType;
}

/**
 * Available assistance activity types.
 * Each entry has an id (form value) and a display label.
 * These are the activities that may be required in the unfavorable scenario.
 */
export const ASSISTANCE_TYPES = [
  { id: "fencing", label: "Fencing" },
  { id: "firebreak", label: "Firebreak" },
  { id: "soilRecovery", label: "Soil recovery" },
  { id: "invasiveControl", label: "Invasive species control" },
  { id: "cattleManagement", label: "Cattle management" },
  { id: "enrichmentPlanting", label: "Enrichment planting" },
] as const;

/** Local storage key for saved models */
export const STORAGE_KEY = "restoration-calculator-models";

/** Empty cost distribution */
export const EMPTY_COST_DISTRIBUTION = {
  labor: 0,
  materials: 0,
  machinery: 0,
};

/** Empty per-method cost entry */
export const EMPTY_METHOD_COST_ENTRY = {
  implementationCost: 0,
  implementationDistribution: { ...EMPTY_COST_DISTRIBUTION },
  maintenanceCost: 0,
  maintenanceDistribution: { ...EMPTY_COST_DISTRIBUTION },
  intensiveMaintenanceStartYear: 3,
  intensiveMaintenanceEndYear: 6,
  intensiveMaintenanceCost: 0,
};

/** Default empty method costs for all four tabs */
export const EMPTY_METHOD_COSTS = {
  natural_regeneration: { ...EMPTY_METHOD_COST_ENTRY },
  anr_30: { ...EMPTY_METHOD_COST_ENTRY },
  seed_dispersal: { ...EMPTY_METHOD_COST_ENTRY },
  seedling_planting: { ...EMPTY_METHOD_COST_ENTRY },
};

/** Empty factor shares */
export const EMPTY_FACTOR_SHARES = {
  labor: 0,
  materials: 0,
  machinery: 0,
};

/** Empty scenario costs */
export const EMPTY_SCENARIO_COSTS = {
  totalCost: 0,
  implementationCost: 0,
  maintenanceCost: 0,
};

/** Empty context constraint entry */
export const EMPTY_CONTEXT_CONSTRAINT = {
  cost: 0,
  appliesToImplementation: false,
  appliesToMaintenance: false,
  distribution: { labor: 0, materials: 0, machinery: 0 },
};

/** Default form values */
export const DEFAULT_FORM_VALUES: RestorationModelFormData = {
  ecosystem: "",
  country: "",
  timeHorizon: DEFAULT_TIME_HORIZON,
  methodType: "natural_regeneration",
  enrichmentIntensity: 0,
  methodCosts: { ...EMPTY_METHOD_COSTS },
  contextVariables: {
    fireRisk: { ...EMPTY_CONTEXT_CONSTRAINT },
    grazingPressure: { ...EMPTY_CONTEXT_CONSTRAINT },
    invasiveSpeciesPressure: { ...EMPTY_CONTEXT_CONSTRAINT },
    humanEncroachment: { ...EMPTY_CONTEXT_CONSTRAINT },
  },
  selectedAssistances: [],
  favorableScenario: { ...EMPTY_SCENARIO_COSTS },
  unfavorableScenario: { ...EMPTY_SCENARIO_COSTS },
  assistanceCosts: [],
  interactionAdjustment: 0,
  favorableFactorShares: { ...EMPTY_FACTOR_SHARES },
  laborBreakdown: {
    implementation: { hiredLabor: 0, familyLabor: 0 },
    maintenance: { hiredLabor: 0, familyLabor: 0 },
    hiredLaborCostPerDay: 0,
  },
};
