/**
 * SummaryValidationSection – Final review panel
 *
 * Displays a read-only summary of all entered data and computed fields
 * so the consultant can verify data consistency before saving/exporting.
 */

import type { RestorationModelFormData } from "../../schemas";
import type { ComputedFields } from "../../types";
import { ASSISTANCE_TYPES } from "../../constants";
import { CollapsibleSection } from "../ui";
import { formatUSD } from "../../utils";

interface Props {
  values: RestorationModelFormData;
  computed: ComputedFields;
}

const getAssistLabel = (id: string) =>
  ASSISTANCE_TYPES.find((t) => t.id === id)?.label || id;

export function SummaryValidationSection({ values, computed }: Props) {
  return (
    <CollapsibleSection
      title="6. Summary & Validation"
      subtitle="Review all data and check consistency before saving"
      defaultOpen={false}
    >
      {/* Identification */}
      <div className="summary-block">
        <h4>Model Identification</h4>
        <dl className="summary-dl">
          <dt>Ecosystem</dt>
          <dd>{values.ecosystem || "—"}</dd>
          <dt>Country</dt>
          <dd>{values.country || "—"}</dd>
          <dt>Method</dt>
          <dd>{values.method || "—"}</dd>
          <dt>Time Horizon</dt>
          <dd>{values.timeHorizon} years</dd>
        </dl>
      </div>

      {/* Selected assistances */}
      <div className="summary-block">
        <h4>Selected Assistance Activities</h4>
        {values.selectedAssistances?.length > 0 ? (
          <ul style={{ margin: "0.25rem 0", paddingLeft: "1.25rem", fontSize: "0.85rem" }}>
            {values.selectedAssistances.map((id: string) => (
              <li key={id}>{getAssistLabel(id)}</li>
            ))}
          </ul>
        ) : (
          <p className="form-empty">None selected</p>
        )}
      </div>

      {/* Cost Estimates */}
      <div className="summary-block">
        <h4>Favorable Scenario</h4>
        <dl className="summary-dl">
          <dt>Total Cost</dt>
          <dd>{formatUSD(values.favorableScenario?.totalCost ?? 0)}/ha</dd>
          <dt>Implementation</dt>
          <dd>{formatUSD(values.favorableScenario?.implementationCost ?? 0)}/ha</dd>
          <dt>Maintenance</dt>
          <dd>{formatUSD(values.favorableScenario?.maintenanceCost ?? 0)}/ha</dd>
          <dt>Factor Shares</dt>
          <dd>
            Labor {values.favorableFactorShares?.labor ?? 0}% ·{" "}
            Materials {values.favorableFactorShares?.materials ?? 0}% ·{" "}
            Machinery {values.favorableFactorShares?.machinery ?? 0}%
          </dd>
        </dl>
      </div>

      <div className="summary-block">
        <h4>Unfavorable Scenario</h4>
        <dl className="summary-dl">
          <dt>Total Cost (declared)</dt>
          <dd>{formatUSD(values.unfavorableScenario?.totalCost ?? 0)}/ha</dd>
          <dt>Implementation</dt>
          <dd>{formatUSD(values.unfavorableScenario?.implementationCost ?? 0)}/ha</dd>
          <dt>Maintenance</dt>
          <dd>{formatUSD(values.unfavorableScenario?.maintenanceCost ?? 0)}/ha</dd>
        </dl>
      </div>

      {/* Assistance breakdown */}
      {computed.costBreakdownSummary.length > 0 && (
        <div className="summary-block">
          <h4>Assistance Cost Breakdown</h4>
          <table className="summary-table">
            <thead>
              <tr>
                <th>Activity</th>
                <th>Cost (US$/ha)</th>
                <th>Phase</th>
              </tr>
            </thead>
            <tbody>
              {computed.costBreakdownSummary.map((item, i) => (
                <tr key={i}>
                  <td>{getAssistLabel(item.name)}</td>
                  <td>{formatUSD(item.costPerHa)}</td>
                  <td>{item.phase}</td>
                </tr>
              ))}
              <tr className="summary-table-total">
                <td><strong>Total Assistance</strong></td>
                <td><strong>{formatUSD(computed.totalAssistanceCost)}</strong></td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Reconciliation */}
      <div className="summary-block">
        <h4>Reconciliation</h4>
        <dl className="summary-dl">
          <dt>Computed Unfavorable</dt>
          <dd>{formatUSD(computed.computedUnfavorableCost)}/ha</dd>
          <dt>Declared Unfavorable</dt>
          <dd>{formatUSD(values.unfavorableScenario?.totalCost ?? 0)}/ha</dd>
          <dt>Interaction Adjustment</dt>
          <dd>{formatUSD(values.interactionAdjustment ?? 0)}/ha</dd>
          <dt>Difference</dt>
          <dd className={computed.isWithinTolerance ? "status-ok" : "status-warn"}>
            {formatUSD(computed.differenceFromDeclared)}
            {computed.isWithinTolerance ? " ✓" : " ⚠"}
          </dd>
        </dl>
      </div>
    </CollapsibleSection>
  );
}
