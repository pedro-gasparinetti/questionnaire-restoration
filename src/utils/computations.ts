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

import type { AssistanceCost, ComputedFields, CostBreakdownItem } from "../types";
import { RECONCILIATION_TOLERANCE } from "../constants";

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
