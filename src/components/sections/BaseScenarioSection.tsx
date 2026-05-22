/**
 * CostEstimatesSection
 *
 * Context constraints that apply independently of the restoration method.
 * Each constraint card captures: cost (unit varies per constraint), phase (implementation/maintenance),
 * and factor-of-production distribution (labor / machinery / materials).
 */

import { useState, useEffect, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import type { RestorationModelFormData } from "../../schemas";
import { CollapsibleSection, FormField } from "../ui";
import { Coins } from "lucide-react";

const CONTEXT_CONSTRAINTS = [
  { key: "fireRisk" as const, label: "Firebreak / Fire Risk", unit: "US$/km" },
  { key: "grazingPressure" as const, label: "Fencing / Grazing Pressure", unit: "US$/km" },
  { key: "invasiveSpeciesPressure" as const, label: "Weed Control / Invasive Species Pressure", unit: "US$/ha" },
  { key: "pestControl" as const, label: "Pest Control / Pest Infestation Risk", unit: "US$/ha" },
];

/** Convert US$/ha to US$/km assuming a square property of a given area. */
function haToKm(costPerHa: number, areaHa: number): number | null {
  if (!areaHa || areaHa <= 0 || !costPerHa || isNaN(costPerHa)) return null;
  // Square with area A ha → perimeter = 0.4·√A km
  // cost/km = (cost/ha × A) / (0.4·√A) = cost/ha × √A / 0.4
  return costPerHa * Math.sqrt(areaHa) / 0.4;
}

export function CostEstimatesSection() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RestorationModelFormData>();

  /* ---------- US$/ha → US$/km helper state ---------- */
  const [fireRiskPerHa, setFireRiskPerHa] = useState("");
  const [grazingPerHa, setGrazingPerHa] = useState("");

  const firebreakArea = watch("contextVariables.fireRisk.firebreakArea");
  const grazingArea = watch("contextVariables.grazingPressure.occurrences");

  const applyConversion = useCallback(
    (key: "fireRisk" | "grazingPressure", costPerHa: number, area: number) => {
      const result = haToKm(costPerHa, area);
      if (result !== null) {
        setValue(`contextVariables.${key}.cost`, Math.round(result * 100) / 100, { shouldDirty: true });
      }
    },
    [setValue],
  );

  // Re-convert when area changes (if a US$/ha value was entered)
  useEffect(() => {
    const v = parseFloat(fireRiskPerHa);
    if (!isNaN(v) && v > 0) applyConversion("fireRisk", v, firebreakArea);
  }, [firebreakArea, fireRiskPerHa, applyConversion]);

  useEffect(() => {
    const v = parseFloat(grazingPerHa);
    if (!isNaN(v) && v > 0) applyConversion("grazingPressure", v, grazingArea);
  }, [grazingArea, grazingPerHa, applyConversion]);

  const ctxErrors = errors.contextVariables;

  return (
    <CollapsibleSection
      title="3. Context Constraints &amp; Additional Costs"
      subtitle="Costs that apply independently of the restoration method"
      icon={<Coins size={20} />}
    >
      <p className="form-hint">
        Given an unfavourable scenario with contextual constraints, estimate the{" "}
        <strong>additional cost</strong> required to overcome these constraints
        and achieve the same level of ecological success as in a favourable scenario.
        These additional activities would have the same costs for all methods, so you
        need to fill this up just once. Pay attention to the unit of each cost field.
      </p>

      {CONTEXT_CONSTRAINTS.map((c) => {
        const costVal   = watch(`contextVariables.${c.key}.cost`);
        const occurrences = watch(`contextVariables.${c.key}.occurrences`);
        const distLabor = watch(`contextVariables.${c.key}.distribution.labor`);
        const distMach  = watch(`contextVariables.${c.key}.distribution.machinery`);
        const distMat   = watch(`contextVariables.${c.key}.distribution.materials`);
        const distSum   = (Number(distLabor) || 0) + (Number(distMach) || 0) + (Number(distMat) || 0);
        const distFilled = distSum > 0;
        const totalCost = (Number(costVal) || 0) * (Number(occurrences) || 0);

        return (
          <div key={c.key} className="constraint-card">
            <h4 className="constraint-card-title">{c.label}</h4>

            <p className="form-hint" style={{ marginBottom: "0.75rem", fontSize: "0.85rem" }}>
              {c.key === "grazingPressure"
                ? "Consider the linear cost (1 km = 1000 m) and the total area of each lot that probably will need to be fenced (ha). You can enter the cost directly in US$/km, or type US$/ha and it will be converted automatically."
                : c.key === "fireRisk"
                  ? "Consider the linear cost (1 km = 1000 m) and the total area that needs fire breaks. You can enter the cost directly in US$/km, or type US$/ha and it will be converted automatically."
                  : "Consider the total number of times this activity will need to occur over the 20-year project horizon (including both implementation and maintenance phases)."}
            </p>

            {/* ── Cost fields: US$/km + optional US$/ha helper (fire & fence only) ── */}
            <div
              className={`form-grid${(c.key === "fireRisk" || c.key === "grazingPressure") ? " form-grid--3" : ""}`}
              style={{ maxWidth: (c.key === "fireRisk" || c.key === "grazingPressure") ? "720px" : "480px" }}
            >
              <FormField
                label="Unit Cost"
                unit={c.unit}
                type="number"
                min="0"
                step="0.01"
                registration={register(`contextVariables.${c.key}.cost`, { valueAsNumber: true })}
                error={ctxErrors?.[c.key]?.cost}
              />

              {(c.key === "fireRisk" || c.key === "grazingPressure") && (
                <div className="form-field">
                  <label className="form-label">
                    or enter per hectare
                    <span className="form-unit"> (US$/ha)</span>
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="optional"
                    value={c.key === "fireRisk" ? fireRiskPerHa : grazingPerHa}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (c.key === "fireRisk") setFireRiskPerHa(raw);
                      else setGrazingPerHa(raw);
                      const v = parseFloat(raw);
                      const area = c.key === "fireRisk" ? firebreakArea : grazingArea;
                      if (!isNaN(v) && v > 0 && area > 0) {
                        applyConversion(c.key, v, area);
                      }
                    }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.2rem", display: "block" }}>
                    {(() => {
                      const area = c.key === "fireRisk" ? firebreakArea : grazingArea;
                      if (!area || area <= 0) return "Fill in the area field to enable conversion";
                      const v = parseFloat(c.key === "fireRisk" ? fireRiskPerHa : grazingPerHa);
                      if (isNaN(v) || v <= 0) return `Converts to US$/km using √(${area} ha)`;
                      const result = haToKm(v, area);
                      return result !== null ? `= ${result.toFixed(2)} US$/km` : "";
                    })()}
                  </span>
                </div>
              )}

              <FormField
                label={c.key === "grazingPressure" ? "Average area that needs fences in one typical property" : "Number of occurrences over 20 years"}
                unit={c.key === "grazingPressure" ? "ha" : "times"}
                type="number"
                min="0"
                step={c.key === "grazingPressure" ? "0.01" : "1"}
                placeholder={c.key === "grazingPressure" ? "e.g., 10" : "e.g., 5"}
                registration={register(`contextVariables.${c.key}.occurrences`, { valueAsNumber: true })}
                error={ctxErrors?.[c.key]?.occurrences}
              />
              {c.key === "fireRisk" && (
                <FormField
                  label="Average total area that needs fire breaks"
                  unit="ha"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 50"
                  registration={register(`contextVariables.fireRisk.firebreakArea`, { valueAsNumber: true })}
                  error={ctxErrors?.fireRisk?.firebreakArea}
                />
              )}
            </div>
            {totalCost > 0 && (
              <p style={{ fontSize: "0.85rem", color: "#374151", margin: "0.25rem 0 0.5rem", fontWeight: 500 }}>
                Total cost: US$ {totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}

            <div className="cost-distribution" style={{ marginTop: "0.5rem" }}>
              <p className="cost-distribution-label">
                Cost distribution
                {distFilled && (
                  <span className={`cost-distribution-sum ${Math.abs(distSum - 100) < 0.01 ? "cost-distribution-sum--ok" : "cost-distribution-sum--warn"}`}>
                    {Math.abs(distSum - 100) < 0.01 ? "✓ 100%" : `Σ = ${distSum.toFixed(0)}%`}
                  </span>
                )}
              </p>
              {distFilled && Math.abs(distSum - 100) >= 0.01 && (
                <p className="cost-distribution-warning">
                  The distribution must sum to exactly 100%. Currently: {distSum.toFixed(1)}%.
                </p>
              )}
              {!distFilled && (
                <p className="cost-distribution-warning">
                  Please fill in the cost distribution for this cost category (must sum to 100%).
                </p>
              )}
              <div className="cost-distribution-fields">
                <FormField
                  label="Labor (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  registration={register(`contextVariables.${c.key}.distribution.labor`, { valueAsNumber: true })}
                  error={ctxErrors?.[c.key]?.distribution?.labor}
                />
                <FormField
                  label="Machinery (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  registration={register(`contextVariables.${c.key}.distribution.machinery`, { valueAsNumber: true })}
                  error={ctxErrors?.[c.key]?.distribution?.machinery}
                />
                <FormField
                  label="Materials (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  registration={register(`contextVariables.${c.key}.distribution.materials`, { valueAsNumber: true })}
                  error={ctxErrors?.[c.key]?.distribution?.materials}
                />
              </div>
              {distFilled && Number(costVal) > 0 && (
                <p className="cost-distribution-abs">
                  Labor: US$ {((Number(distLabor) || 0) / 100 * Number(costVal)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{c.unit.replace("US$/", "")}
                  {" · "}Machinery: US$ {((Number(distMach) || 0) / 100 * Number(costVal)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{c.unit.replace("US$/", "")}
                  {" · "}Materials: US$ {((Number(distMat) || 0) / 100 * Number(costVal)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{c.unit.replace("US$/", "")}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </CollapsibleSection>
  );
}
