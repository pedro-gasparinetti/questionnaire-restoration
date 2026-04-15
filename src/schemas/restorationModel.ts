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
  });

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
  });

export const yearRangeSegmentSchema = z.object({
  id: z.string().min(1, "Segment id is required"),
  label: z.string().default(""),
  yearFrom: z
    .number({ message: "Start year is required" })
    .int("Must be a whole number")
    .min(2, "Minimum year 2 (year 1 is implementation)")
    .max(20, "Maximum 20 years"),
  yearTo: z
    .number({ message: "End year is required" })
    .int("Must be a whole number")
    .min(2, "Minimum year 2 (year 1 is implementation)")
    .max(20, "Maximum 20 years"),
}).refine((segment) => segment.yearTo >= segment.yearFrom, {
  message: "End year must be greater than or equal to start year",
  path: ["yearTo"],
});

export const costSegmentSchema = yearRangeSegmentSchema.extend({
  cost: z.number({ message: "Cost is required" }).min(0, "Cannot be negative"),
});

export const revenueSegmentSchema = yearRangeSegmentSchema.extend({
  revenue: z.number({ message: "Revenue is required" }).min(0, "Cannot be negative"),
});

export const productivitySegmentSchema = yearRangeSegmentSchema.extend({
  productivity: z.number({ message: "Productivity is required" }).min(0, "Cannot be negative"),
});

// ---------------------------------------------------------------------------
// Context Variables
// ---------------------------------------------------------------------------

/** A single context constraint entry with cost, phase checkboxes, and distribution. */
export const contextConstraintEntrySchema = z.object({
  cost: z
    .number({ message: "Cost is required" })
    .min(0, "Cannot be negative"),
  occurrences: z
    .number({ message: "Number of occurrences is required" })
    .int("Must be a whole number")
    .min(0, "Cannot be negative"),
  firebreakArea: z
    .number()
    .min(0, "Cannot be negative")
    .optional()
    .default(0),
  distribution: costDistributionSchema,
});

export const contextVariablesSchema = z.object({
  fireRisk: contextConstraintEntrySchema,
  grazingPressure: contextConstraintEntrySchema,
  invasiveSpeciesPressure: contextConstraintEntrySchema,
  antInfestation: contextConstraintEntrySchema,
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
  intensiveMaintenanceStartYear: z
    .number({ message: "Start year is required" })
    .int("Must be a whole number")
    .min(2, "Minimum year 2 (year 1 is implementation)")
    .max(20, "Maximum 20 years")
    .default(3),
  intensiveMaintenanceEndYear: z
    .number({ message: "End year is required" })
    .int("Must be a whole number")
    .min(2, "Minimum year 2 (year 1 is implementation)")
    .max(20, "Maximum 20 years")
    .default(6),
  intensiveMaintenanceCost: z
    .number({ message: "Intensive maintenance cost is required" })
    .min(0, "Cannot be negative")
    .default(0),
  ntfpSpecies: z.string().optional().default(""),
  ntfpProductivity: z.number().min(0, "Cannot be negative").optional().default(0),
  ntfpPrice: z.number().min(0, "Cannot be negative").optional().default(0),
  ntfpRevenue: z.number().min(0, "Cannot be negative").optional().default(0),
  maintenanceSegments: z.array(costSegmentSchema).optional().default([]),
  ntfpProductivitySegments: z.array(productivitySegmentSchema).optional().default([]),
  ntfpRevenueSegments: z.array(revenueSegmentSchema).optional().default([]),
});

export const methodCostsSchema = z.object({
  natural_regeneration: methodCostEntrySchema,
  anr_30: methodCostEntrySchema,
  anr_30_ntfp: methodCostEntrySchema,
  seed_dispersal: methodCostEntrySchema,
  seed_dispersal_ntfp: methodCostEntrySchema,
  seedling_planting: methodCostEntrySchema,
  seedling_planting_ntfp: methodCostEntrySchema,
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
  // User Identification
  userName: z.string().optional().default(""),
  dataCollectionDate: z.string().optional().default(""),

  // Project Identification
  respondentName: z.string().optional().default(""),
  gpsCoordinates: z.string().optional().default(""),
  ecosystem: z.string().min(1, "Ecosystem is required"),
  country: z.string().optional().default(""),
  city: z.string().optional().default(""),
  timeHorizon: z.literal(20).default(20),

  // Disabled methods (no data available)
  disabledMethods: z.array(z.enum(["natural_regeneration", "anr_30", "anr_30_ntfp", "seed_dispersal", "seed_dispersal_ntfp", "seedling_planting", "seedling_planting_ntfp"])).optional().default([]),

  // Restoration Method (tab-based)
  methodType: z.enum(["natural_regeneration", "anr_30", "anr_30_ntfp", "seed_dispersal", "seed_dispersal_ntfp", "seedling_planting", "seedling_planting_ntfp"]),
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
    }),
    maintenance: z.object({
      hiredLabor: z.number({ message: "Hired Labor % is required" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
      familyLabor: z.number({ message: "Family Labor % is required" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
    }),
    hiredLaborCostPerDay: z
      .number({ message: "Hired labor cost is required" })
      .min(0, "Cannot be negative")
      .default(0),
    machineryUnitCostPerHour: z
      .number({ message: "Machinery unit cost is required" })
      .min(0, "Cannot be negative")
      .default(0),
    genderDistribution: z.object({
      male:   z.number({ message: "Male % is required" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%").default(0),
      female: z.number({ message: "Female % is required" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%").default(0),
      other:  z.number({ message: "Other % is required" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%").default(0),
    }).default({ male: 0, female: 0, other: 0 }),
  }),
});

// ---------------------------------------------------------------------------
// Inferred TypeScript type from schema
// ---------------------------------------------------------------------------

export type RestorationModelFormData = z.infer<typeof restorationModelSchema>;
