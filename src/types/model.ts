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

// ---------------------------------------------------------------------------
// Scenario Cost Structure
// ---------------------------------------------------------------------------

/**
 * Cost structure for a single scenario (favorable or unfavorable).
 * All figures in US$/ha over the full time horizon.
 *
 * Validation invariant:
 *   totalCost === implementationCost + maintenanceCost
 */
export interface ScenarioCosts {
  /** Total cost over the full time horizon (US$/ha) */
  totalCost: number;
  /** Implementation cost — year 1 only (US$/ha) */
  implementationCost: number;
  /** Maintenance cost — years 2 through T (US$/ha) */
  maintenanceCost: number;
}

// ---------------------------------------------------------------------------
// Context Variables
// ---------------------------------------------------------------------------

/** Categorical severity levels used for most context dimensions */
export type SeverityLevel = "low" | "medium" | "high";

/** Categorical levels for soil degradation */
export type SoilDegradationLevel = "none" | "moderate" | "severe";

/** Binary availability constraint */
export type BinaryConstraint = "yes" | "no";

/**
 * A single context constraint entry — captures the estimated cost,
 * when it is incurred, and how it breaks down across production factors.
 */
export interface ContextConstraintEntry {
  /** Estimated additional cost to address this constraint (US$/ha) */
  cost: number;
  /** Whether the cost applies to implementation (Year 1) */
  appliesToImplementation: boolean;
  /** Whether the cost applies to maintenance (Years 2–20) */
  appliesToMaintenance: boolean;
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
  /** Monitoring / Human Encroachment */
  humanEncroachment: ContextConstraintEntry;
}

// ---------------------------------------------------------------------------
// Restoration Method Type
// ---------------------------------------------------------------------------

/**
 * Each method type corresponds to a baseline ecological scenario
 * that determines the enrichment intensity and expected soil/propagule conditions.
 */
export type MethodType =
  | "natural_regeneration"
  | "anr_30"
  | "seed_dispersal"
  | "seedling_planting";

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
  /** Maintenance cost — years 2 through T (US$/ha) */
  maintenanceCost: number;
  /** Factor-of-production distribution for maintenance cost */
  maintenanceDistribution: FactorShares;
}

/**
 * Record mapping each method type to its baseline cost entry.
 */
export type MethodCosts = Record<MethodType, MethodCostEntry>;

// ---------------------------------------------------------------------------
// Assistance Activity Cost
// ---------------------------------------------------------------------------

/**
 * An assistance activity represents an additive cost component that is
 * required in the unfavorable scenario to achieve the same ecological outcome
 * as the favorable scenario.
 *
 * Cost additivity:
 *   C_unfavorable ≈ C_favorable + Σ_a C_a + interaction
 *
 * Each assistance has its own factor shares for regional extrapolation.
 */
export interface AssistanceCost {
  /** Activity name (e.g., "Fencing", "Firebreak") — matches a selected activity */
  name: string;
  /** Cost in US$/ha */
  cost: number;
  /** When the cost is incurred */
  phase: "implementation" | "maintenance" | "both";
  /** Breakdown by factor of production (must sum to 100%) */
  factorShares: FactorShares;
}

// ---------------------------------------------------------------------------
// Main Restoration Model
// ---------------------------------------------------------------------------

/**
 * The top-level data structure for one (ecosystem × method) model specification.
 * Each instance fully parameterises the economic model for a single combination.
 */
export interface RestorationModel {
  // ---- Identification ----
  /** Ecosystem name/type (e.g., "Atlantic Forest", "Cerrado") */
  ecosystem: string;
  /** Country where the project is located */
  country: string;
  /** Time horizon in years (fixed: 20) */
  timeHorizon: number;

  // ---- Restoration Method ----
  /** Baseline ecological method selected via tab interface */
  methodType: MethodType;
  /** Enrichment planting intensity (0–100%), derived from method tab */
  enrichmentIntensity: number;
  /** Baseline implementation + maintenance costs for ALL four method tabs */
  methodCosts: MethodCosts;

  // ---- Context & Scenario Definition ----
  /** Contextual conditions that describe the local site */
  contextVariables: ContextVariables;
  /** Assistance activities required in the unfavorable scenario */
  selectedAssistances: string[];

  // ---- Cost Estimates ----
  /** Cost under favorable conditions (no extra assistance) */
  favorableScenario: ScenarioCosts;
  /** Cost under unfavorable conditions (with all selected assistances) */
  unfavorableScenario: ScenarioCosts;

  // ---- Assistance Breakdown ----
  /** Individual cost for each selected assistance activity */
  assistanceCosts: AssistanceCost[];
  /**
   * Adjustment term (positive or negative) that accounts for cost interactions
   * between combined assistance activities. Reconciles additive model with reality.
   */
  interactionAdjustment: number;

  // ---- Factor Shares ----
  /** Factor shares for the favorable base cost */
  favorableFactorShares: FactorShares;
}

// ---------------------------------------------------------------------------
// Computed Fields (derived at runtime, never stored directly)
// ---------------------------------------------------------------------------

/**
 * Computed summary values derived from the model data.
 * These are recalculated on every form change for validation and display.
 */
export interface ComputedFields {
  /** Sum of all individual assistance costs (US$/ha) */
  totalAssistanceCost: number;
  /** favorableCost + totalAssistanceCost + interactionAdjustment */
  computedUnfavorableCost: number;
  /** declaredUnfavorableCost − computedUnfavorableCost */
  differenceFromDeclared: number;
  /** Whether the difference is within acceptable tolerance (default: 5%) */
  isWithinTolerance: boolean;
  /** Per-assistance cost breakdown for display */
  costBreakdownSummary: CostBreakdownItem[];
}

export interface CostBreakdownItem {
  name: string;
  costPerHa: number;
  phase: string;
}
