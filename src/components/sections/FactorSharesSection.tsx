/**
 * FactorSharesSection
 *
 * Collects factor-of-production shares (Labor / Materials / Machinery)
 * for the favorable base cost and for each individual assistance activity.
 *
 * Shares must sum to 100% within each group. These shares enable
 * regional cost extrapolation via local price indices:
 *
 *   AdjustedCost_k = Σ_f (share_f × priceIndex_f × BaseCost_k)
 *
 * This section only appears after the consultant has entered costs.
 */

import { useFormContext } from "react-hook-form";
import type { RestorationModelFormData } from "../../schemas";
import { ASSISTANCE_TYPES } from "../../constants";
import { CollapsibleSection, FormField } from "../ui";

export function FactorSharesSection() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<RestorationModelFormData>();

  const selectedAssistances = watch("selectedAssistances") || [];
  const assistanceCosts = watch("assistanceCosts") || [];

  const getLabel = (id: string) =>
    ASSISTANCE_TYPES.find((t) => t.id === id)?.label || id;

  return (
    <CollapsibleSection
      title="5. Factor of Production Shares"
      subtitle="Breakdown by Labor, Materials, and Machinery/Services"
    >
      <p className="form-hint">
        For each cost component, indicate how the cost is distributed across
        factors of production. Each row must sum to <strong>100%</strong>.
        This enables the model to adjust costs for different regions based on
        local price indices.
      </p>

      {/* Favorable base factor shares */}
      <h3 className="subsection-title">Favorable Scenario (Base Cost)</h3>
      <p className="form-hint">
        How is the favorable-scenario restoration cost divided among labor,
        materials, and machinery/services?
      </p>
      <div className="form-grid form-grid--3">
        <FormField
          label="Labor"
          unit="%"
          type="number"
          min="0"
          max="100"
          step="0.1"
          registration={register("favorableFactorShares.labor", {
            valueAsNumber: true,
          })}
          error={errors.favorableFactorShares?.labor}
        />
        <FormField
          label="Materials"
          unit="%"
          type="number"
          min="0"
          max="100"
          step="0.1"
          registration={register("favorableFactorShares.materials", {
            valueAsNumber: true,
          })}
          error={errors.favorableFactorShares?.materials}
        />
        <FormField
          label="Machinery / Services"
          unit="%"
          type="number"
          min="0"
          max="100"
          step="0.1"
          registration={register("favorableFactorShares.machinery", {
            valueAsNumber: true,
          })}
          error={errors.favorableFactorShares?.machinery}
        />
      </div>

      {/* Factor shares for each assistance activity */}
      {selectedAssistances.length > 0 && (
        <>
          <h3 className="subsection-title">Assistance Activities</h3>
          <p className="form-hint">
            For each assistance activity, how is its cost distributed?
          </p>

          {selectedAssistances.map((id: string, index: number) => {
            // Only show if we have cost data for this index
            if (index >= assistanceCosts.length) return null;

            const assistErrors = errors.assistanceCosts?.[index]?.factorShares;

            return (
              <div key={id} className="factor-shares-row">
                <h4 className="factor-shares-label">{getLabel(id)}</h4>
                <div className="form-grid form-grid--3">
                  <FormField
                    label="Labor"
                    unit="%"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    registration={register(
                      `assistanceCosts.${index}.factorShares.labor`,
                      { valueAsNumber: true }
                    )}
                    error={assistErrors?.labor}
                  />
                  <FormField
                    label="Materials"
                    unit="%"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    registration={register(
                      `assistanceCosts.${index}.factorShares.materials`,
                      { valueAsNumber: true }
                    )}
                    error={assistErrors?.materials}
                  />
                  <FormField
                    label="Machinery / Services"
                    unit="%"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    registration={register(
                      `assistanceCosts.${index}.factorShares.machinery`,
                      { valueAsNumber: true }
                    )}
                    error={assistErrors?.machinery}
                  />
                </div>
              </div>
            );
          })}
        </>
      )}
    </CollapsibleSection>
  );
}
