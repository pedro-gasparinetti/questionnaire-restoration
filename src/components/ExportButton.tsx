/**
 * ExportButton – Exports the current model data as JSON or CSV.
 *
 * JSON: full structured object.
 * CSV: two-column flat table (Field, Value) with dot-notation keys.
 */

import { Download } from "lucide-react";
import type { RestorationModelFormData } from "../schemas";
import type { RestorationModel } from "../types";
import { generateExportFilename } from "../utils";
import { exportToXlsxFile } from "../utils/storage";
import { getMethodLabel } from "../constants";

interface Props {
  data: RestorationModelFormData;
  disabled?: boolean;
  onDisabledClick?: () => void;
}

export function ExportButton({ data, disabled, onDisabledClick }: Props) {
  const filename = generateExportFilename(data.ecosystem, getMethodLabel(data.methodType));

  const handleXlsx = () => {
    if (disabled) { onDisabledClick?.(); return; }
    exportToXlsxFile(data as RestorationModel, filename.replace(/\.json$/, ".xlsx"));
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <button
        type="button"
        className={`btn btn--success${disabled ? " btn--faded" : ""}`}
        onClick={handleXlsx}
      >
        <Download size={16} /> Export Excel
      </button>
    </div>
  );
}
