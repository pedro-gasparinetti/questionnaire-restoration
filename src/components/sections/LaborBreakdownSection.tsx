/**
 * LaborBreakdownSection
 *
 * Captures the breakdown of total labor hours into hired labor vs family labor,
 * separately for implementation (Year 1) and maintenance (Years 2–T) phases.
 *
 * Each row must sum to 100%.
 */

import { useFormContext } from "react-hook-form";
import type { RestorationModelFormData } from "../../schemas";
import { CollapsibleSection, FormField } from "../ui";

export function LaborBreakdownSection() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<RestorationModelFormData>();

  const implHired  = watch("laborBreakdown.implementation.hiredLabor");
  const implFamily = watch("laborBreakdown.implementation.familyLabor");
  const maintHired  = watch("laborBreakdown.maintenance.hiredLabor");
  const maintFamily = watch("laborBreakdown.maintenance.familyLabor");

  const implSum  = (Number(implHired) || 0) + (Number(implFamily) || 0);
  const maintSum = (Number(maintHired) || 0) + (Number(maintFamily) || 0);

  const implFilled  = implSum > 0;
  const maintFilled = maintSum > 0;

  const laborErrors = errors.laborBreakdown;

  return (
    <CollapsibleSection
      title="Labor Breakdown"
      subtitle="Hired Labor vs Family Labor — by phase"
    >
      <p className="form-hint">
        Of the total labor hours involved in the restoration project, what
        percentage corresponds to <strong>hired labor</strong> (paid workers) and
        what percentage to <strong>family labor</strong> (unpaid household
        members)?
      </p>
      <p className="form-hint">
        Please provide estimates for each phase. Each row must sum to{" "}
        <strong>100%</strong>.
      </p>

      {/* Implementation phase */}
      <h3 className="subsection-title">Implementation (Year 1)</h3>
      <div className="cost-distribution" style={{ marginTop: "0.25rem" }}>
        <p className="cost-distribution-label">
          Labor hour distribution
          {implFilled && (
            <span
              className={`cost-distribution-sum ${
                Math.abs(implSum - 100) < 0.01
                  ? "cost-distribution-sum--ok"
                  : "cost-distribution-sum--warn"
              }`}
            >
              {Math.abs(implSum - 100) < 0.01
                ? "✓ 100%"
                : `Σ = ${implSum.toFixed(0)}%`}
            </span>
          )}
        </p>
        {implFilled && Math.abs(implSum - 100) >= 0.01 && (
          <p className="cost-distribution-warning">
            Hired + Family labor must sum to 100%. Currently: {implSum.toFixed(1)}%.
          </p>
        )}
        <div className="form-grid form-grid--2">
          <FormField
            label="Hired Labor"
            unit="%"
            type="number"
            min="0"
            max="100"
            step="1"
            registration={register(
              "laborBreakdown.implementation.hiredLabor",
              { valueAsNumber: true }
            )}
            error={laborErrors?.implementation?.hiredLabor}
          />
          <FormField
            label="Family Labor"
            unit="%"
            type="number"
            min="0"
            max="100"
            step="1"
            registration={register(
              "laborBreakdown.implementation.familyLabor",
              { valueAsNumber: true }
            )}
            error={laborErrors?.implementation?.familyLabor}
          />
        </div>
      </div>

      {/* Maintenance phase */}
      <h3 className="subsection-title" style={{ marginTop: "1.25rem" }}>
        Maintenance (Years 2–20)
      </h3>
      <div className="cost-distribution" style={{ marginTop: "0.25rem" }}>
        <p className="cost-distribution-label">
          Labor hour distribution
          {maintFilled && (
            <span
              className={`cost-distribution-sum ${
                Math.abs(maintSum - 100) < 0.01
                  ? "cost-distribution-sum--ok"
                  : "cost-distribution-sum--warn"
              }`}
            >
              {Math.abs(maintSum - 100) < 0.01
                ? "✓ 100%"
                : `Σ = ${maintSum.toFixed(0)}%`}
            </span>
          )}
        </p>
        {maintFilled && Math.abs(maintSum - 100) >= 0.01 && (
          <p className="cost-distribution-warning">
            Hired + Family labor must sum to 100%. Currently:{" "}
            {maintSum.toFixed(1)}%.
          </p>
        )}
        <div className="form-grid form-grid--2">
          <FormField
            label="Hired Labor"
            unit="%"
            type="number"
            min="0"
            max="100"
            step="1"
            registration={register(
              "laborBreakdown.maintenance.hiredLabor",
              { valueAsNumber: true }
            )}
            error={laborErrors?.maintenance?.hiredLabor}
          />
          <FormField
            label="Family Labor"
            unit="%"
            type="number"
            min="0"
            max="100"
            step="1"
            registration={register(
              "laborBreakdown.maintenance.familyLabor",
              { valueAsNumber: true }
            )}
            error={laborErrors?.maintenance?.familyLabor}
          />
        </div>
      </div>

      {/* Hired Labor Cost Reference */}
      <div className="labor-rate-box" style={{ marginTop: "1.5rem" }}>
        <h5 className="labor-rate-title">Hired Labor Cost Reference</h5>
        <div style={{ maxWidth: "280px" }}>
          <FormField
            label="Hired Labor Cost"
            unit="US$/day"
            type="number"
            min="0"
            step="0.01"
            registration={register("laborBreakdown.hiredLaborCostPerDay", {
              valueAsNumber: true,
            })}
            error={laborErrors?.hiredLaborCostPerDay}
          />
        </div>
        <p className="labor-rate-hint">
          Average daily wage for hired field workers in this region.
        </p>
      </div>
    </CollapsibleSection>
  );
}
