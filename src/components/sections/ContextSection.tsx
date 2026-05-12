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
import { CollapsibleSection, FormField, InfoBox, CostTimelineBuilder, RevenueTimelineBuilder, ProductivityTimelineBuilder, DistributionPie } from "../ui";
import { METHOD_TABS } from "../../constants";
import type { CostSegment, MethodType, ProductivitySegment, RevenueSegment } from "../../types";
import { Sprout } from "lucide-react";

export function ContextSection() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RestorationModelFormData>();

  const currentMethodType = watch("methodType") || "anr_30";
  const methodCosts = watch("methodCosts");
  const disabledMethods: MethodType[] = watch("disabledMethods") || [];

  // Tabs visible to the user (exclude methods for which they have no data)
  const visibleTabs = METHOD_TABS.filter((t) => !disabledMethods.includes(t.id));

  const [activeTab, setActiveTab] = useState<MethodType>(currentMethodType);

  const activeTabData = METHOD_TABS.find((t) => t.id === activeTab) || METHOD_TABS[0];

  // Derive all active-tab values from the already-subscribed methodCosts snapshot.
  // Do NOT use individual watch(`methodCosts.${activeTab}.xxx`) calls — dynamic-path
  // subscriptions re-register on tab switch and deliver stale default values for one
  // render cycle before catching up with the stored data.
  const activeEntry = methodCosts?.[activeTab as MethodType];

  const implLabor   = activeEntry?.implementationDistribution?.labor    ?? 0;
  const implMach    = activeEntry?.implementationDistribution?.machinery ?? 0;
  const implMat     = activeEntry?.implementationDistribution?.materials ?? 0;
  const maintLabor  = activeEntry?.maintenanceDistribution?.labor    ?? 0;
  const maintMach   = activeEntry?.maintenanceDistribution?.machinery ?? 0;
  const maintMat    = activeEntry?.maintenanceDistribution?.materials ?? 0;
  const implCostVal    = activeEntry?.implementationCost ?? 0;
  const maintCostVal   = activeEntry?.maintenanceCost    ?? 0;
  const maintenanceSegments       = (activeEntry?.maintenanceSegments       ?? []) as CostSegment[];
  const ntfpProductivitySegments  = (activeEntry?.ntfpProductivitySegments  ?? []) as ProductivitySegment[];
  const ntfpRevenueSegments       = (activeEntry?.ntfpRevenueSegments       ?? []) as RevenueSegment[];
  const ntfpDataMode: "production" | "revenue" =
    (activeEntry?.ntfpDataMode as "production" | "revenue" | undefined) ?? "production";

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

      {visibleTabs.length === 0 ? (
        <div className="method-exclusion-notice" style={{ marginBottom: "1rem" }}>
          ⚠️ All methods have been marked as having no data. Uncheck at least one above to fill in cost information.
        </div>
      ) : (
      <>
      {/* Progress banner */}
      <div className="tabs-progress-banner">
        <div className="tabs-progress-icon">📋</div>
        <div className="tabs-progress-text">
          <strong>Complete all {visibleTabs.length} restoration methods below.</strong>{" "}
          Click each tab to fill in costs and distributions.
          <span className="tabs-progress-count">
            {visibleTabs.filter(t => isTabComplete(t.id)).length} of {visibleTabs.length} completed
          </span>
        </div>
      </div>

      <div className="method-tabs">
        <div className="method-tabs-header">
          {visibleTabs.map((tab, idx) => (
            <button
              key={tab.id}
              type="button"
              className={`method-tab ${activeTab === tab.id ? "method-tab--active" : ""} ${isTabComplete(tab.id) ? "method-tab--complete" : "method-tab--incomplete"}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <span className="tab-step-number">{idx + 1}</span>
              <span className="tab-label">{tab.title}</span>
              {isTabComplete(tab.id) ? (
                <span className="tab-badge tab-badge--done" title="Completed">✓</span>
              ) : (
                <span className="tab-badge tab-badge--pending" title="Click to fill in">⬤</span>
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
          <div className="illustration-placeholder">
            <img
              src="/assets/Restoration_example.png"
              alt="Restoration method illustration"
              className="method-illustration"
            />
          </div>

          {/* ── NTFP Species (only for NTFP tabs) ──────────────── */}
          {activeTab.endsWith("_ntfp") && (
            <div className="ntfp-species-box">
              <h4 style={{ marginTop: "0.5rem", marginBottom: "0.35rem" }}>NTFP Species</h4>
              <p className="form-hint" style={{ marginBottom: "0.5rem" }}>
                Select one native Non-Timber Forest Product (NTFP) species with good market potential in your region.
              </p>
              <div style={{ maxWidth: "480px" }}>
                <FormField
                  label="NTFP Species"
                  placeholder="e.g., Açaí (Euterpe oleracea), Babaçu (Attalea speciosa)"
                  registration={register(`methodCosts.${activeTab}.ntfpSpecies`)}
                  error={errors.methodCosts?.[activeTab]?.ntfpSpecies}
                />
              </div>
            </div>
          )}

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
            <p className="cost-distribution-hint">
              What is the average percentage of the total implementation cost that refers to labor, materials, and machinery? The three values must sum to 100%.
            </p>
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
            startYear={1}
            maxYear={20}
            value={maintenanceSegments}
            onChange={(segments: CostSegment[]) =>
              setValue(`methodCosts.${activeTab}.maintenanceSegments`, segments, { shouldDirty: true })
            }
            onTotalChange={(total) =>
              setValue(`methodCosts.${activeTab}.maintenanceCost`, total, { shouldDirty: true })
            }
            isAnrEnrichment={activeTab === "anr_30" || activeTab === "anr_30_ntfp"}
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
            <p className="cost-distribution-hint">
              What is the average percentage of the total maintenance cost that refers to labor, materials, and machinery? The three values must sum to 100%.
            </p>
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

          {/* ── NTFP Revenue (only for NTFP tabs) ───────────── */}
          {activeTab.endsWith("_ntfp") && (
            <>
              <hr className="cost-section-divider" />
              <div className="ntfp-revenue-section">
                <h4 style={{ marginTop: "1.25rem", marginBottom: "0.5rem", color: "#1a7a42" }}>
                  🌿 NTFP Revenue
                </h4>
                <p className="form-hint" style={{ marginBottom: "0.75rem" }}>
                  Estimate the expected revenue from Non-Timber Forest Products (NTFP) harvested during the maintenance period.
                </p>

                {/* ── Data mode selector ─────────────────────── */}
                <div className="ntfp-data-mode-selector" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "#f5faf6", border: "1px solid #cfe6d6", borderRadius: "6px" }}>
                  <p style={{ margin: "0 0 0.5rem", fontWeight: 600, fontSize: "0.9rem", color: "#1a7a42" }}>
                    Which NTFP data will you provide?
                  </p>
                  <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name={`ntfpDataMode-${activeTab}`}
                        value="production"
                        checked={ntfpDataMode === "production"}
                        onChange={() =>
                          setValue(`methodCosts.${activeTab}.ntfpDataMode`, "production", { shouldDirty: true })
                        }
                      />
                      <span>Productivity data (kg/ha/yr)</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name={`ntfpDataMode-${activeTab}`}
                        value="revenue"
                        checked={ntfpDataMode === "revenue"}
                        onChange={() =>
                          setValue(`methodCosts.${activeTab}.ntfpDataMode`, "revenue", { shouldDirty: true })
                        }
                      />
                      <span>Revenue data (US$/ha/yr)</span>
                    </label>
                  </div>
                  <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "#4b6354" }}>
                    Switching modes keeps the data on both sides — you can toggle freely.
                  </p>
                </div>

                {ntfpDataMode === "production" && (
                  <div style={{ marginBottom: "1rem" }}>
                    <h5 style={{ marginBottom: "0.35rem", color: "#92400e", fontSize: "0.9rem" }}>Average NTFP Productivity</h5>
                    <p className="form-hint" style={{ marginBottom: "0.5rem" }}>
                      Estimate how NTFP productivity (kg/ha/yr) changes over the maintenance period as the forest matures.
                    </p>
                    <ProductivityTimelineBuilder
                      key={`prod-${activeTab}`}
                      startYear={1}
                      maxYear={20}
                      value={ntfpProductivitySegments}
                      onChange={(segments: ProductivitySegment[]) =>
                        setValue(`methodCosts.${activeTab}.ntfpProductivitySegments`, segments, { shouldDirty: true })
                      }
                      onAverageChange={(avg) =>
                        setValue(`methodCosts.${activeTab}.ntfpProductivity`, avg, { shouldDirty: true })
                      }
                    />
                  </div>
                )}

                <div className="form-grid" style={{ maxWidth: "480px", marginBottom: "1rem" }}>
                  <FormField
                    label="Average Price during Harvesting Season"
                    unit="US$/kg"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 2.50"
                    registration={register(`methodCosts.${activeTab}.ntfpPrice`, {
                      valueAsNumber: true,
                    })}
                    error={errors.methodCosts?.[activeTab]?.ntfpPrice}
                  />
                </div>

                {ntfpDataMode === "revenue" && (
                  <>
                    <p className="form-hint" style={{ marginTop: "0.5rem" }}>
                      Add revenue segments for different year ranges. NTFP productivity may vary as the forest matures.
                    </p>
                    <RevenueTimelineBuilder
                      key={`rev-${activeTab}`}
                      startYear={1}
                      maxYear={20}
                      value={ntfpRevenueSegments}
                      onChange={(segments: RevenueSegment[]) =>
                        setValue(`methodCosts.${activeTab}.ntfpRevenueSegments`, segments, { shouldDirty: true })
                      }
                      onTotalChange={(total) =>
                        setValue(`methodCosts.${activeTab}.ntfpRevenue`, total, { shouldDirty: true })
                      }
                    />
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      </>
      )}
    </CollapsibleSection>
  );
}
