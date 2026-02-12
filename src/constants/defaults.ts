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

/** Predefined restoration method options */
export const METHOD_OPTIONS = [
  "Natural regeneration",
  "Assisted natural regeneration",
  "Direct seeding",
  "Enrichment planting",
  "Total planting",
  "Agroforestry",
] as const;

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

/** Default form values */
export const DEFAULT_FORM_VALUES: RestorationModelFormData = {
  ecosystem: "",
  country: "",
  method: "",
  timeHorizon: DEFAULT_TIME_HORIZON,
  contextVariables: {
    fireRisk: "low",
    soilDegradation: "none",
    grazingPressure: "low",
    invasiveSpeciesPressure: "low",
    humanEncroachment: "low",
    seedAvailabilityConstraint: "no",
  },
  selectedAssistances: [],
  favorableScenario: { ...EMPTY_SCENARIO_COSTS },
  unfavorableScenario: { ...EMPTY_SCENARIO_COSTS },
  assistanceCosts: [],
  interactionAdjustment: 0,
  favorableFactorShares: { ...EMPTY_FACTOR_SHARES },
};
