/**
 * ExportButton – Exports the current model data to a downloadable JSON file.
 *
 * The exported JSON contains every field from the RestorationModel interface.
 * This is the primary data output mechanism until a backend is available.
 */

import { Download } from "lucide-react";
import type { RestorationModelFormData } from "../schemas";
import { exportToJsonFile, generateExportFilename } from "../utils";
import { getMethodLabel } from "../constants";

interface Props {
  data: RestorationModelFormData;
  disabled?: boolean;
}

export function ExportButton({ data, disabled }: Props) {
  const handleExport = () => {
    const filename = generateExportFilename(data.ecosystem, getMethodLabel(data.methodType));
    exportToJsonFile(data, filename);
  };

  return (
    <button
      type="button"
      className="btn btn--primary"
      onClick={handleExport}
      disabled={disabled}
    >
      <Download size={16} /> Export JSON
    </button>
  );
}
