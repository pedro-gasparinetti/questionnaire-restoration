/**
 * ContextSection
 *
 * Guides the consultant through defining the local context for the
 * restoration site. The context determines what a "favorable" vs
 * "unfavorable" scenario looks like for this region.
 *
 * The favorable scenario = best-case conditions, no extra assistance needed.
 * The unfavorable scenario = realistic worst-case for the region, where
 * specific assistance activities are required to achieve the same ecological
 * outcome.
 *
 * After setting context, the consultant selects which specific assistance
 * activities would be needed in the unfavorable scenario.
 */

import { useFormContext } from "react-hook-form";
import type { RestorationModelFormData } from "../../schemas";
import { CollapsibleSection, FormSelect } from "../ui";
import { ASSISTANCE_TYPES } from "../../constants";

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const SOIL_OPTIONS = [
  { value: "none", label: "None" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
];

const BINARY_OPTIONS = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
];

export function ContextSection() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RestorationModelFormData>();

  const ctxErrors = errors.contextVariables;
  const selectedAssistances = watch("selectedAssistances") || [];

  const handleAssistanceToggle = (id: string) => {
    const current = selectedAssistances;
    const updated = current.includes(id)
      ? current.filter((a: string) => a !== id)
      : [...current, id];
    setValue("selectedAssistances", updated, { shouldDirty: true });
  };

  return (
    <CollapsibleSection
      title="2. Context & Scenario Definition"
      subtitle="Define the local conditions and what an unfavorable scenario looks like"
    >
      <p className="form-hint">
        We need to understand the local conditions of the restoration site. This will
        help define two contrasting scenarios:
      </p>
      <ul className="form-hint-list">
        <li>
          <strong>Favorable scenario:</strong> Best-case conditions for restoration in
          this region. No additional assistance activities are needed beyond the standard
          restoration method.
        </li>
        <li>
          <strong>Unfavorable scenario:</strong> A plausible worst-case for this region,
          where contextual challenges require specific additional assistance activities
          to achieve the same ecological outcome.
        </li>
      </ul>

      <h3 className="subsection-title">Local Context Conditions</h3>
      <p className="form-hint">
        For each factor below, select the level that best describes the <strong>unfavorable
        scenario</strong> you have in mind for this region.
      </p>

      <div className="form-grid form-grid--3">
        <FormSelect
          label="Fire Risk"
          options={SEVERITY_OPTIONS}
          registration={register("contextVariables.fireRisk")}
          error={ctxErrors?.fireRisk}
        />
        <FormSelect
          label="Soil Degradation"
          options={SOIL_OPTIONS}
          registration={register("contextVariables.soilDegradation")}
          error={ctxErrors?.soilDegradation}
        />
        <FormSelect
          label="Grazing Pressure"
          options={SEVERITY_OPTIONS}
          registration={register("contextVariables.grazingPressure")}
          error={ctxErrors?.grazingPressure}
        />
        <FormSelect
          label="Invasive Species Pressure"
          options={SEVERITY_OPTIONS}
          registration={register("contextVariables.invasiveSpeciesPressure")}
          error={ctxErrors?.invasiveSpeciesPressure}
        />
        <FormSelect
          label="Human Encroachment"
          options={SEVERITY_OPTIONS}
          registration={register("contextVariables.humanEncroachment")}
          error={ctxErrors?.humanEncroachment}
        />
        <FormSelect
          label="Seed Availability Constraint"
          options={BINARY_OPTIONS}
          registration={register("contextVariables.seedAvailabilityConstraint")}
          error={ctxErrors?.seedAvailabilityConstraint}
        />
      </div>

      <h3 className="subsection-title">Required Assistance Activities</h3>
      <p className="form-hint">
        Given the unfavorable context described above, which of the following assistance
        activities would be <strong>required</strong> to achieve the same restoration
        outcome? Select all that apply.
      </p>

      <div className="checkbox-grid">
        {ASSISTANCE_TYPES.map((type) => (
          <label key={type.id} className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedAssistances.includes(type.id)}
              onChange={() => handleAssistanceToggle(type.id)}
            />
            <span>{type.label}</span>
          </label>
        ))}
      </div>

      {selectedAssistances.length > 0 && (
        <p className="form-hint" style={{ marginTop: "0.75rem" }}>
          <strong>{selectedAssistances.length}</strong> assistance
          {selectedAssistances.length > 1 ? " activities" : " activity"} selected.
          You will be asked to detail the cost of each one in the following sections.
        </p>
      )}
    </CollapsibleSection>
  );
}
