/**
 * SummaryTable – Reusable read-only table for the summary section.
 *
 * Renders a simple HTML table with optional row-level styling
 * (totals, warnings, highlights).
 */

import React from "react";

export interface SummaryRow {
  /** Label shown in the first column */
  label: string;
  /** Values for subsequent columns */
  values: (string | number | React.ReactNode)[];
  /** Optional CSS class applied to the <tr> */
  className?: string;
}

interface SummaryTableProps {
  /** Optional table caption rendered as <caption> */
  caption?: string;
  /** Column headers */
  headers: string[];
  /** Data rows */
  rows: SummaryRow[];
}

export function SummaryTable({ caption, headers, rows }: SummaryTableProps) {
  return (
    <table className="summary-table">
      {caption && <caption>{caption}</caption>}
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={row.className ?? ""}>
            <td>{row.label}</td>
            {row.values.map((v, j) => (
              <td key={j}>{v}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
