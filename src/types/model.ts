/**
 * =============================================================================
 * Restoration Calculator – Data Model Interfaces
 * =============================================================================
 *
 * These TypeScript interfaces define the structured data model for the
 * Restoration Calculator. Every field corresponds to a parameter in the
 * mathematical formulation described in the project README.
 *
 * KEY CONCEPTS:
 *
 * 1. Two Scenarios
 *    The consultant defines a FAVORABLE scenario (best conditions, no extra
 *    assistance needed) and a plausible UNFAVORABLE scenario for the region
 *    (restrictive context requiring additional assistance activities).
 *
 * 2. Cost Additivity
 *    Total unfavorable cost ≈ Favorable cost + Σ(assistance costs) + interaction adj.
 *    Each assistance activity adds an independent cost to the favorable base.
 *
 * 3. Interaction Adjustment
 *    When multiple assistances are combined, real-world interactions may cause
 *    costs to diverge from a pure sum. The interaction adjustment (positive or
 *    negative) captures this residual so that:
 *      declaredUnfavorableCost ≈ favorableCost + Σ(assistanceCosts) + adjustment
 *
 * =============================================================================
 */

// ---------------------------------------------------------------------------
// Factor of Production Shares
// ---------------------------------------------------------------------------

/**
 * Factor shares must always sum to exactly 100%.
 * They enable regional cost extrapolation via local price indices:
 *   AdjustedCost = Σ_k (FactorShare_k × LocalPriceIndex_k × BaseCost)
 */
export interface FactorShares {
  /** Percentage of cost attributable to labor (0–100) */
  labor: number;
  /** Percentage of cost attributable to materials (0–100) */
  materials: number;
  /** Percentage of cost attributable to machinery/services (0–100) */
  machinery: number;
}

export interface YearRangeSegment {
  /** Stable identifier used by the UI */
  id: string;
  /** Human-readable activity name */
  label: string;
  /** First year included in the segment */
  yearFrom: number;
  /** Last year included in the segment */
  yearTo: number;
}

export interface CostSegment extends YearRangeSegment {
  /** Annual maintenance cost applied to each year in the range (US$/ha/yr) */
  cost: number;
}

export interface RevenueSegment extends YearRangeSegment {
  /** Annual revenue applied to each year in the range (US$/ha/yr) */
  revenue: number;
}

export interface ProductivitySegment extends YearRangeSegment {
  /** Annual NTFP productivity applied to each year in the range (kg/ha/yr) */
  productivity: number;
}

// ---------------------------------------------------------------------------
// Context Variables
// ---------------------------------------------------------------------------

/**
 * A single context constraint entry — captures the estimated cost,
 * when it is incurred, and how it breaks down across production factors.
 */
export interface ContextConstraintEntry {
  /** Unit cost to address this constraint (US$/ha or US$/km) */
  cost: number;
  /** Number of times this activity needs to occur over the 20-year horizon */
  occurrences: number;
  /** Average total area that needs firebreaks in one property (ha) — only for fireRisk */
  firebreakArea?: number;
  /** Factor-of-production distribution (labor / machinery / materials, must sum to 100%) */
  distribution: FactorShares;
}

/**
 * Context variables describe the local conditions of the restoration site.
 * Each variable is a full constraint entry with cost, phase, and distribution.
 * Context does NOT directly affect carbon — it only drives costs.
 */
export interface ContextVariables {
  /** Firebreak / Fire Risk */
  fireRisk: ContextConstraintEntry;
  /** Fencing / Grazing Pressure */
  grazingPressure: ContextConstraintEntry;
  /** Weed Control / Invasive Species Pressure */
  invasiveSpeciesPressure: ContextConstraintEntry;
  /** Pest Control / Pest Infestation Risk */
  pestControl: ContextConstraintEntry;
}

// ---------------------------------------------------------------------------
// Restoration Method Type
// ---------------------------------------------------------------------------

/**
 * Each method type corresponds to a baseline ecological scenario
 * that determines the enrichment intensity and expected soil/propagule conditions.
 */
export type MethodType =
  | "anr_30"
  | "anr_30_ntfp"
  | "seed_dispersal"
  | "seed_dispersal_ntfp"
  | "seedling_planting"
  | "seedling_planting_ntfp";

// ---------------------------------------------------------------------------
// Per-Method Baseline Cost Entry
// ---------------------------------------------------------------------------

/**
 * Baseline implementation and maintenance costs for a single restoration method.
 * The consultant fills these for ALL four method tabs.
 * Each cost also carries a factor-of-production distribution (labor / machinery / materials)
 * that must sum to 100%.
 */
export interface MethodCostEntry {
  /** Implementation cost — year 1 only (US$/ha) */
  implementationCost: number;
  /** Factor-of-production distribution for implementation cost */
  implementationDistribution: FactorShares;
  /**
   * Maintenance cost — years 2 through T (US$/ha).
   * derived, do not edit directly — auto-computed from maintenanceSegments
   * by CostTimelineBuilder via onTotalChange.
   */
  maintenanceCost: number;
  /** Factor-of-production distribution for maintenance cost */
  maintenanceDistribution: FactorShares;
  /** NTFP species selected for harvesting (only for NTFP method variants) */
  ntfpSpecies?: string;
  /**
   * Average NTFP productivity in kg/ha (only for NTFP method variants).
   * derived, do not edit directly — auto-computed from
   * ntfpProductivitySegments by ProductivityTimelineBuilder via onAverageChange.
   */
  ntfpProductivity?: number;
  /** Average NTFP price in US$/kg (only for NTFP method variants) */
  ntfpPrice?: number;
  /**
   * Total NTFP revenue in US$/ha (only for NTFP method variants).
   * derived, do not edit directly — auto-computed from ntfpRevenueSegments
   * by RevenueTimelineBuilder via onTotalChange.
   */
  ntfpRevenue?: number;
  /**
   * Which NTFP data the user is providing (only for NTFP method variants).
   * "production" -> user fills productivity segments + price (revenue is derived);
   * "revenue"    -> user fills revenue segments directly.
   */
  ntfpDataMode?: "production" | "revenue";
  /** Maintenance activities by year range, each with annual cost */
  maintenanceSegments?: CostSegment[];
  /** NTFP productivity by year range */
  ntfpProductivitySegments?: ProductivitySegment[];
  /** NTFP revenue by year range, each with annual revenue */
  ntfpRevenueSegments?: RevenueSegment[];
}

/**
 * Record mapping each method type to its baseline cost entry.
 */
export type MethodCosts = Record<MethodType, MethodCostEntry>;

// ---------------------------------------------------------------------------
// Main Restoration Model
// ---------------------------------------------------------------------------

/**
 * The top-level data structure for one (ecosystem × method) model specification.
 * Each instance fully parameterises the economic model for a single combination.
 */
export interface RestorationModel {
  // ---- User Identification ----
  /** Name of the person filling in the questionnaire */
  userName?: string;
  /** Date when the data was collected (ISO date string) */
  dataCollectionDate?: string;

  // ---- Project Identification ----
  /** Name of the respondent / field expert who provided the data */
  respondentName?: string;
  /** GPS coordinates of the project site (latitude, longitude) */
  gpsCoordinates?: string;
  /** Ecosystem name/type (e.g., "Atlantic Forest", "Cerrado") */
  ecosystem: string;
  /** Country where the project is located */
  country: string;
  /** City where the project is located */
  city?: string;
  /** Time horizon in years (fixed: 20) */
  timeHorizon: number;

  // ---- Disabled Methods (no data available) ----
  /** Methods for which the respondent has no cost information */
  disabledMethods?: MethodType[];

  // ---- Restoration Method ----
  /** Baseline ecological method selected via tab interface */
  methodType: MethodType;
  /** Enrichment planting intensity (0–100%), derived from method tab */
  enrichmentIntensity: number;
  /** Baseline implementation + maintenance costs for ALL four method tabs */
  methodCosts: MethodCosts;

  // ---- Context Constraints (shared across all methods) ----
  /** Contextual conditions that describe the local site */
  contextVariables: ContextVariables;

  // ---- Labor Breakdown ----
  /** Breakdown of labor hours into hired vs non-hired labor (must sum to 100% each) */
  laborBreakdown: LaborBreakdown;
}

// ---------------------------------------------------------------------------
// Labor Breakdown (Hired vs Family)
// ---------------------------------------------------------------------------

/**
 * Captures what proportion of total labor hours corresponds to hired labor
 * versus non-hired labor, separately for implementation and maintenance phases.
 * Each phase's hiredLabor + familyLabor must sum to 100%.
 */
export interface LaborPhaseBreakdown {
  /** Percentage of labor hours from hired workers (0–100) */
  hiredLabor: number;
  /** Percentage of labor hours from family members (0–100) */
  familyLabor: number;
}

export interface LaborBreakdown {
  /** Hired vs non-hired labor split for implementation phase (Year 1) */
  implementation: LaborPhaseBreakdown;
  /** Hired vs non-hired labor split for maintenance phase (Years 2–T) */
  maintenance: LaborPhaseBreakdown;
  /** Hired labor daily rate — regional reference (US$/day) */
  hiredLaborCostPerDay: number;
  /** Machinery unit cost — regional reference (US$/hour) */
  machineryUnitCostPerHour: number;
  /** Average land lease rate in the region — regional reference (US$/ha/year) */
  landLeaseCostPerHaPerYear: number;
  /** Gender distribution of the labor force (must sum to 100%) */
  genderDistribution: GenderDistribution;
}

// ---------------------------------------------------------------------------
// Gender Distribution
// ---------------------------------------------------------------------------

/**
 * Breakdown of total labor hours by gender.
 * male + female + other must sum to 100%.
 */
export interface GenderDistribution {
  /** Percentage of labor hours from male workers (0–100) */
  male: number;
  /** Percentage of labor hours from female workers (0–100) */
  female: number;
  /** Percentage of labor hours from non-binary / other (0–100) */
  other: number;
}
