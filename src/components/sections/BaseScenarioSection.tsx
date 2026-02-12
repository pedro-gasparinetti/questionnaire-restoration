/**
 * CostEstimatesSection
 *
 * After defining the context and required assistances, the consultant
 * provides aggregate cost estimates for both scenarios:
 *
 *   Favorable scenario: Total cost under ideal conditions (no extra assistance)
 *   Unfavorable scenario: Total cost with all selected assistances active
 *
 * For each scenario: Total cost, Implementation cost (year 1), Maintenance (years 2–T).
 * Validation: Total = Implementation + Maintenance.
 *
 * This is an aggregate estimate — detailed breakdown comes in later sections.
 */

import { useFormContext } from "react-hook-form";
import type { RestorationModelFormData } from "../../schemas";
import { CollapsibleSection, FormField } from "../ui";

export function CostEstimatesSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<RestorationModelFormData>();

  const favErrors = errors.favorableScenario;
  const unfavErrors = errors.unfavorableScenario;

  return (
    <CollapsibleSection
      title="3. Cost Estimates"
      subtitle="Aggregate costs for both the favorable and unfavorable scenarios"
    >
      <p className="form-hint">
        Based on the context you defined, please provide your best estimate
        of the <strong>total restoration cost per hectare</strong> for each scenario
        over the full time horizon. Then split that total between implementation
        (year 1) and maintenance (years 2 onward).
      </p>

      {/* Favorable scenario */}
      <h3 className="subsection-title">Favorable Scenario</h3>
      <p className="form-hint">
        Cost under the best conditions — no additional assistance activities are needed.
      </p>
      <div className="form-grid form-grid--3">
        <FormField
          label="Total Cost"
          unit="US$/ha"
          type="number"
          min="0"
          step="0.01"
          registration={register("favorableScenario.totalCost", { valueAsNumber: true })}
          error={favErrors?.totalCost}
        />
        <FormField
          label="Implementation (Year 1)"
          unit="US$/ha"
          type="number"
          min="0"
          step="0.01"
          registration={register("favorableScenario.implementationCost", { valueAsNumber: true })}
          error={favErrors?.implementationCost}
        />
        <FormField
          label="Maintenance (Years 2–T)"
          unit="US$/ha"
          type="number"
          min="0"
          step="0.01"
          registration={register("favorableScenario.maintenanceCost", { valueAsNumber: true })}
          error={favErrors?.maintenanceCost}
        />
      </div>
      {favErrors?.root && (
        <p className="form-error form-error--block">{favErrors.root.message}</p>
      )}

      {/* Unfavorable scenario */}
      <h3 className="subsection-title">Unfavorable Scenario</h3>
      <p className="form-hint">
        Cost when all the assistance activities you selected are required.
        This should reflect the total cost including the base restoration plus all
        additional assistance costs.
      </p>
      <div className="form-grid form-grid--3">
        <FormField
          label="Total Cost"
          unit="US$/ha"
          type="number"
          min="0"
          step="0.01"
          registration={register("unfavorableScenario.totalCost", { valueAsNumber: true })}
          error={unfavErrors?.totalCost}
        />
        <FormField
          label="Implementation (Year 1)"
          unit="US$/ha"
          type="number"
          min="0"
          step="0.01"
          registration={register("unfavorableScenario.implementationCost", { valueAsNumber: true })}
          error={unfavErrors?.implementationCost}
        />
        <FormField
          label="Maintenance (Years 2–T)"
          unit="US$/ha"
          type="number"
          min="0"
          step="0.01"
          registration={register("unfavorableScenario.maintenanceCost", { valueAsNumber: true })}
          error={unfavErrors?.maintenanceCost}
        />
      </div>
      {unfavErrors?.root && (
        <p className="form-error form-error--block">{unfavErrors.root.message}</p>
      )}
    </CollapsibleSection>
  );
}
