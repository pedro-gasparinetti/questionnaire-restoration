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
