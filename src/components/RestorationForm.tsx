/**
 * RestorationForm – Main form orchestrator
 *
 * Narrative flow:
 *   1. Identification (ecosystem, country, method, time horizon)
 *   2. Method Costs (4 tabs with implementation + maintenance costs & distributions)
 *   3. Context Constraints & Additional Costs
 *   4. Summary & Validation
 */

import { useRef, useState } from "react";
import { FormProvider } from "react-hook-form";
import { Download, Upload } from "lucide-react";
import { useRestorationForm } from "../hooks/useRestorationForm";
import type { RestorationModelFormData } from "../schemas";
import { atLeastOneMethodTabComplete } from "../utils/computations";

import {
  UserIdentificationSection,
  IdentificationSection,
  ContextSection,
  CostEstimatesSection,
  LaborBreakdownSection,
  SummaryValidationSection,
  CBAResultsSection,
} from "./sections";
import { ExportButton } from "./ExportButton";

interface Props {
  /** If provided, pre-fills the form with an existing model for editing */
  initialData?: Partial<RestorationModelFormData>;
  /** Called after a successful save to refresh the saved models list */
  onSaved?: () => void;
}

export function RestorationForm({ initialData }: Props) {
  const form = useRestorationForm(initialData);
  const { watch, reset } = form;
  const [showWarning, setShowWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Watch all values to recompute derived UI (e.g., method-completion status)
  const values = watch();

  const methodsComplete = atLeastOneMethodTabComplete(values.methodCosts as any);

  const handleSaveForm = () => {
    const json = JSON.stringify(values, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const name = values.respondentName || values.userName || "questionnaire";
    const date = new Date().toISOString().slice(0, 10);
    a.download = `${name.replace(/\s+/g, "_")}_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        reset(data);
      } catch {
        alert("Invalid JSON file. Please select a valid form data file.");
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be loaded again
    e.target.value = "";
  };

  return (
    <FormProvider {...form}>
      <form className="restoration-form" noValidate>
        {/* Instructions box */}
        <div className="info-box" style={{ marginBottom: "1.25rem" }}>
          <div className="info-box-header">
            <strong>Please read before answering</strong>
          </div>
          <div className="info-box-body">
            <p>Each questionnaire entry corresponds to a single ecosystem. GPS coordinates of any area that represents the model in question may be used.</p>
            <p>The restoration method is defined based on soil conditions and the availability of naturally regenerating seedlings. The analysis horizon is 20 years. Before starting, indicate which methods have no cost data available — the corresponding tabs will be removed from the form. All selected methods must be fully completed.</p>
            <p><strong>For each method, fill in Implementation (Year 1) and Maintenance (Years 2–20):</strong></p>
            <p><strong>Basic Implementation Costs (Year 1):</strong> Include the minimum cost required to initiate restoration under the method's conditions. For ANR/50% Enrichment, for example, this includes all base natural regeneration activities plus localized enrichment planting at 50% intensity (seedling acquisition, planting labor, and localized soil correction).</p>
            <p><strong>Do not include:</strong> invasive species control, fencing, fire management, or any other activities beyond basic implementation — these must be modeled as constraint costs in Section 3.</p>
            <p><strong>Basic Maintenance Costs (Years 2–20):</strong> Enter the total accumulated cost over the entire maintenance period (Years 2 to 20), not the annual cost. Include minimal follow-up activities such as survival checks, limited replacement of failed seedlings, NTFP harvesting, and light monitoring.</p>
            <p><strong>Do not include:</strong> invasive species control, fencing, firebreak maintenance, pest management, or any other costs related to external constraints — these must be modeled separately in Section 3.</p>
            <p>The form allows you to split the maintenance period into segments with different costs (e.g., more intensive early years vs. later years). The chart updates in real time as segments are added.</p>
            <p><strong>Context Constraints &amp; Additional Costs (Section 3):</strong> Given an unfavorable scenario with contextual constraints, estimate the additional cost required to overcome those constraints and achieve the same level of ecological success as in a favorable scenario. These costs are the same across all methods, so this section is filled in only once. Pay attention to the unit of each cost field.</p>
            <p>The system automatically generates a <strong>Summary &amp; Validation</strong> at the end with all calculations. Watch out for the following common errors flagged by the form:</p>
            <ul style={{ margin: "0 0 0.4rem 1.2rem", padding: 0, fontSize: "0.82rem", lineHeight: 1.55, color: "#374151" }}>
              <li style={{ marginBottom: "0.25rem" }}>Percentage distributions that do not sum to 100% in any section</li>
              <li style={{ marginBottom: "0.25rem" }}>Confusion between annual cost and total accumulated cost in the maintenance section</li>
              <li style={{ marginBottom: "0.25rem" }}>Inclusion of constraint costs (fire, fencing, invasive species, pests) within basic costs — these must appear exclusively in Section 3</li>
              <li>Leaving methods incomplete without marking them as having no data at the beginning of Section 2</li>
            </ul>
          </div>
        </div>

        <UserIdentificationSection />
        <IdentificationSection />
        <ContextSection />
        <CostEstimatesSection />
        <LaborBreakdownSection />
        <SummaryValidationSection />
        <CBAResultsSection values={values} />

        {/* Action bar */}
        <div className="form-actions">
          {showWarning && !methodsComplete && (
            <p className="form-warning" style={{ width: "100%", margin: "0 0 0.25rem" }}>
              ⚠ Please complete at least one method tab (implementation + maintenance costs and distributions) before saving or exporting.
            </p>
          )}
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              if (window.confirm("Are you sure you want to reset the form? All unsaved data will be lost.")) {
                reset();
              }
            }}
          >
            Reset Form
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleSaveForm}
          >
            <Download size={16} /> Save Form
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} /> Load Form
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleLoadForm}
          />
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
