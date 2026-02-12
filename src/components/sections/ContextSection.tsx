/**
 * ContextSection
 *
 * Step 1: Tab-based restoration method selection — defines the baseline
 * ecological scenario and enrichment intensity.
 *
 * Step 2: Additional context variables (fire, grazing, invasive species,
 * encroachment) that drive assistance activity selection.
 *
 * Step 3: Assistance activity selection checkboxes.
 *
 * This component only defines the baseline ecological method and enrichment
 * intensity. Assistance cost packages are NOT implemented here.
 */

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import type { RestorationModelFormData } from "../../schemas";
import { CollapsibleSection, FormField, InfoBox } from "../ui";
import { METHOD_TABS } from "../../constants";
import type { MethodType } from "../../types";

export function ContextSection() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RestorationModelFormData>();

  const currentMethodType = watch("methodType") || "natural_regeneration";
  const currentEnrichment = watch("enrichmentIntensity");
  const methodCosts = watch("methodCosts");

  const [activeTab, setActiveTab] = useState<MethodType>(currentMethodType);

  const activeTabData = METHOD_TABS.find((t) => t.id === activeTab) || METHOD_TABS[0];

  // Watch individual distribution fields so React re-renders on every keystroke
  const implLabor   = watch(`methodCosts.${activeTab}.implementationDistribution.labor`);
  const implMach    = watch(`methodCosts.${activeTab}.implementationDistribution.machinery`);
  const implMat     = watch(`methodCosts.${activeTab}.implementationDistribution.materials`);
  const maintLabor  = watch(`methodCosts.${activeTab}.maintenanceDistribution.labor`);
  const maintMach   = watch(`methodCosts.${activeTab}.maintenanceDistribution.machinery`);
  const maintMat    = watch(`methodCosts.${activeTab}.maintenanceDistribution.materials`);

  const implSum  = (Number(implLabor) || 0) + (Number(implMach) || 0) + (Number(implMat) || 0);
  const maintSum = (Number(maintLabor) || 0) + (Number(maintMach) || 0) + (Number(maintMat) || 0);

  const isImplDistFilled  = (Number(implLabor) || 0) > 0 || (Number(implMach) || 0) > 0 || (Number(implMat) || 0) > 0;
  const isMaintDistFilled = (Number(maintLabor) || 0) > 0 || (Number(maintMach) || 0) > 0 || (Number(maintMat) || 0) > 0;

  // When tab changes, update form state
  const handleTabChange = (tabId: MethodType) => {
    setActiveTab(tabId);
    const tab = METHOD_TABS.find((t) => t.id === tabId)!;
    setValue("methodType", tabId, { shouldDirty: true });
    setValue("enrichmentIntensity", tab.defaultEnrichment, { shouldDirty: true });
  };

  // Sync active tab with form state on initial render
  useEffect(() => {
    if (currentMethodType !== activeTab) {
      setActiveTab(currentMethodType);
    }
  }, [currentMethodType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Enrichment warning for ANR tab
  const showEnrichmentWarning =
    activeTab === "anr_30" && currentEnrichment > 50;

  // Check if a tab's costs have been filled (both > 0) and distributions sum to 100%
  const isTabComplete = (tabId: string): boolean => {
    const costs = methodCosts?.[tabId as MethodType];
    if (!costs) return false;
    if (costs.implementationCost <= 0 || costs.maintenanceCost <= 0) return false;
    const id = costs.implementationDistribution;
    const md = costs.maintenanceDistribution;
    if (!id || !md) return false;
    const iSum = (Number(id.labor) || 0) + (Number(id.machinery) || 0) + (Number(id.materials) || 0);
    const mSum = (Number(md.labor) || 0) + (Number(md.machinery) || 0) + (Number(md.materials) || 0);
    return Math.abs(iSum - 100) < 0.01 && Math.abs(mSum - 100) < 0.01;
  };

  return (
    <CollapsibleSection
      title="2. Context & Scenario Definition"
      subtitle="Define the restoration method and local conditions"
    >
      {/* ── Restoration Method Tabs ────────────────────────────── */}
      <p className="form-hint">
        We define the restoration method initially based on <strong>soil condition</strong>{" "}
        and <strong>propagule availability</strong>.
      </p>
      <p className="form-hint" style={{ fontStyle: "italic", marginBottom: "1rem" }}>
        Please fill in the cost parameters for <strong>all four</strong> scenario tabs below.
        Each tab must be completed before you can save or export the results.
      </p>

      <div className="method-tabs">
        <div className="method-tabs-header">
          {METHOD_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`method-tab ${activeTab === tab.id ? "method-tab--active" : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.title}
              {isTabComplete(tab.id) ? (
                <span className="tab-badge tab-badge--done" title="Completed">✓</span>
              ) : (
                <span className="tab-badge tab-badge--pending" title="Pending">○</span>
              )}
            </button>
          ))}
        </div>

        <div className="method-tab-content" key={activeTab}>
          <div className="method-info-box">
            {activeTabData.description.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          {/* ── Basic Implementation Costs ───────────────────────── */}
          <h4 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>Basic Implementation Costs (Year 1)</h4>
          <InfoBox
            title="What to include"
            text={activeTabData.implementationCostInfo}
          />
          <div style={{ maxWidth: "320px", marginTop: "0.75rem" }}>
            <FormField
              label="Implementation Cost"
              unit="US$/ha"
              type="number"
              min="0"
              step="0.01"
              registration={register(`methodCosts.${activeTab}.implementationCost`, {
                valueAsNumber: true,
              })}
              error={errors.methodCosts?.[activeTab]?.implementationCost}
            />
          </div>

          <div className="cost-distribution">
            <p className="cost-distribution-label">
              Cost distribution <span className="cost-distribution-hint">(must sum to 100%)</span>
              {isImplDistFilled && (
                <span className={`cost-distribution-sum ${Math.abs(implSum - 100) < 0.01 ? "cost-distribution-sum--ok" : "cost-distribution-sum--warn"}`}>
                  {Math.abs(implSum - 100) < 0.01 ? "✓ 100%" : `Σ = ${implSum.toFixed(0)}%`}
                </span>
              )}
            </p>
            {!isImplDistFilled && (
              <p className="cost-distribution-warning">
                Please fill in the cost distribution for this cost category.
              </p>
            )}
            {isImplDistFilled && Math.abs(implSum - 100) >= 0.01 && (
              <p className="cost-distribution-warning">
                The distribution must sum to exactly 100%. Currently: {implSum.toFixed(1)}%.
              </p>
            )}
            <div className="cost-distribution-fields">
              <FormField
                label="Labor %"
                type="number"
                min="0"
                max="100"
                step="1"
                registration={register(`methodCosts.${activeTab}.implementationDistribution.labor`, {
                  valueAsNumber: true,
                })}
                error={errors.methodCosts?.[activeTab]?.implementationDistribution?.labor}
              />
              <FormField
                label="Machinery %"
                type="number"
                min="0"
                max="100"
                step="1"
                registration={register(`methodCosts.${activeTab}.implementationDistribution.machinery`, {
                  valueAsNumber: true,
                })}
                error={errors.methodCosts?.[activeTab]?.implementationDistribution?.machinery}
              />
              <FormField
                label="Materials %"
                type="number"
                min="0"
                max="100"
                step="1"
                registration={register(`methodCosts.${activeTab}.implementationDistribution.materials`, {
                  valueAsNumber: true,
                })}
                error={errors.methodCosts?.[activeTab]?.implementationDistribution?.materials}
              />
            </div>
            <p className="cost-distribution-examples">
              Materials: {activeTabData.implementationMaterialExamples}
            </p>
          </div>

          {/* ── Basic Maintenance Costs ────────────────────────── */}
          <h4 style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>Basic Maintenance Costs (Years 2–20)</h4>
          <InfoBox
            title="What to include"
            text={activeTabData.maintenanceCostInfo}
          />
          <div style={{ maxWidth: "320px", marginTop: "0.75rem" }}>
            <FormField
              label="Maintenance Cost"
              unit="US$/ha"
              type="number"
              min="0"
              step="0.01"
              registration={register(`methodCosts.${activeTab}.maintenanceCost`, {
                valueAsNumber: true,
              })}
              error={errors.methodCosts?.[activeTab]?.maintenanceCost}
            />
          </div>

          <div className="cost-distribution">
            <p className="cost-distribution-label">
              Cost distribution <span className="cost-distribution-hint">(must sum to 100%)</span>
              {isMaintDistFilled && (
                <span className={`cost-distribution-sum ${Math.abs(maintSum - 100) < 0.01 ? "cost-distribution-sum--ok" : "cost-distribution-sum--warn"}`}>
                  {Math.abs(maintSum - 100) < 0.01 ? "✓ 100%" : `Σ = ${maintSum.toFixed(0)}%`}
                </span>
              )}
            </p>
            {!isMaintDistFilled && (
              <p className="cost-distribution-warning">
                Please fill in the cost distribution for this cost category.
              </p>
            )}
            {isMaintDistFilled && Math.abs(maintSum - 100) >= 0.01 && (
              <p className="cost-distribution-warning">
                The distribution must sum to exactly 100%. Currently: {maintSum.toFixed(1)}%.
              </p>
            )}
            <div className="cost-distribution-fields">
              <FormField
                label="Labor %"
                type="number"
                min="0"
                max="100"
                step="1"
                registration={register(`methodCosts.${activeTab}.maintenanceDistribution.labor`, {
                  valueAsNumber: true,
                })}
                error={errors.methodCosts?.[activeTab]?.maintenanceDistribution?.labor}
              />
              <FormField
                label="Machinery %"
                type="number"
                min="0"
                max="100"
                step="1"
                registration={register(`methodCosts.${activeTab}.maintenanceDistribution.machinery`, {
                  valueAsNumber: true,
                })}
                error={errors.methodCosts?.[activeTab]?.maintenanceDistribution?.machinery}
              />
              <FormField
                label="Materials %"
                type="number"
                min="0"
                max="100"
                step="1"
                registration={register(`methodCosts.${activeTab}.maintenanceDistribution.materials`, {
                  valueAsNumber: true,
                })}
                error={errors.methodCosts?.[activeTab]?.maintenanceDistribution?.materials}
              />
            </div>
            <p className="cost-distribution-examples">
              Materials: {activeTabData.maintenanceMaterialExamples}
            </p>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
