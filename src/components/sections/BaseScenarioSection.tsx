/**
 * CostEstimatesSection
 *
 * Context constraints that apply independently of the restoration method.
 * Each constraint card captures: cost (unit varies per constraint), phase (implementation/maintenance),
 * and factor-of-production distribution (labor / machinery / materials).
 */

import { useFormContext } from "react-hook-form";
import type { RestorationModelFormData } from "../../schemas";
import { CollapsibleSection, FormField } from "../ui";

const CONTEXT_CONSTRAINTS = [
  { key: "fireRisk" as const, label: "Firebreak / Fire Risk", unit: "US$/ha" },
  { key: "grazingPressure" as const, label: "Fencing / Grazing Pressure", unit: "US$/km", unitWarning: "⚠ Note: this cost is per kilometre of fence (km), not per hectare." },
  { key: "invasiveSpeciesPressure" as const, label: "Weed Control / Invasive Species Pressure", unit: "US$/ha" },
  { key: "humanEncroachment" as const, label: "Monitoring / Human Encroachment", unit: "US$/ha" },
];

export function CostEstimatesSection() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<RestorationModelFormData>();

  const ctxErrors = errors.contextVariables;

  return (
    <CollapsibleSection
      title="3. Additional Context Variables &amp; Constraints"
      subtitle="Costs that apply independently of the restoration method"
    >
      <p className="form-hint">
        Given an unfavourable scenario with contextual constraints, estimate the{" "}
        <strong>additional cost</strong> required to overcome these constraints
        and achieve the same level of ecological success as in the favourable scenario.
        Pay attention to the unit of each cost field.
      </p>

      {CONTEXT_CONSTRAINTS.map((c) => {
        const distLabor = watch(`contextVariables.${c.key}.distribution.labor`);
        const distMach  = watch(`contextVariables.${c.key}.distribution.machinery`);
        const distMat   = watch(`contextVariables.${c.key}.distribution.materials`);
        const distSum   = (Number(distLabor) || 0) + (Number(distMach) || 0) + (Number(distMat) || 0);
        const distFilled = distSum > 0;

        return (
          <div key={c.key} className="constraint-card">
            <h4 className="constraint-card-title">{c.label}</h4>

            <div style={{ maxWidth: "280px" }}>
              <FormField
                label="Estimated Cost"
                unit={c.unit}
                type="number"
                min="0"
                step="0.01"
                registration={register(`contextVariables.${c.key}.cost`, { valueAsNumber: true })}
                error={ctxErrors?.[c.key]?.cost}
              />
              {c.unitWarning && (
                <p className="unit-warning" style={{ color: "#b45309", fontSize: "0.82rem", margin: "0.25rem 0 0", fontStyle: "italic" }}>
                  {c.unitWarning}
                </p>
              )}
            </div>

            <div className="constraint-phase">
              <span className="constraint-phase-label">Applies to:</span>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  {...register(`contextVariables.${c.key}.appliesToImplementation`)}
                />
                <span>Implementation (Year 1)</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  {...register(`contextVariables.${c.key}.appliesToMaintenance`)}
                />
                <span>Maintenance (Years 2–20)</span>
              </label>
            </div>

            <div className="cost-distribution" style={{ marginTop: "0.5rem" }}>
              <p className="cost-distribution-label">
                Cost distribution <span className="cost-distribution-hint">(must sum to 100%)</span>
                {distFilled && (
                  <span className={`cost-distribution-sum ${Math.abs(distSum - 100) < 0.01 ? "cost-distribution-sum--ok" : "cost-distribution-sum--warn"}`}>
                    {Math.abs(distSum - 100) < 0.01 ? "✓ 100%" : `Σ = ${distSum.toFixed(0)}%`}
                  </span>
                )}
              </p>
              {distFilled && Math.abs(distSum - 100) >= 0.01 && (
                <p className="cost-distribution-warning">
                  The distribution must sum to exactly 100%. Currently: {distSum.toFixed(1)}%.
                </p>
              )}
              <div className="cost-distribution-fields">
                <FormField
                  label="Labor %"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  registration={register(`contextVariables.${c.key}.distribution.labor`, { valueAsNumber: true })}
                  error={ctxErrors?.[c.key]?.distribution?.labor}
                />
                <FormField
                  label="Machinery %"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  registration={register(`contextVariables.${c.key}.distribution.machinery`, { valueAsNumber: true })}
                  error={ctxErrors?.[c.key]?.distribution?.machinery}
                />
                <FormField
                  label="Materials %"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  registration={register(`contextVariables.${c.key}.distribution.materials`, { valueAsNumber: true })}
                  error={ctxErrors?.[c.key]?.distribution?.materials}
                />
              </div>
            </div>
          </div>
        );
      })}
    </CollapsibleSection>
  );
}
