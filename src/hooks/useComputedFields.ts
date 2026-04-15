/**
 * Hook for computed / derived fields that update reactively
 * whenever the form values change.
 */

import { useMemo } from "react";
import type { RestorationModelFormData } from "../schemas";
import type { ComputedFields, AssistanceCost } from "../types";
import { computeFields } from "../utils";

export function useComputedFields(values: RestorationModelFormData): ComputedFields {
  return useMemo(() => {
    return computeFields(
      values.favorableScenario.totalCost,
      values.assistanceCosts as AssistanceCost[],
      values.unfavorableScenario.totalCost,
      values.interactionAdjustment ?? 0
    );
  }, [
    values.favorableScenario.totalCost,
    values.assistanceCosts,
    values.unfavorableScenario.totalCost,
    values.interactionAdjustment,
  ]);
}
