/**
 * LaborBreakdownSection
 *
 * Captures the breakdown of total labor hours into hired labor vs non-hired labor,
 * separately for implementation (Year 1) and maintenance (Years 2–T) phases,
 * plus an overall gender distribution of the workforce.
 *
 * Each distribution must sum to 100%.
 */

import { useFormContext } from "react-hook-form";
import type { RestorationModelFormData } from "../../schemas";
import { CollapsibleSection, FormField, DistributionPie } from "../ui";
import { HardHat } from "lucide-react";

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
  const genderMale   = watch("laborBreakdown.genderDistribution.male");
  const genderFemale = watch("laborBreakdown.genderDistribution.female");
  const genderOther  = watch("laborBreakdown.genderDistribution.other");

  const implSum   = (Number(implHired) || 0) + (Number(implFamily) || 0);
  const maintSum  = (Number(maintHired) || 0) + (Number(maintFamily) || 0);
  const genderSum = (Number(genderMale) || 0) + (Number(genderFemale) || 0) + (Number(genderOther) || 0);

  const laborErrors = errors.laborBreakdown;

  return (
    <CollapsibleSection
      title="4. Labor Breakdown &amp; Machinery"
      subtitle="Hired Labour vs Non Hired Labour — by phase"
      icon={<HardHat size={20} />}
    >
      <p className="form-hint">
        Of the total labor hours involved in the restoration project, what
        percentage corresponds to <strong>hired labor</strong> (paid workers) and
        what percentage to <strong>non-hired labour</strong> (includes any type of
        labour that is not hired, such as family or community labour)?
      </p>
      <p className="form-hint">
        Please provide estimates for each phase. Each row must sum to{" "}
        <strong>100%</strong>.
      </p>

      {/* ── Implementation phase ──────────────────────────────── */}
      <h3 className="subsection-title">Implementation (Year 1)</h3>
      <div className="cost-distribution" style={{ marginTop: "0.25rem" }}>
        <div className="cost-distribution-header">
          <p className="cost-distribution-label">Labor hour distribution</p>
          <DistributionPie slices={[
            { label: "Hired Labour",  value: Number(implHired)  || 0, color: "#2596be" },
            { label: "Non Hired Labour", value: Number(implFamily) || 0, color: "#b45309" },
          ]} />
        </div>
        {implSum > 0 && Math.abs(implSum - 100) >= 0.01 && (
          <p className="cost-distribution-warning">
            Hired + Non Hired labour must sum to 100%. Currently: {implSum.toFixed(1)}%.
          </p>
        )}
        <div className="form-grid form-grid--2">
          <FormField
            label="Hired Labour"
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
            label="Non Hired Labour"
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
            helpText="Includes any type of labour that is not hired, such as family or community labour"
          />
        </div>
      </div>

      {/* ── Maintenance phase ──────────────────────────────────── */}
      <h3 className="subsection-title" style={{ marginTop: "1.25rem" }}>
        Maintenance (Years 2–20)
      </h3>
      <div className="cost-distribution" style={{ marginTop: "0.25rem" }}>
        <div className="cost-distribution-header">
          <p className="cost-distribution-label">Labor hour distribution</p>
          <DistributionPie slices={[
            { label: "Hired Labour",  value: Number(maintHired)  || 0, color: "#2596be" },
            { label: "Non Hired Labour", value: Number(maintFamily) || 0, color: "#b45309" },
          ]} />
        </div>
        {maintSum > 0 && Math.abs(maintSum - 100) >= 0.01 && (
          <p className="cost-distribution-warning">
            Hired + Non Hired labour must sum to 100%. Currently:{" "}
            {maintSum.toFixed(1)}%.
          </p>
        )}
        <div className="form-grid form-grid--2">
          <FormField
            label="Hired Labour"
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
            label="Non Hired Labour"
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
            helpText="Includes any type of labour that is not hired, such as family or community labour"
          />
        </div>
      </div>

      {/* ── Gender Distribution ────────────────────────────────── */}
      <h3 className="subsection-title" style={{ marginTop: "1.5rem" }}>
        Gender Distribution
      </h3>
      <p className="form-hint">
        Of the total labor hours involved in this project, what percentage is
        contributed by each gender group? Must sum to <strong>100%</strong>.
      </p>
      <div className="cost-distribution" style={{ marginTop: "0.25rem" }}>
        <div className="cost-distribution-header">
          <p className="cost-distribution-label">Gender distribution</p>
          <DistributionPie slices={[
            { label: "Male",   value: Number(genderMale)   || 0, color: "#2596be" },
            { label: "Female", value: Number(genderFemale) || 0, color: "#e91e8c" },
            { label: "Others", value: Number(genderOther)  || 0, color: "#7c3aed" },
          ]} />
        </div>
        {genderSum > 0 && Math.abs(genderSum - 100) >= 0.01 && (
          <p className="cost-distribution-warning">
            Gender distribution must sum to 100%. Currently:{" "}
            {genderSum.toFixed(1)}%.
          </p>
        )}
        <div className="form-grid form-grid--3">
          <FormField
            label="Male"
            unit="%"
            type="number"
            min="0"
            max="100"
            step="1"
            registration={register(
              "laborBreakdown.genderDistribution.male",
              { valueAsNumber: true }
            )}
            error={laborErrors?.genderDistribution?.male}
          />
          <FormField
            label="Female"
            unit="%"
            type="number"
            min="0"
            max="100"
            step="1"
            registration={register(
              "laborBreakdown.genderDistribution.female",
              { valueAsNumber: true }
            )}
            error={laborErrors?.genderDistribution?.female}
          />
          <FormField
            label="Others"
            unit="%"
            type="number"
            min="0"
            max="100"
            step="1"
            registration={register(
              "laborBreakdown.genderDistribution.other",
              { valueAsNumber: true }
            )}
            error={laborErrors?.genderDistribution?.other}
          />
        </div>
      </div>

      {/* Hired Labor Cost Reference & Machinery Unit Cost */}
      <div className="labor-rate-box" style={{ marginTop: "1.5rem" }}>
        <h5 className="labor-rate-title">Hired Labor Cost Reference</h5>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ maxWidth: "280px", flex: "1 1 240px" }}>
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
          <div style={{ maxWidth: "280px", flex: "1 1 240px" }}>
            <FormField
              label="Machinery Unit Cost"
              unit="US$/hour"
              type="number"
              min="0"
              step="0.01"
              registration={register("laborBreakdown.machineryUnitCostPerHour", {
                valueAsNumber: true,
              })}
              error={laborErrors?.machineryUnitCostPerHour}
            />
          </div>
        </div>
        <p className="labor-rate-hint">
          Average daily wage for hired field workers and hourly cost of machinery in this region.
        </p>
      </div>

      {/* Land Lease Reference */}
      <div className="labor-rate-box" style={{ marginTop: "1.5rem" }}>
        <h5 className="labor-rate-title">Land Lease Reference</h5>
        <div style={{ maxWidth: "280px" }}>
          <FormField
            label="Average Land Lease Cost"
            unit="US$/ha/year"
            type="number"
            min="0"
            step="0.01"
            registration={register("laborBreakdown.landLeaseCostPerHaPerYear", {
              valueAsNumber: true,
            })}
            error={laborErrors?.landLeaseCostPerHaPerYear}
          />
        </div>
        <p className="labor-rate-hint">
          Average annual cost to lease (rent) one hectare of land in this region.
        </p>
      </div>
    </CollapsibleSection>
  );
}
