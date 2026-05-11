/**
 * Utility helpers for the active questionnaire flow.
 *
 * Only the pieces the rendered form actually consumes are kept here:
 *   - `atLeastOneMethodTabComplete`: gates the Export button.
 *   - `formatUSD`: shared currency formatter.
 *   - `generateExportFilename`: builds the .xlsx filename for download.
 */

import type { MethodCosts } from "../types";

/**
 * A method tab is "complete" when both implementation and maintenance costs
 * are > 0 and both distributions sum to 100%. The Export button stays
 * disabled until at least one tab passes this check.
 */
export function atLeastOneMethodTabComplete(methodCosts: MethodCosts | undefined): boolean {
  if (!methodCosts) return false;
  const tabs = [
    "anr_30", "anr_30_ntfp",
    "seed_dispersal", "seed_dispersal_ntfp",
    "seedling_planting", "seedling_planting_ntfp",
  ] as const;
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

/** Format a number as US currency (used by various UI components). */
export function formatUSD(value: number): string {
  return `US$ ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Build a timestamped filename for the .xlsx export. */
export function generateExportFilename(ecosystem: string, method: string): string {
  const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  const eco = ecosystem.replace(/\s+/g, "_") || "unknown";
  const mth = method.replace(/\s+/g, "_") || "unknown";
  return `restoration_${eco}_${mth}_${ts}.json`;
}
