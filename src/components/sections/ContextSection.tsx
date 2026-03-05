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
import { CollapsibleSection, FormField, InfoBox, CostTimelineBuilder, DistributionPie } from "../ui";
import { METHOD_TABS } from "../../constants";
import type { MethodType } from "../../types";
import { Sprout } from "lucide-react";

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
  const disabledMethods: MethodType[] = watch("disabledMethods") || [];

  // Tabs visible to the user (exclude methods for which they have no data)
  const visibleTabs = METHOD_TABS.filter((t) => !disabledMethods.includes(t.id));

  const [activeTab, setActiveTab] = useState<MethodType>(currentMethodType);

  const activeTabData = METHOD_TABS.find((t) => t.id === activeTab) || METHOD_TABS[0];

  // Watch individual distribution fields so React re-renders on every keystroke
  const implLabor   = watch(`methodCosts.${activeTab}.implementationDistribution.labor`);
  const implMach    = watch(`methodCosts.${activeTab}.implementationDistribution.machinery`);
  const implMat     = watch(`methodCosts.${activeTab}.implementationDistribution.materials`);
  const maintLabor  = watch(`methodCosts.${activeTab}.maintenanceDistribution.labor`);
  const maintMach   = watch(`methodCosts.${activeTab}.maintenanceDistribution.machinery`);
  const maintMat    = watch(`methodCosts.${activeTab}.maintenanceDistribution.materials`);
  const implCostVal    = watch(`methodCosts.${activeTab}.implementationCost`) ?? 0;
  const maintCostVal   = watch(`methodCosts.${activeTab}.maintenanceCost`) ?? 0;

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

  // Toggle a method's disabled state
  const toggleDisabledMethod = (methodId: MethodType) => {
    const current: MethodType[] = disabledMethods || [];
    const isCurrentlyDisabled = current.includes(methodId);
    const next: MethodType[] = isCurrentlyDisabled
      ? current.filter((m) => m !== methodId)
      : [...current, methodId];
    setValue("disabledMethods", next, { shouldDirty: true });

    // If the active tab is being disabled, switch to the first still-visible tab
    if (!isCurrentlyDisabled && activeTab === methodId) {
      const firstAvailable = METHOD_TABS.find((t) => t.id !== methodId && !next.includes(t.id));
      if (firstAvailable) handleTabChange(firstAvailable.id);
    }
  };

  // Sync active tab with form state on initial render
  useEffect(() => {
    if (currentMethodType !== activeTab) {
      setActiveTab(currentMethodType);
    }
  }, [currentMethodType]); // eslint-disable-line react-hooks/exhaustive-deps

  // If active tab becomes disabled externally, switch to first visible
  useEffect(() => {
    if (disabledMethods.includes(activeTab)) {
      const firstAvailable = METHOD_TABS.find((t) => !disabledMethods.includes(t.id));
      if (firstAvailable) handleTabChange(firstAvailable.id);
    }
  }, [disabledMethods]); // eslint-disable-line react-hooks/exhaustive-deps

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
      title="2. Context &amp; Scenario Definition"
      subtitle="Define the restoration method and local conditions"
      icon={<Sprout size={20} />}
    >
      {/* ── Method Exclusion Box ───────────────────────────────── */}
      <div className="method-exclusion-box">
        <p className="method-exclusion-title">
          Are there any methods for which you have no cost information?
        </p>
        <p className="method-exclusion-hint">
          Check the methods below for which you have no cost data.
          The corresponding tab will be removed from the form.
        </p>
        <div className="method-exclusion-options">
          {METHOD_TABS.map((tab) => (
            <label key={tab.id} className="method-exclusion-option">
              <input
                type="checkbox"
                checked={disabledMethods.includes(tab.id)}
                onChange={() => toggleDisabledMethod(tab.id)}
              />
              <span>{tab.title}</span>
            </label>
          ))}
        </div>
        {disabledMethods.length > 0 && (
          <p className="method-exclusion-notice">
            ℹ️ {disabledMethods.length === METHOD_TABS.length - 1
              ? "Only one tab is visible. Please complete at least this method."
              : `${disabledMethods.length} method(s) hidden due to missing data.`}
          </p>
        )}
      </div>

      {/* ── Restoration Method Tabs ────────────────────────────── */}
      <p className="form-hint" style={{ fontSize: "0.92rem", lineHeight: 1.65, marginBottom: "1rem" }}>
        We define the restoration method initially based on <strong>soil condition</strong>{" "}
        and <strong>natural regenerating seedlings availability</strong>. The time horizon
        for the analysis is <strong>20 years</strong>.
      </p>
      <p className="form-hint" style={{ marginBottom: "1rem" }}>
        Please fill in the cost parameters for the method tabs below.
        At least one tab must be completed before you can save or export the results.
      </p>

      {visibleTabs.length === 0 ? (
        <div className="method-exclusion-notice" style={{ marginBottom: "1rem" }}>
          ⚠️ All methods have been marked as having no data. Uncheck at least one above to fill in cost information.
        </div>
      ) : (
      <div className="method-tabs">
        <div className="method-tabs-header">
          {visibleTabs.map((tab) => (
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
          <div className="illustration-placeholder">
            <img
              src="/assets/Restoration_example.png"
              alt="Restoration method illustration"
              className="method-illustration"
            />
          </div>
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
            <div className="cost-distribution-header">
              <p className="cost-distribution-label">Cost distribution</p>
              <DistributionPie slices={[
                { label: "Labor",     value: Number(implLabor) || 0, color: "#2596be" },
                { label: "Machinery", value: Number(implMach)  || 0, color: "#b45309" },
                { label: "Materials", value: Number(implMat)   || 0, color: "#7c3aed" },
              ]} />
            </div>
            {isImplDistFilled && Math.abs(implSum - 100) >= 0.01 && (
              <p className="cost-distribution-warning">
                The distribution must sum to exactly 100%. Currently: {implSum.toFixed(1)}%.
              </p>
            )}
            <div className="cost-distribution-fields">
              <FormField
                label="Labor (%)"
                type="number"
                min="0"
                max="100"
                step="1"
                registration={register(`methodCosts.${activeTab}.implementationDistribution.labor`, {
                  valueAsNumber: true,
                })}
                error={isImplDistFilled ? errors.methodCosts?.[activeTab]?.implementationDistribution?.labor : undefined}
              />
              <FormField
                label="Machinery (%)"
                type="number"
                min="0"
                max="100"
                step="1"
                registration={register(`methodCosts.${activeTab}.implementationDistribution.machinery`, {
                  valueAsNumber: true,
                })}
                error={isImplDistFilled ? errors.methodCosts?.[activeTab]?.implementationDistribution?.machinery : undefined}
              />
              <FormField
                label="Materials (%)"
                type="number"
                min="0"
                max="100"
                step="1"
                registration={register(`methodCosts.${activeTab}.implementationDistribution.materials`, {
                  valueAsNumber: true,
                })}
                error={isImplDistFilled ? errors.methodCosts?.[activeTab]?.implementationDistribution?.materials : undefined}
              />
            </div>
            {isImplDistFilled && Number(implCostVal) > 0 && (
              <p className="cost-distribution-abs">
                Labor: US$ {((Number(implLabor) || 0) / 100 * Number(implCostVal)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ha
                {" · "}Machinery: US$ {((Number(implMach) || 0) / 100 * Number(implCostVal)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ha
                {" · "}Materials: US$ {((Number(implMat) || 0) / 100 * Number(implCostVal)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ha
              </p>
            )}
            <p className="cost-distribution-examples">
              Materials: {activeTabData.implementationMaterialExamples}
            </p>


          </div>

          {/* ── Basic Maintenance Costs ────────────────────────── */}
          <hr className="cost-section-divider" />
          <h4 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>Basic Maintenance Costs (Years 2–20)</h4>
          <InfoBox
            title="What to include"
            text={activeTabData.maintenanceCostInfo}
          />
          <p className="form-hint" style={{ marginTop: "0.5rem" }}>
            Add cost segments for different year ranges. The chart updates live. The total is carried to the Maintenance Cost field below.
          </p>
          <CostTimelineBuilder
            key={activeTab}
            startYear={2}
            maxYear={20}
            onTotalChange={(total) =>
              setValue(`methodCosts.${activeTab}.maintenanceCost`, total, { shouldDirty: true })
            }
          />

          <div className="cost-distribution">
            <div className="cost-distribution-header">
              <p className="cost-distribution-label">Cost distribution</p>
              <DistributionPie slices={[
                { label: "Labor",     value: Number(maintLabor) || 0, color: "#2596be" },
                { label: "Machinery", value: Number(maintMach)  || 0, color: "#b45309" },
                { label: "Materials", value: Number(maintMat)   || 0, color: "#7c3aed" },
              ]} />
            </div>
            {isMaintDistFilled && Math.abs(maintSum - 100) >= 0.01 && (
              <p className="cost-distribution-warning">
                The distribution must sum to exactly 100%. Currently: {maintSum.toFixed(1)}%.
              </p>
            )}
            <div className="cost-distribution-fields">
              <FormField
                label="Labor (%)"
                type="number"
                min="0"
                max="100"
                step="1"
                registration={register(`methodCosts.${activeTab}.maintenanceDistribution.labor`, {
                  valueAsNumber: true,
                })}
                error={isMaintDistFilled ? errors.methodCosts?.[activeTab]?.maintenanceDistribution?.labor : undefined}
              />
              <FormField
                label="Machinery (%)"
                type="number"
                min="0"
                max="100"
                step="1"
                registration={register(`methodCosts.${activeTab}.maintenanceDistribution.machinery`, {
                  valueAsNumber: true,
                })}
                error={isMaintDistFilled ? errors.methodCosts?.[activeTab]?.maintenanceDistribution?.machinery : undefined}
              />
              <FormField
                label="Materials (%)"
                type="number"
                min="0"
                max="100"
                step="1"
                registration={register(`methodCosts.${activeTab}.maintenanceDistribution.materials`, {
                  valueAsNumber: true,
                })}
                error={isMaintDistFilled ? errors.methodCosts?.[activeTab]?.maintenanceDistribution?.materials : undefined}
              />
            </div>
            {isMaintDistFilled && Number(maintCostVal) > 0 && (
              <p className="cost-distribution-abs">
                Labor: US$ {((Number(maintLabor) || 0) / 100 * Number(maintCostVal)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ha
                {" · "}Machinery: US$ {((Number(maintMach) || 0) / 100 * Number(maintCostVal)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ha
                {" · "}Materials: US$ {((Number(maintMat) || 0) / 100 * Number(maintCostVal)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ha
              </p>
            )}
            <p className="cost-distribution-examples">
              Materials: {activeTabData.maintenanceMaterialExamples}
            </p>
          </div>
        </div>
      </div>
      )}
    </CollapsibleSection>
  );
}
