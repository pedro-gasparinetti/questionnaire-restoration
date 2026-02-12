/**
 * AssistanceDetailSection
 *
 * For each assistance activity selected in the Context section,
 * the consultant provides:
 *   - Cost in US$/ha (the additional cost of this specific activity)
 *   - Phase (implementation, maintenance, or both)
 *
 * Factor shares for each assistance are collected in the FactorShares section.
 *
 * The system also displays the reconciliation check:
 *   Favorable cost + Σ(assistance costs) + interaction ≈ Unfavorable cost
 */

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import type { RestorationModelFormData } from "../../schemas";
import type { ComputedFields } from "../../types";
import { ASSISTANCE_TYPES, EMPTY_FACTOR_SHARES } from "../../constants";
import { CollapsibleSection, FormField, FormSelect } from "../ui";
import { formatUSD } from "../../utils";

const PHASE_OPTIONS = [
  { value: "implementation", label: "Implementation (Year 1)" },
  { value: "maintenance", label: "Maintenance (Years 2–T)" },
  { value: "both", label: "Both" },
];

interface Props {
  computed: ComputedFields;
}

export function AssistanceDetailSection({ computed }: Props) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RestorationModelFormData>();

  const selectedAssistances = watch("selectedAssistances") || [];
  const assistanceCosts = watch("assistanceCosts") || [];

  // Sync assistanceCosts array with selectedAssistances whenever selection changes
  useEffect(() => {
    if (selectedAssistances.length === 0) {
      if (assistanceCosts.length > 0) {
        setValue("assistanceCosts", [], { shouldDirty: true });
      }
      return;
    }

    const updated = selectedAssistances.map((id: string) => {
      const existing = assistanceCosts.find((c: { name: string }) => c.name === id);
      return (
        existing || {
          name: id,
          cost: 0,
          phase: "implementation" as const,
          factorShares: { ...EMPTY_FACTOR_SHARES },
        }
      );
    });

    // Only update if the list actually changed to avoid infinite loops
    const currentNames = assistanceCosts.map((c: { name: string }) => c.name).join(",");
    const updatedNames = updated.map((c: { name: string }) => c.name).join(",");
    if (currentNames !== updatedNames) {
      setValue("assistanceCosts", updated, { shouldDirty: true });
    }
  }, [selectedAssistances.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const getLabel = (id: string) =>
    ASSISTANCE_TYPES.find((t) => t.id === id)?.label || id;

  if (selectedAssistances.length === 0) {
    return (
      <CollapsibleSection
        title="4. Assistance Cost Breakdown"
        subtitle="Detail the cost of each assistance activity"
      >
        <p className="form-empty">
          No assistance activities selected. Go back to the Context section and select
          the activities required in the unfavorable scenario.
        </p>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection
      title="4. Assistance Cost Breakdown"
      subtitle="Detail the cost of each assistance activity"
    >
      <p className="form-hint">
        For each assistance activity you selected, provide the <strong>additional
        cost per hectare</strong> that this activity adds to the restoration.
        Also indicate when this cost is incurred (implementation, maintenance, or both).
      </p>
      <p className="form-hint">
        The additive cost model assumes:
        <br />
        <em>Unfavorable cost ≈ Favorable cost + Σ(assistance costs) + interaction adjustment</em>
      </p>

      {selectedAssistances.map((id: string, index: number) => {
        const assistErrors = errors.assistanceCosts?.[index];

        return (
          <div key={id} className="assistance-card">
            <div className="assistance-card-header">
              <h4>{getLabel(id)}</h4>
            </div>
            <div className="form-grid form-grid--3">
              <FormField
                label="Cost"
                unit="US$/ha"
                type="number"
                min="0"
                step="0.01"
                registration={register(`assistanceCosts.${index}.cost`, {
                  valueAsNumber: true,
                })}
                error={assistErrors?.cost}
              />
              <FormSelect
                label="Phase"
                options={PHASE_OPTIONS}
                registration={register(`assistanceCosts.${index}.phase`)}
                error={assistErrors?.phase}
              />
            </div>
          </div>
        );
      })}

      {/* Interaction adjustment */}
      <h3 className="subsection-title">Interaction Adjustment</h3>
      <p className="form-hint">
        When multiple assistance activities are combined, costs may not be purely additive
        (e.g., shared infrastructure). Use this field to adjust up (+) or down (−):
      </p>
      <div className="form-grid">
        <FormField
          label="Interaction Adjustment"
          unit="US$/ha (+ or −)"
          type="number"
          step="0.01"
          registration={register("interactionAdjustment", { valueAsNumber: true })}
          error={errors.interactionAdjustment}
        />
      </div>

      {/* Reconciliation panel */}
      <div
        className={`reconciliation-panel ${
          computed.isWithinTolerance ? "reconciliation--ok" : "reconciliation--warn"
        }`}
      >
        <h4>Reconciliation Check</h4>
        <table className="reconciliation-table">
          <tbody>
            <tr>
              <td>Total Assistance Cost</td>
              <td>{formatUSD(computed.totalAssistanceCost)}/ha</td>
            </tr>
            <tr>
              <td>Computed Unfavorable (Favorable + Assistance + Adj.)</td>
              <td>{formatUSD(computed.computedUnfavorableCost)}/ha</td>
            </tr>
            <tr>
              <td>Declared Unfavorable (from Cost Estimates)</td>
              <td>{formatUSD(watch("unfavorableScenario.totalCost") || 0)}/ha</td>
            </tr>
            <tr>
              <td>Difference</td>
              <td>
                {computed.isWithinTolerance ? (
                  <span className="status-ok">
                    {formatUSD(computed.differenceFromDeclared)} ✓ within tolerance
                  </span>
                ) : (
                  <span className="status-warn">
                    {formatUSD(computed.differenceFromDeclared)} ⚠ outside tolerance
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  );
}
