/**
 * RestorationForm – Main form orchestrator
 *
 * Narrative flow:
 *   1. Identification (ecosystem, country, method, time horizon)
 *   2. Method Costs (4 tabs with implementation + maintenance costs & distributions)
 *   3. Context Constraints & Additional Costs
 *   4. Summary & Validation
 */

import { useState } from "react";
import { FormProvider } from "react-hook-form";
import { Save } from "lucide-react";
import { useRestorationForm } from "../hooks/useRestorationForm";
import { useComputedFields } from "../hooks/useComputedFields";
import type { RestorationModelFormData } from "../schemas";
import type { RestorationModel } from "../types";
import { saveModel } from "../utils/storage";
import { atLeastOneMethodTabComplete } from "../utils/computations";

import {
  UserIdentificationSection,
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
  const { watch, reset, getValues } = form;
  const [showWarning, setShowWarning] = useState(false);

  // Watch all values for computed fields (reactive)
  const values = watch();
  const computed = useComputedFields(values);

  const methodsComplete = atLeastOneMethodTabComplete(values.methodCosts as any);

  const handleSave = () => {
    const data = getValues();
    if (!atLeastOneMethodTabComplete(data.methodCosts as any)) {
      setShowWarning(true);
      return;
    }
    saveModel(data as RestorationModel);
    setShowWarning(false);
    alert("Model saved successfully!");
    onSaved?.();
  };

  return (
    <FormProvider {...form}>
      <form className="restoration-form" noValidate>
        <UserIdentificationSection />
        <IdentificationSection />
        <ContextSection />
        <CostEstimatesSection />
        <LaborBreakdownSection />
        <SummaryValidationSection values={values} computed={computed} />

        {/* Action bar */}
        <div className="form-actions">
          {showWarning && !methodsComplete && (
            <p className="form-warning" style={{ width: "100%", margin: "0 0 0.25rem" }}>
              ⚠ Please complete at least one method tab (implementation + maintenance costs and distributions) before saving or exporting.
            </p>
          )}
          <button
            type="button"
            className="btn btn--success"
            onClick={handleSave}
          >
            <Save size={16} /> Save Model
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => reset()}
          >
            Reset Form
          </button>
          <div className="form-actions-spacer" />
          <span className="form-actions-export-label">Export your data:</span>
          <ExportButton
            data={values}
            disabled={!methodsComplete}
            onDisabledClick={() => setShowWarning(true)}
          />
        </div>
      </form>
    </FormProvider>
  );
}
