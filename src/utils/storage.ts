/**
 * Local Storage persistence for saved Restoration Models.
 * This is a mock persistence layer — to be replaced by backend API calls
 * in a future iteration.
 */

import type { RestorationModel } from "../types";
import { STORAGE_KEY } from "../constants";

export interface SavedModel {
  id: string;
  savedAt: string;
  data: RestorationModel;
}

/**
 * Load all saved models from local storage.
 */
export function loadModels(): SavedModel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedModel[];
  } catch {
    console.warn("Failed to load models from local storage.");
    return [];
  }
}

/**
 * Save a model to local storage. Generates a unique ID and timestamp.
 */
export function saveModel(data: RestorationModel): SavedModel {
  const models = loadModels();
  const entry: SavedModel = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    data,
  };
  models.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
  return entry;
}

/**
 * Delete a saved model by ID.
 */
export function deleteModel(id: string): void {
  const models = loadModels().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
}

/**
 * Export a model (or any object) as a downloadable JSON file.
 */
export function exportToJsonFile(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------

/**
 * Recursively flatten a nested object into an array of [key, value] pairs
 * using dot-notation for nested objects and bracket-notation for array items.
 */
function flattenObject(
  obj: unknown,
  prefix = "",
  rows: [string, string][] = []
): [string, string][] {
  if (obj === null || obj === undefined) {
    rows.push([prefix, ""]);
  } else if (Array.isArray(obj)) {
    if (obj.length === 0) {
      rows.push([prefix, ""]);
    } else {
      obj.forEach((item, i) => flattenObject(item, `${prefix}[${i}]`, rows));
    }
  } else if (typeof obj === "object") {
    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) =>
      flattenObject(v, prefix ? `${prefix}.${k}` : k, rows)
    );
  } else {
    rows.push([prefix, String(obj)]);
  }
  return rows;
}

/**
 * Escape a CSV cell value (wrap in quotes if it contains comma, quote, or newline).
 */
function csvCell(value: string): string {
  if (/[,"\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/**
 * Export a model as a downloadable two-row CSV file:
 * Row 1 = headers (dot-notation field names), Row 2 = values.
 */
export function exportToCsvFile(data: unknown, filename: string): void {
  const rows = flattenObject(data);
  const headers = rows.map(([k]) => csvCell(k)).join(",");
  const values  = rows.map(([, v]) => csvCell(v)).join(",");
  const csv = `${headers}\n${values}`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
