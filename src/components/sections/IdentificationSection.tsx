/**
 * IdentificationSection
 *
 * First step: identify the ecosystem, country, restoration method,
 * and time horizon for this model specification.
 */

import { useFormContext } from "react-hook-form";
import type { RestorationModelFormData } from "../../schemas";
import { CollapsibleSection, FormField, FormSelect } from "../ui";
import { ECOSYSTEM_OPTIONS, METHOD_OPTIONS } from "../../constants";

export function IdentificationSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<RestorationModelFormData>();

  return (
    <CollapsibleSection
      title="1. Project Identification"
      subtitle="Tell us about the restoration project you are evaluating"
    >
      <p className="form-hint">
        Each model specification applies to one <strong>ecosystem × restoration method</strong>{" "}
        combination. Please identify the project below.
      </p>

      <div className="form-grid">
        <FormSelect
          label="Ecosystem"
          options={ECOSYSTEM_OPTIONS}
          placeholder="Select ecosystem…"
          registration={register("ecosystem")}
          error={errors.ecosystem}
        />

        <FormField
          label="Country"
          placeholder="e.g., Brazil"
          registration={register("country")}
          error={errors.country}
        />

        <FormSelect
          label="Restoration Method"
          options={METHOD_OPTIONS}
          placeholder="Select method…"
          registration={register("method")}
          error={errors.method}
        />

        <FormField
          label="Time Horizon"
          unit="years"
          type="number"
          min="1"
          step="1"
          registration={register("timeHorizon", { valueAsNumber: true })}
          error={errors.timeHorizon}
        />
      </div>
    </CollapsibleSection>
  );
}
