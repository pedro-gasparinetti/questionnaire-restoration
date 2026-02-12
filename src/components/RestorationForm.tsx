/**
 * RestorationForm – Main form orchestrator
 *
 * Narrative flow:
 *   1. Identification (ecosystem, country, method, time horizon)
 *   2. Method Costs (4 tabs with implementation + maintenance costs & distributions)
 *   3. Additional Context Variables & Constraints
 *   4. Summary & Validation
 */

import { FormProvider } from "react-hook-form";
import { Save } from "lucide-react";
import { useRestorationForm } from "../hooks/useRestorationForm";
import { useComputedFields } from "../hooks/useComputedFields";
import type { RestorationModelFormData } from "../schemas";
import type { RestorationModel } from "../types";
import { saveModel } from "../utils/storage";
import { allMethodTabsComplete } from "../utils/computations";

import {
  IdentificationSection,
  ContextSection,
  CostEstimatesSection,
  LaborBreakdownSection,
  SummaryValidationSection,
} from "./sections";
import { ExportButton } from "./ExportButton";

interface Props {
  /** If provided, pre-fills the form with an existing model for editing */
  initialData?: Partial<RestorationModelFormData>;
  /** Called after a successful save to refresh the saved models list */
  onSaved?: () => void;
}

export function RestorationForm({ initialData, onSaved }: Props) {
  const form = useRestorationForm(initialData);
  const { handleSubmit, watch, reset } = form;

  // Watch all values for computed fields (reactive)
  const values = watch();
  const computed = useComputedFields(values);

  const methodsComplete = allMethodTabsComplete(values.methodCosts as any);

  const onSubmit = (data: RestorationModelFormData) => {
    if (!allMethodTabsComplete(data.methodCosts as any)) {
      alert("Please fill in the implementation and maintenance costs for all four method tabs before saving.");
      return;
    }
    // Save to local storage (mock persistence)
    saveModel(data as RestorationModel);
    alert("Model saved successfully!");
    onSaved?.();
  };

  return (
    <FormProvider {...form}>
      <form className="restoration-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <IdentificationSection />
        <ContextSection />
        <CostEstimatesSection />
        <LaborBreakdownSection />
        <SummaryValidationSection values={values} computed={computed} />

        {/* Action bar */}
        <div className="form-actions">
          {!methodsComplete && (
            <p className="form-warning" style={{ gridColumn: "1 / -1", margin: "0 0 0.5rem" }}>
              ⚠ Please complete the implementation and maintenance costs in all four
              method tabs before saving or exporting.
            </p>
          )}
          <button type="submit" className="btn btn--success" disabled={!methodsComplete}>
            <Save size={16} /> Save Model
          </button>
          <ExportButton data={values} disabled={!methodsComplete} />
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => reset()}
          >
            Reset Form
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
