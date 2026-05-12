/**
 * ExportButton — Exports the current model data as an .xlsx file.
 *
 * Sheet structure: see src/utils/storage.ts (Data + Metadata).
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
    <button
      type="button"
      className={`btn btn--success${disabled ? " btn--faded" : ""}`}
      onClick={handleXlsx}
    >
      <Download size={16} /> Export Excel
    </button>
  );
}
