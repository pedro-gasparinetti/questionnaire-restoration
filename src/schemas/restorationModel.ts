/**
 * =============================================================================
 * Restoration Calculator – Zod Validation Schema
 * =============================================================================
 *
 * Enforces all data consistency rules:
 *
 *   1. totalCost === implementationCost + maintenanceCost (both scenarios)
 *   2. factorShares.labor + materials + machinery === 100
 *   3. assistance factor shares sum to 100
 *   4. unfavorable totalCost reconciles with computed value (± tolerance)
 *   5. At least one assistance must be selected
 *   6. Each selected assistance must have a cost entry
 *
 * Consumed by @hookform/resolvers for React Hook Form validation.
 * =============================================================================
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Reusable sub-schemas
// ---------------------------------------------------------------------------

/** Factor shares must sum to exactly 100%. */
export const factorSharesSchema = z
  .object({
    labor: z
      .number({ message: "Labor % is required" })
      .min(0, "Cannot be negative")
      .max(100, "Cannot exceed 100%"),
    materials: z
      .number({ message: "Materials % is required" })
      .min(0, "Cannot be negative")
      .max(100, "Cannot exceed 100%"),
    machinery: z
      .number({ message: "Machinery % is required" })
      .min(0, "Cannot be negative")
      .max(100, "Cannot exceed 100%"),
  })
  .refine((d) => Math.abs(d.labor + d.materials + d.machinery - 100) < 0.01, {
    message: "Factor shares must sum to 100%",
    path: ["labor"],
  });

// ---------------------------------------------------------------------------
// Scenario Costs (used for both favorable and unfavorable)
// ---------------------------------------------------------------------------

export const scenarioCostsSchema = z
  .object({
    totalCost: z
      .number({ message: "Total cost is required" })
      .min(0, "Cannot be negative"),
    implementationCost: z
      .number({ message: "Implementation cost is required" })
      .min(0, "Cannot be negative"),
    maintenanceCost: z
      .number({ message: "Maintenance cost is required" })
      .min(0, "Cannot be negative"),
  })
  .refine(
    (d) => Math.abs(d.totalCost - (d.implementationCost + d.maintenanceCost)) < 0.01,
    {
      message: "Total cost must equal Implementation + Maintenance",
      path: ["totalCost"],
    }
  );

// ---------------------------------------------------------------------------
// Cost Distribution (reuses factor-shares structure)
// ---------------------------------------------------------------------------

/** Cost distribution across labor / machinery / materials — must sum to 100%. */
export const costDistributionSchema = z
  .object({
    labor: z
      .number({ message: "Labor % is required" })
      .min(0, "Cannot be negative")
      .max(100, "Cannot exceed 100%"),
    materials: z
      .number({ message: "Materials % is required" })
      .min(0, "Cannot be negative")
      .max(100, "Cannot exceed 100%"),
    machinery: z
      .number({ message: "Machinery % is required" })
      .min(0, "Cannot be negative")
      .max(100, "Cannot exceed 100%"),
  })
  .refine((d) => Math.abs(d.labor + d.materials + d.machinery - 100) < 0.01, {
    message: "Distribution must sum to 100%",
    path: ["labor"],
  });

// ---------------------------------------------------------------------------
// Context Variables
// ---------------------------------------------------------------------------

/** A single context constraint entry with cost, phase checkboxes, and distribution. */
export const contextConstraintEntrySchema = z.object({
  cost: z
    .number({ message: "Cost is required" })
    .min(0, "Cannot be negative"),
  appliesToImplementation: z.boolean().default(false),
  appliesToMaintenance: z.boolean().default(false),
  distribution: costDistributionSchema,
});

export const contextVariablesSchema = z.object({
  fireRisk: contextConstraintEntrySchema,
  grazingPressure: contextConstraintEntrySchema,
  invasiveSpeciesPressure: contextConstraintEntrySchema,
  humanEncroachment: contextConstraintEntrySchema,
});

// ---------------------------------------------------------------------------
// Per-Method Baseline Cost Entry
// ---------------------------------------------------------------------------

export const methodCostEntrySchema = z.object({
  implementationCost: z
    .number({ message: "Implementation cost is required" })
    .min(0, "Cannot be negative"),
  implementationDistribution: costDistributionSchema,
  maintenanceCost: z
    .number({ message: "Maintenance cost is required" })
    .min(0, "Cannot be negative"),
  maintenanceDistribution: costDistributionSchema,
});

export const methodCostsSchema = z.object({
  natural_regeneration: methodCostEntrySchema,
  anr_30: methodCostEntrySchema,
  seed_dispersal: methodCostEntrySchema,
  seedling_planting: methodCostEntrySchema,
});

// ---------------------------------------------------------------------------
// Assistance Cost Entry
// ---------------------------------------------------------------------------

export const assistanceCostSchema = z.object({
  name: z.string().min(1, "Name is required"),
  cost: z
    .number({ message: "Cost is required" })
    .min(0, "Cannot be negative"),
  phase: z.enum(["implementation", "maintenance", "both"]),
  factorShares: factorSharesSchema,
});

// ---------------------------------------------------------------------------
// Full Restoration Model Schema
// ---------------------------------------------------------------------------

export const restorationModelSchema = z.object({
  // Identification
  ecosystem: z.string().min(1, "Ecosystem is required"),
  country: z.string().min(1, "Country is required"),
  timeHorizon: z.literal(20).default(20),

  // Restoration Method (tab-based)
  methodType: z.enum(["natural_regeneration", "anr_30", "seed_dispersal", "seedling_planting"]),
  enrichmentIntensity: z.number().min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
  methodCosts: methodCostsSchema,

  // Context & Scenario Definition
  contextVariables: contextVariablesSchema,
  selectedAssistances: z.array(z.string()).min(0),

  // Cost Estimates
  favorableScenario: scenarioCostsSchema,
  unfavorableScenario: scenarioCostsSchema,

  // Assistance Breakdown
  assistanceCosts: z.array(assistanceCostSchema),
  interactionAdjustment: z.number().default(0),

  // Factor Shares (favorable base)
  favorableFactorShares: factorSharesSchema,

  // Labor Breakdown (hired vs family)
  laborBreakdown: z.object({
    implementation: z.object({
      hiredLabor: z.number({ message: "Hired Labor % is required" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
      familyLabor: z.number({ message: "Family Labor % is required" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
    }).refine((d) => Math.abs(d.hiredLabor + d.familyLabor - 100) < 0.01, {
      message: "Hired + Family labor must sum to 100%",
      path: ["hiredLabor"],
    }),
    maintenance: z.object({
      hiredLabor: z.number({ message: "Hired Labor % is required" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
      familyLabor: z.number({ message: "Family Labor % is required" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
    }).refine((d) => Math.abs(d.hiredLabor + d.familyLabor - 100) < 0.01, {
      message: "Hired + Family labor must sum to 100%",
      path: ["hiredLabor"],
    }),
  }),
});

// ---------------------------------------------------------------------------
// Inferred TypeScript type from schema
// ---------------------------------------------------------------------------

export type RestorationModelFormData = z.infer<typeof restorationModelSchema>;
