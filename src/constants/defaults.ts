/**
 * Default values and constants for the Restoration Calculator form.
 */

import type { RestorationModelFormData } from "../schemas";

/** Default time horizon in years */
export const DEFAULT_TIME_HORIZON = 20;

/** Predefined ecosystem options (extendable) */
export const ECOSYSTEM_OPTIONS = [
  "Arid or Semi-Arid Zones",
  "Savanna or Dry Forest",
  "Mountaine Forest",
  "Tropical Forest",
  "Mangrove",
  "Subtropical Forest",
] as const;

/**
 * Method tab configurations.
 * Each tab defines a baseline ecological scenario with preset conditions.
 */
export const METHOD_TABS = [
  {
    id: "anr_30" as const,
    title: "ANR/50% Enrichment",
    description:
      "This scenario assumes a slightly less favorable context than a context for pure natural regeneration, with minor soil degradation and moderate availability of natural regeneration sources.\nEnrichment planting is applied at 50% intensity to support regeneration and accelerate structural recovery.\nEnrichment intensity is fixed at 50%.",
    implementationCostInfo:
      "Basic implementation cost should include the minimum cost required to initiate assisted natural regeneration under mildly restrictive conditions.\nThis includes all Natural Regeneration base activities plus localized enrichment planting at 50% intensity, including seedling acquisition, planting labor, and light localized soil correction.\nDo not include costs related to invasive species control, fencing, fire management, or other activities beside the basic implementation. These must be modeled as assistance costs. These items will be covered in the next section (additional context constraints).",
    maintenanceCostInfo:
      "Enter the accumulated total cost over the entire maintenance period (Years 2\u201320), not the annual cost.\nBasic maintenance costs should include minimal follow-up activities required to support assisted natural regeneration with 50% enrichment.\nThis may include survival checks, limited replacement of failed enriched seedlings, NTFP harvesting, and light monitoring activities.\nDo not include invasive species control, fencing, firebreak maintenance, pest management, or other external constraint-related costs. These should be modeled separately as assistance costs. These items will be covered in the next section (additional context constraints).",
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
    id: "anr_30_ntfp" as const,
    title: "ANR/50% Enrichment (with NTFP)",
    description:
      "Same ecological scenario as ANR/50% Enrichment, but includes Non-Timber Forest Product (NTFP) harvesting as part of the maintenance activities.\nEnrichment intensity is fixed at 50%.\nInclude any additional costs or savings associated with NTFP collection and management.",
    implementationCostInfo:
      "Basic implementation cost should include the minimum cost required to initiate assisted natural regeneration under mildly restrictive conditions, considering NTFP species.\nThis includes all Natural Regeneration base activities plus localized enrichment planting at 50% intensity, including seedling acquisition (with NTFP species), planting labor, and light localized soil correction.\nDo not include costs related to invasive species control, fencing, fire management, or other activities beside the basic implementation. These must be modeled as assistance costs. These items will be covered in the next section (additional context constraints).",
    maintenanceCostInfo:
      "Enter the accumulated total cost over the entire maintenance period (Years 2\u201320), not the annual cost.\nBasic maintenance costs should include minimal follow-up activities required to support assisted natural regeneration with 50% enrichment, including NTFP harvesting and management.\nThis may include survival checks, limited replacement of failed enriched seedlings, NTFP harvesting, and light monitoring activities.\nDo not include invasive species control, fencing, firebreak maintenance, pest management, or other external constraint-related costs. These should be modeled separately as assistance costs. These items will be covered in the next section (additional context constraints).",
    implementationMaterialExamples: "e.g., seedlings (including NTFP species), fertilizer, stakes, tree guards, localized soil amendments",
    maintenanceMaterialExamples: "e.g., replacement seedlings, monitoring tags, NTFP harvesting tools, minor repair materials",
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
    title: "Seed Dispersal",
    description:
      "This scenario assumes moderate soil degradation and low to moderate availability of natural regeneration sources.\nRegeneration cannot rely solely on natural processes and requires active seed dispersal across the site.\nApproach to cover 100% of the area.",
    implementationCostInfo:
      "Basic implementation cost should reflect the minimum cost required to implement direct seeding under moderately restrictive ecological conditions.\nThis includes seed acquisition, seed treatment (if applicable), light surface soil preparation, and seed distribution.\nDo not include fencing, invasive species control, firebreak construction, pest control, or other external restriction-related costs. These items will be covered in the next section (additional context constraints).",
    maintenanceCostInfo:
      "Enter the accumulated total cost over the entire maintenance period (Years 2\u201320), not the annual cost.\nBasic maintenance costs should reflect the minimum follow-up required after direct seeding under moderately restrictive but stable ecological conditions.\nThis may include monitoring germination success, limited reseeding in small areas if necessary, basic site inspections and NTFP harvesting (in case there is any).\nDo not include large-scale replanting, invasive species control, fencing, fire management, or other context-driven interventions. These items will be covered in the next section (additional context constraints).",
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
    id: "seed_dispersal_ntfp" as const,
    title: "Seed Dispersal (with NTFP)",
    description:
      "Same ecological scenario as Seed Dispersal, but includes Non-Timber Forest Product (NTFP) harvesting as part of the maintenance activities.\nApproach to cover 100% of the area, being NTFP 50% on average.\nInclude any additional costs associated with NTFP collection and management.",
    implementationCostInfo:
      "Basic implementation cost should reflect the minimum cost required to implement direct seeding under moderately restrictive ecological conditions, considering NTFP species.\nThis includes seed acquisition (including NTFP species), seed treatment (if applicable), light surface soil preparation, and seed distribution.\nDo not include fencing, invasive species control, firebreak construction, pest control, or other external restriction-related costs. These items will be covered in the next section (additional context constraints).",
    maintenanceCostInfo:
      "Enter the accumulated total cost over the entire maintenance period (Years 2\u201320), not the annual cost.\nBasic maintenance costs should reflect the minimum follow-up required after direct seeding, including NTFP harvesting and management.\nThis may include monitoring germination success, limited reseeding in small areas if necessary, basic site inspections, and NTFP harvesting.\nDo not include large-scale replanting, invasive species control, fencing, fire management, or other context-driven interventions. These items will be covered in the next section (additional context constraints).",
    implementationMaterialExamples: "e.g., native seeds (including NTFP species), seed coating/treatment products, basic soil amendments",
    maintenanceMaterialExamples: "e.g., replacement seeds, monitoring supplies, NTFP harvesting tools, small-area reseeding materials",
    soilDegradation: "Moderate",
    propaguleAvailability: "Low or Moderate",
    defaultEnrichment: 100,
    enrichmentEditable: false,
    enrichmentMin: 100,
    enrichmentMax: 100,
  },
  {
    id: "seedling_planting" as const,
    title: "Full Seedling Plantation",
    description:
      "This scenario assumes high soil degradation and low availability of natural regeneration sources.\nNatural regeneration is not sufficient to reach the benchmark carbon curve, and full-scale seedling planting is required.\nApproach to cover 100% of the area.",
    implementationCostInfo:
      "Basic implementation cost should reflect the minimum cost required to establish full seedling planting under degraded soil and low propagule availability.\nThis includes seedling production or acquisition, transport, standard soil preparation, planting labor, and basic fertilization at planting.\nDo not include erosion control infrastructure, invasive species management, fencing, irrigation systems, or other external constraint-related costs. These items will be covered in the next section (additional context constraints).",
    maintenanceCostInfo:
      "Enter the accumulated total cost over the entire maintenance period (Years 2\u201320), not the annual cost.\nBasic maintenance costs should reflect the minimum recurring expenses required to ensure successful establishment of planted seedlings under degraded but stable ecological conditions.\nThis may include survival monitoring, limited replanting of failed seedlings, and basic follow-up inspections.\nDo not include invasive species management, fencing, firebreak maintenance, irrigation systems beyond initial establishment, or other context-specific interventions. These items will be covered in the next section (additional context constraints).",
    implementationMaterialExamples: "e.g., seedlings, fertilizer, stakes, tree guards, soil amendments, basic planting tools",
    maintenanceMaterialExamples: "e.g., replacement seedlings, fertilizer, monitoring tags, minor repair materials",
    soilDegradation: "High",
    propaguleAvailability: "Low",
    defaultEnrichment: 100,
    enrichmentEditable: false,
    enrichmentMin: 100,
    enrichmentMax: 100,
  },
  {
    id: "seedling_planting_ntfp" as const,
    title: "Full Seedling Plantation NTFP (agroforestry)",
    description:
      "Same ecological scenario as Full Seedling Plantation, but includes Non-Timber Forest Product (NTFP) harvesting as part of the maintenance activities.\nApproach to cover 100% of the area, with NTFP covering 50% on average.\nInclude any additional costs associated with NTFP collection and management.",
    implementationCostInfo:
      "Basic implementation cost should reflect the minimum cost required to establish full seedling planting under degraded soil and low propagule availability, considering NTFP species.\nThis includes seedling production or acquisition (including NTFP species), transport, standard soil preparation, planting labor, and basic fertilization at planting.\nDo not include erosion control infrastructure, invasive species management, fencing, irrigation systems, or other external constraint-related costs. These items will be covered in the next section (additional context constraints).",
    maintenanceCostInfo:
      "Enter the accumulated total cost over the entire maintenance period (Years 2\u201320), not the annual cost.\nBasic maintenance costs should reflect the minimum recurring expenses required to ensure successful establishment, including NTFP harvesting and management.\nThis may include survival monitoring, limited replanting of failed seedlings, NTFP harvesting, and basic follow-up inspections.\nDo not include invasive species management, fencing, firebreak maintenance, irrigation systems beyond initial establishment, or other context-specific interventions. These items will be covered in the next section (additional context constraints).",
    implementationMaterialExamples: "e.g., seedlings (including NTFP species), fertilizer, stakes, tree guards, soil amendments, basic planting tools",
    maintenanceMaterialExamples: "e.g., replacement seedlings, fertilizer, NTFP harvesting tools, monitoring tags, minor repair materials",
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
  ntfpSpecies: "",
  ntfpProductivity: 0,
  ntfpPrice: 0,
  ntfpRevenue: 0,
  ntfpDataMode: "production" as const,
  maintenanceSegments: [],
  ntfpProductivitySegments: [],
  ntfpRevenueSegments: [],
};

/** Default empty method costs for all tabs */
export const EMPTY_METHOD_COSTS = {
  anr_30: { ...EMPTY_METHOD_COST_ENTRY },
  anr_30_ntfp: { ...EMPTY_METHOD_COST_ENTRY },
  seed_dispersal: { ...EMPTY_METHOD_COST_ENTRY },
  seed_dispersal_ntfp: { ...EMPTY_METHOD_COST_ENTRY },
  seedling_planting: { ...EMPTY_METHOD_COST_ENTRY },
  seedling_planting_ntfp: { ...EMPTY_METHOD_COST_ENTRY },
};

/** Empty context constraint entry */
export const EMPTY_CONTEXT_CONSTRAINT = {
  cost: 0,
  occurrences: 0,
  firebreakArea: 0,
  distribution: { labor: 0, materials: 0, machinery: 0 },
};

/** Default form values */
export const DEFAULT_FORM_VALUES: RestorationModelFormData = {
  userName: "",
  dataCollectionDate: "",
  respondentName: "",
  gpsCoordinates: "",
  ecosystem: "",
  country: "",
  city: "",
  timeHorizon: DEFAULT_TIME_HORIZON,
  disabledMethods: [],
  methodType: "anr_30",
  enrichmentIntensity: 50,
  methodCosts: { ...EMPTY_METHOD_COSTS },
  contextVariables: {
    fireRisk: { ...EMPTY_CONTEXT_CONSTRAINT },
    grazingPressure: { ...EMPTY_CONTEXT_CONSTRAINT },
    invasiveSpeciesPressure: { ...EMPTY_CONTEXT_CONSTRAINT },
    pestControl: { ...EMPTY_CONTEXT_CONSTRAINT },
  },
  laborBreakdown: {
    implementation: { hiredLabor: 0, familyLabor: 0 },
    maintenance: { hiredLabor: 0, familyLabor: 0 },
    hiredLaborCostPerDay: 0,
    machineryUnitCostPerHour: 0,
    landLeaseCostPerHaPerYear: 0,
    genderDistribution: { male: 0, female: 0, other: 0 },
  },
};
