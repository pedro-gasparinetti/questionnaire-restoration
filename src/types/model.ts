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
 * Context variables describe the local conditions of the restoration site.
 * They determine which assistance activities are needed in the unfavorable
 * scenario. Context does NOT directly affect carbon — it only drives costs.
 */
export interface ContextVariables {
  fireRisk: SeverityLevel;
  soilDegradation: SoilDegradationLevel;
  grazingPressure: SeverityLevel;
  invasiveSpeciesPressure: SeverityLevel;
  humanEncroachment: SeverityLevel;
  seedAvailabilityConstraint: BinaryConstraint;
}

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
  /** Restoration method (e.g., "Natural regeneration", "Total planting") */
  method: string;
  /** Time horizon in years (default: 20) */
  timeHorizon: number;

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
