/**
 * RestorationForm – Main form orchestrator
 *
 * Narrative flow:
 *   1. Identification (ecosystem, country, method, time horizon)
 *   2. Context & Scenario Definition (context variables + assistance selection)
 *   3. Cost Estimates (favorable + unfavorable aggregate costs)
 *   4. Assistance Cost Breakdown (per-activity costs + reconciliation)
 *   5. Factor of Production Shares (base + each assistance)
 *   6. Summary & Validation
 */

import { FormProvider } from "react-hook-form";
import { Save } from "lucide-react";
import { useRestorationForm } from "../hooks/useRestorationForm";
import { useComputedFields } from "../hooks/useComputedFields";
import type { RestorationModelFormData } from "../schemas";
import type { RestorationModel } from "../types";
import { saveModel } from "../utils/storage";

import {
  IdentificationSection,
  ContextSection,
  CostEstimatesSection,
  AssistanceDetailSection,
  FactorSharesSection,
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

  const onSubmit = (data: RestorationModelFormData) => {
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
        <AssistanceDetailSection computed={computed} />
        <FactorSharesSection />
        <SummaryValidationSection values={values} computed={computed} />

        {/* Action bar */}
        <div className="form-actions">
          <button type="submit" className="btn btn--success">
            <Save size={16} /> Save Model
          </button>
          <ExportButton data={values} />
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
