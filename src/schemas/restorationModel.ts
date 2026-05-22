/**
 * =============================================================================
 * Restoration Calculator – Zod Validation Schema
 * =============================================================================
 *
 * Mirrors the active questionnaire form. Validates:
 *   1. Factor-share distributions (labor + materials + machinery) per cost row
 *   2. Per-method implementation/maintenance costs and segments
 *   3. Context constraints (fire/fence/weed/ant) — shared across methods
 *   4. Labor breakdown (hired/family, gender, rates)
 *
 * Consumed by @hookform/resolvers for React Hook Form validation.
 * =============================================================================
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Cost distribution (labor / materials / machinery — must sum to 100%)
// ---------------------------------------------------------------------------

export const costDistributionSchema = z.object({
  labor:     z.number({ message: "Labor % is required" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
  materials: z.number({ message: "Materials % is required" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
  machinery: z.number({ message: "Machinery % is required" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
});

// ---------------------------------------------------------------------------
// Year-range segments (shared base for maintenance / productivity / revenue)
// ---------------------------------------------------------------------------

export const yearRangeSegmentSchema = z.object({
  id: z.string().min(1, "Segment id is required"),
  label: z.string().default(""),
  yearFrom: z.number({ message: "Start year is required" }).int("Must be a whole number").min(2, "Minimum year 2 (year 1 is implementation)").max(20, "Maximum 20 years"),
  yearTo:   z.number({ message: "End year is required" }).int("Must be a whole number").min(2, "Minimum year 2 (year 1 is implementation)").max(20, "Maximum 20 years"),
}).refine((segment) => segment.yearTo >= segment.yearFrom, {
  message: "End year must be greater than or equal to start year",
  path: ["yearTo"],
});

export const costSegmentSchema         = yearRangeSegmentSchema.extend({ cost:         z.number({ message: "Cost is required" }).min(0, "Cannot be negative") });
export const revenueSegmentSchema      = yearRangeSegmentSchema.extend({ revenue:      z.number({ message: "Revenue is required" }).min(0, "Cannot be negative") });
export const productivitySegmentSchema = yearRangeSegmentSchema.extend({ productivity: z.number({ message: "Productivity is required" }).min(0, "Cannot be negative") });

// ---------------------------------------------------------------------------
// Context constraints (Section 3 — shared across all methods)
// ---------------------------------------------------------------------------

export const contextConstraintEntrySchema = z.object({
  cost:          z.number({ message: "Cost is required" }).min(0, "Cannot be negative"),
  occurrences:   z.number({ message: "Number of occurrences is required" }).int("Must be a whole number").min(0, "Cannot be negative"),
  firebreakArea: z.number().min(0, "Cannot be negative").optional().default(0),
  distribution:  costDistributionSchema,
});

export const contextVariablesSchema = z.object({
  fireRisk:                contextConstraintEntrySchema,
  grazingPressure:         contextConstraintEntrySchema,
  invasiveSpeciesPressure: contextConstraintEntrySchema,
  pestControl:             contextConstraintEntrySchema,
});

// ---------------------------------------------------------------------------
// Per-method cost entry (Section 2 — per tab)
// ---------------------------------------------------------------------------

export const methodCostEntrySchema = z.object({
  implementationCost:         z.number({ message: "Implementation cost is required" }).min(0, "Cannot be negative"),
  implementationDistribution: costDistributionSchema,
  // derived from maintenanceSegments by CostTimelineBuilder (cache)
  maintenanceCost:            z.number({ message: "Maintenance cost is required" }).min(0, "Cannot be negative"),
  maintenanceDistribution:    costDistributionSchema,
  ntfpSpecies:                z.string().optional().default(""),
  // derived from ntfpProductivitySegments (cache)
  ntfpProductivity:           z.number().min(0, "Cannot be negative").optional().default(0),
  ntfpPrice:                  z.number().min(0, "Cannot be negative").optional().default(0),
  // derived from ntfpRevenueSegments (cache)
  ntfpRevenue:                z.number().min(0, "Cannot be negative").optional().default(0),
  ntfpDataMode:               z.enum(["production", "revenue"]).optional().default("production"),
  maintenanceSegments:        z.array(costSegmentSchema).optional().default([]),
  ntfpProductivitySegments:   z.array(productivitySegmentSchema).optional().default([]),
  ntfpRevenueSegments:        z.array(revenueSegmentSchema).optional().default([]),
});

const METHOD_ID_ENUM = z.enum([
  "anr_30", "anr_30_ntfp",
  "seed_dispersal", "seed_dispersal_ntfp",
  "seedling_planting", "seedling_planting_ntfp",
]);

export const methodCostsSchema = z.object({
  anr_30:                 methodCostEntrySchema,
  anr_30_ntfp:            methodCostEntrySchema,
  seed_dispersal:         methodCostEntrySchema,
  seed_dispersal_ntfp:    methodCostEntrySchema,
  seedling_planting:      methodCostEntrySchema,
  seedling_planting_ntfp: methodCostEntrySchema,
});

// ---------------------------------------------------------------------------
// Full Restoration Model Schema
// ---------------------------------------------------------------------------

export const restorationModelSchema = z.object({
  // User identification
  userName:           z.string().optional().default(""),
  dataCollectionDate: z.string().optional().default(""),

  // Project identification
  respondentName: z.string().optional().default(""),
  gpsCoordinates: z.string().optional().default(""),
  ecosystem:      z.string().min(1, "Ecosystem is required"),
  country:        z.string().optional().default(""),
  city:           z.string().optional().default(""),
  timeHorizon:    z.literal(20).default(20),

  // Methods the user opts out of (those tabs disappear from the UI)
  disabledMethods: z.array(METHOD_ID_ENUM).optional().default([]),

  // Active tab + its preset enrichment intensity
  methodType:          METHOD_ID_ENUM,
  enrichmentIntensity: z.number().min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),

  // Per-method costs + NTFP details
  methodCosts: methodCostsSchema,

  // Section 3: context constraints (shared)
  contextVariables: contextVariablesSchema,

  // Section 4: labor breakdown (shared)
  laborBreakdown: z.object({
    implementation: z.object({
      hiredLabor:  z.number({ message: "Hired Labour % is required" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
      familyLabor: z.number({ message: "Non Hired Labour % is required" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
    }),
    maintenance: z.object({
      hiredLabor:  z.number({ message: "Hired Labour % is required" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
      familyLabor: z.number({ message: "Non Hired Labour % is required" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
    }),
    hiredLaborCostPerDay:      z.number({ message: "Hired labor cost is required" }).min(0, "Cannot be negative").default(0),
    machineryUnitCostPerHour:  z.number({ message: "Machinery unit cost is required" }).min(0, "Cannot be negative").default(0),
    landLeaseCostPerHaPerYear: z.number({ message: "Land lease cost is required" }).min(0, "Cannot be negative").default(0),
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
