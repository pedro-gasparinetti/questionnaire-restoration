/**
 * ExportButton – Exports the current model data as JSON or CSV.
 *
 * JSON: full structured object.
 * CSV: two-column flat table (Field, Value) with dot-notation keys.
 */

import { Download } from "lucide-react";
import type { RestorationModelFormData } from "../schemas";
import { exportToJsonFile, exportToCsvFile, generateExportFilename } from "../utils";
import { getMethodLabel } from "../constants";

interface Props {
  data: RestorationModelFormData;
  disabled?: boolean;
  onDisabledClick?: () => void;
}

export function ExportButton({ data, disabled, onDisabledClick }: Props) {
  const filename = generateExportFilename(data.ecosystem, getMethodLabel(data.methodType));

  const handleJson = () => {
    if (disabled) { onDisabledClick?.(); return; }
    exportToJsonFile(data, filename);
  };

  const handleCsv = () => {
    if (disabled) { onDisabledClick?.(); return; }
    exportToCsvFile(data, filename.replace(/\.json$/, ".csv"));
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <button
        type="button"
        className={`btn btn--primary${disabled ? " btn--faded" : ""}`}
        onClick={handleJson}
      >
        <Download size={16} /> Export JSON
      </button>
      <button
        type="button"
        className={`btn btn--secondary${disabled ? " btn--faded" : ""}`}
        onClick={handleCsv}
      >
        <Download size={16} /> Export CSV
      </button>
    </div>
  );
}
